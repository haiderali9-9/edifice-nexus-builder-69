
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FinancialTransaction } from './TransactionList';

const TRANSACTION_CATEGORIES = [
  'Materials',
  'Labor',
  'Equipment',
  'Permits',
  'Utilities',
  'Subcontractor',
  'Transportation',
  'Insurance',
  'Rent',
  'Supplies',
  'Maintenance',
  'Other',
];

interface TransactionFormProps {
  transaction?: FinancialTransaction;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  transaction, 
  isOpen, 
  onOpenChange,
  onComplete
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!transaction;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState('');
  const [projectId, setProjectId] = useState('');

  // Fetch projects for dropdown
  const { data: projectsList = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Set form values when editing
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(String(Math.abs(transaction.amount)));
      setDescription(transaction.description || '');
      
      // Format date for input
      try {
        const formattedDate = format(new Date(transaction.date), 'yyyy-MM-dd');
        setDate(formattedDate);
      } catch (e) {
        setDate(transaction.date);
      }
      
      setCategory(transaction.category || '');
      setProjectId(transaction.project_id || '');
    } else {
      resetForm();
    }
  }, [transaction]);

  // Create or update transaction mutation
  const mutateTransaction = useMutation({
    mutationFn: async (transactionData: any) => {
      if (isEditing) {
        const { data, error } = await supabase
          .from('financial_transactions')
          .update(transactionData)
          .eq('id', transaction!.id)
          .select();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('financial_transactions')
          .insert(transactionData)
          .select();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      onOpenChange(false);
      
      toast({
        title: isEditing ? "Transaction updated" : "Transaction created",
        description: isEditing 
          ? `Transaction has been updated successfully.` 
          : `New ${type} has been recorded successfully.`,
      });
      
      resetForm();
      
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error: any) => {
      toast({
        title: isEditing ? "Error updating transaction" : "Error creating transaction",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!amount || !description || !date) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than zero",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Adjust amount based on type (negative for expense, positive for income)
      const adjustedAmount = type === 'income' ? amountValue : -amountValue;
      
      await mutateTransaction.mutateAsync({
        type,
        amount: adjustedAmount,
        description,
        date,
        category: category || null,
        project_id: projectId || null
      });
    } catch (error) {
      console.error("Error in form submission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setDescription('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setCategory('');
    setProjectId('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Transaction' : 'Record New Transaction'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Transaction Type</Label>
              <Select value={type} onValueChange={(value: 'income' | 'expense') => setType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this transaction for?"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="project">Project (Optional)</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {projectsList.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                  {isEditing ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update' : 'Save'} Transaction
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
