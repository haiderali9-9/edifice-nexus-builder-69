
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { File, FileText, Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Document } from '@/types';
import { supabase } from '@/lib/supabase';

interface DocumentSelectorProps {
  projectId: string;
  onDocumentSelected: () => void;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({ projectId, onDocumentSelected }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchDocuments();
    }
  }, [open]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // Fetch documents that haven't been linked to this project yet
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .is('project_id', null);
      
      if (error) throw error;
      
      setDocuments(data as Document[]);
      console.log("Available documents:", data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Failed to load documents",
        description: "Could not load available documents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDocument = async (document: Document) => {
    try {
      // Update the document to assign it to the current project
      const { error } = await supabase
        .from('documents')
        .update({ project_id: projectId })
        .eq('id', document.id);
      
      if (error) throw error;
      
      toast({
        title: "Document linked",
        description: `${document.name} has been linked to this project.`,
      });
      
      setOpen(false);
      onDocumentSelected();
    } catch (error) {
      console.error('Error linking document:', error);
      toast({
        title: "Failed to link document",
        description: "Could not link the document to this project. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case "Blueprint":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "Contract":
        return <File className="h-4 w-4 text-purple-500" />;
      case "Permit":
        return <File className="h-4 w-4 text-green-500" />;
      case "Invoice":
        return <FileText className="h-4 w-4 text-amber-500" />;
      case "Report":
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Blueprint":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Blueprint</Badge>;
      case "Contract":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Contract</Badge>;
      case "Permit":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Permit</Badge>;
      case "Invoice":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">Invoice</Badge>;
      case "Report":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Report</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Other</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-construction-700 hover:bg-construction-800">
          <Plus className="h-4 w-4 mr-2" /> Link Existing Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Link Existing Document to Project</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-4">
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-construction-600" />
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDocumentTypeIcon(document.type)}
                            <span className="font-medium">{document.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(document.type)}</TableCell>
                        <TableCell>
                          {new Date(document.upload_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm"
                            onClick={() => handleSelectDocument(document)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No documents available to link
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentSelector;
