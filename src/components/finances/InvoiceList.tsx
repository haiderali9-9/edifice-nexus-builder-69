
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, MoreHorizontal, Eye, Send, Check, Clock, Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface Invoice {
  id: string;
  number: string;
  client: string;
  project: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
}

interface InvoiceListProps {
  invoices: Invoice[];
  onStatusChange: (invoiceId: string, newStatus: Invoice['status']) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onStatusChange }) => {
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Sent</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAction = (action: string, invoice: Invoice) => {
    switch (action) {
      case 'view':
        toast({
          title: "Viewing invoice",
          description: `Opening invoice ${invoice.number}`,
        });
        break;
      case 'download':
        toast({
          title: "Download started",
          description: `Downloading invoice ${invoice.number}`,
        });
        break;
      case 'send':
        onStatusChange(invoice.id, 'sent');
        toast({
          title: "Invoice sent",
          description: `Invoice ${invoice.number} has been sent to the client`,
        });
        break;
      case 'mark-paid':
        onStatusChange(invoice.id, 'paid');
        toast({
          title: "Invoice marked as paid",
          description: `Invoice ${invoice.number} has been marked as paid`,
        });
        break;
      case 'mark-overdue':
        onStatusChange(invoice.id, 'overdue');
        toast({
          title: "Invoice marked as overdue",
          description: `Invoice ${invoice.number} has been marked as overdue`,
        });
        break;
      case 'revert-to-draft':
        onStatusChange(invoice.id, 'draft');
        toast({
          title: "Invoice reverted to draft",
          description: `Invoice ${invoice.number} has been reverted to draft status`,
        });
        break;
      default:
        break;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Issue Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[60px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.length > 0 ? (
          invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.number}</TableCell>
              <TableCell>{invoice.client}</TableCell>
              <TableCell>{invoice.project}</TableCell>
              <TableCell>{formatCurrency(invoice.amount)}</TableCell>
              <TableCell>{formatDate(invoice.issueDate)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span>{formatDate(invoice.dueDate)}</span>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleAction('view', invoice)}>
                      <Eye className="h-4 w-4 mr-2" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('download', invoice)}>
                      <Download className="h-4 w-4 mr-2" /> Download
                    </DropdownMenuItem>
                    {invoice.status === 'draft' && (
                      <DropdownMenuItem onClick={() => handleAction('send', invoice)}>
                        <Send className="h-4 w-4 mr-2" /> Send to Client
                      </DropdownMenuItem>
                    )}
                    {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                      <DropdownMenuItem onClick={() => handleAction('mark-paid', invoice)}>
                        <Check className="h-4 w-4 mr-2" /> Mark as Paid
                      </DropdownMenuItem>
                    )}
                    {invoice.status === 'sent' && (
                      <DropdownMenuItem onClick={() => handleAction('mark-overdue', invoice)}>
                        <Clock className="h-4 w-4 mr-2" /> Mark as Overdue
                      </DropdownMenuItem>
                    )}
                    {invoice.status !== 'draft' && (
                      <DropdownMenuItem onClick={() => handleAction('revert-to-draft', invoice)}>
                        <Ban className="h-4 w-4 mr-2" /> Revert to Draft
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-10 text-gray-500">
              No invoices found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default InvoiceList;
