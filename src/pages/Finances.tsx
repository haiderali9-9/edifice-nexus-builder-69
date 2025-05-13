
import React, { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, PlusCircle, Receipt, Wallet, ArrowUpDown, BadgeDollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import TransactionList, { FinancialTransaction } from "@/components/finances/TransactionList";
import TransactionForm from "@/components/finances/TransactionForm";
import InvoiceForm from "@/components/finances/InvoiceForm";
import InvoiceList, { Invoice } from "@/components/finances/InvoiceList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Finances = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("transactions");
  const { toast } = useToast();
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | undefined>(undefined);

  // Fetch financial transactions
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions, 
    refetch: refetchTransactions 
  } = useQuery({
    queryKey: ['financial-transactions'],
    queryFn: async () => {
      console.log("Fetching financial transactions");
      const { data: transactionsData, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          projects:project_id (name)
        `)
        .order('date', { ascending: false });
      
      if (error) {
        console.error("Error fetching transactions:", error);
        throw error;
      }
      
      // Transform the data to include project name
      return transactionsData.map((transaction: any) => ({
        ...transaction,
        project_name: transaction.projects?.name
      })) || [];
    }
  });
  
  // Fetch invoices
  const {
    data: invoices = [],
    isLoading: isLoadingInvoices,
    refetch: refetchInvoices
  } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      console.log("Fetching invoices");
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          projects:project_id (name)
        `)
        .order('due_date', { ascending: false });
      
      if (error) {
        console.error("Error fetching invoices:", error);
        throw error;
      }
      
      return data.map((invoice: any) => ({
        ...invoice,
        project: invoice.projects?.name || ""
      })) || [];
    }
  });
  
  // Delete transaction mutation
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetchTransactions();
      toast({
        title: "Transaction deleted",
        description: "The transaction has been deleted successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting transaction",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  });

  // Update invoice status mutation
  const updateInvoiceStatus = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string, status: Invoice['status'] }) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', invoiceId);
      
      if (error) throw error;
      return { invoiceId, status };
    },
    onSuccess: () => {
      refetchInvoices();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating invoice",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  });

  // Calculate financial summary
  const calculateSummary = () => {
    const income = transactions
      .filter((t: FinancialTransaction) => t.type === 'income')
      .reduce((sum: number, t: FinancialTransaction) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter((t: FinancialTransaction) => t.type === 'expense')
      .reduce((sum: number, t: FinancialTransaction) => sum + Math.abs(t.amount), 0);
    
    const balance = income - expenses;
    
    const pendingInvoices = invoices
      .filter(i => i.status === 'sent' || i.status === 'overdue')
      .reduce((sum, i) => sum + i.amount, 0);
    
    return { income, expenses, balance, pendingInvoices };
  };
  
  const { income, expenses, balance, pendingInvoices } = calculateSummary();
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction: FinancialTransaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionFormOpen(true);
  };

  // Handle transaction form complete
  const handleTransactionFormComplete = () => {
    setSelectedTransaction(undefined);
    refetchTransactions();
  };

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter((transaction: FinancialTransaction) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      transaction.description?.toLowerCase().includes(searchTermLower) ||
      transaction.category?.toLowerCase().includes(searchTermLower) ||
      transaction.project_name?.toLowerCase().includes(searchTermLower)
    );
  });
  
  // Filter invoices based on search term
  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      invoice.number.toLowerCase().includes(searchTermLower) ||
      invoice.client.toLowerCase().includes(searchTermLower) ||
      invoice.project?.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <PageLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finances</h1>
          <p className="text-gray-500 mt-1">
            Track income, expenses, and invoices for your projects
          </p>
        </div>
      </div>

      {/* Financial summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowUpDown className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold">{formatCurrency(income)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Wallet className="h-5 w-5 text-red-500 mr-2" />
              <div className="text-2xl font-bold">{formatCurrency(expenses)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BadgeDollarSign className="h-5 w-5 text-blue-500 mr-2" />
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Receipt className="h-5 w-5 text-amber-500 mr-2" />
              <div className="text-2xl font-bold">{formatCurrency(pendingInvoices)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Search ${activeTab}...`}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {activeTab === 'transactions' && (
                <Button 
                  onClick={() => {
                    setSelectedTransaction(undefined);
                    setIsTransactionFormOpen(true);
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Transaction
                </Button>
              )}
              {activeTab === 'invoices' && <InvoiceForm onInvoiceCreated={refetchInvoices} />}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Financial Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="flex justify-center py-10">
                  <p className="text-gray-500">Loading transactions...</p>
                </div>
              ) : (
                <TransactionList 
                  transactions={filteredTransactions}
                  onEdit={handleEditTransaction}
                  onDelete={(id) => deleteTransaction.mutateAsync(id)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoices">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingInvoices ? (
                <div className="flex justify-center py-10">
                  <p className="text-gray-500">Loading invoices...</p>
                </div>
              ) : (
                <InvoiceList 
                  invoices={filteredInvoices}
                  onStatusChange={(invoiceId, newStatus) => 
                    updateInvoiceStatus.mutateAsync({ invoiceId, status: newStatus })
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction form dialog */}
      <TransactionForm 
        transaction={selectedTransaction}
        isOpen={isTransactionFormOpen}
        onOpenChange={setIsTransactionFormOpen}
        onComplete={handleTransactionFormComplete}
      />
    </PageLayout>
  );
};

export default Finances;
