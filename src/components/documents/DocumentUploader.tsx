
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FilePlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface DocumentUploaderProps {
  projectId?: string;
  onDocumentUploaded?: () => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ projectId, onDocumentUploaded }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectId || null);
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);

  React.useEffect(() => {
    // If no projectId is provided, fetch available projects
    if (!projectId) {
      const fetchProjects = async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name');
        
        if (!error && data) {
          setProjects(data);
        }
      };
      
      fetchProjects();
    }
  }, [projectId]);

  const documentTypes = ['Blueprint', 'Contract', 'Permit', 'Invoice', 'Report', 'Other'];

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!documentName || !documentType || !file) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields and select a file",
        variant: "destructive"
      });
      return;
    }

    // If not in project context, ensure a project is selected
    if (!projectId && !selectedProjectId) {
      toast({
        title: "Project required",
        description: "Please select a project for this document",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Generate a unique filename to prevent collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${projectId || selectedProjectId}/${fileName}`;
      
      console.log("Uploading file to path:", filePath);
      
      // Upload file to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase
        .storage
        .from('project_documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('project_documents')
        .getPublicUrl(filePath);
      
      if (!publicUrlData.publicUrl) throw new Error("Failed to get public URL");
      
      console.log("File uploaded successfully, public URL:", publicUrlData.publicUrl);
      
      // Insert document record in the database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          project_id: projectId || selectedProjectId,
          name: documentName,
          type: documentType,
          url: publicUrlData.publicUrl,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id || null
        });
      
      if (dbError) throw dbError;
      
      toast({
        title: "Document uploaded",
        description: `${documentName} has been uploaded successfully.`,
      });
      
      // Reset form
      setDocumentName('');
      setDocumentType('');
      setFile(null);
      setOpen(false);
      
      // Notify parent component
      if (onDocumentUploaded) {
        onDocumentUploaded();
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-construction-700 hover:bg-construction-800">
          <FilePlus className="h-4 w-4 mr-2" /> Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleUpload}>
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Document Name</Label>
              <Input
                id="name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Enter document name"
                required
              />
            </div>
            
            {!projectId && (
              <div className="grid gap-2">
                <Label htmlFor="project">Project</Label>
                <Select value={selectedProjectId || ''} onValueChange={setSelectedProjectId} required>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="type">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType} required>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="file">Document File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploader;
