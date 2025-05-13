
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, AlertTriangle } from 'lucide-react';
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
import { useQuery } from '@tanstack/react-query';
import { Issue } from '@/types';

interface IssueFormProps {
  onIssueCreated?: () => void;
  initialProjectId?: string;
  initialData?: Issue;
  isEditing?: boolean;
}

const IssueForm: React.FC<IssueFormProps> = ({ 
  onIssueCreated, 
  initialProjectId, 
  initialData,
  isEditing = false
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(initialProjectId || '');
  const [priority, setPriority] = useState('Medium');
  const [reportedBy, setReportedBy] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [status, setStatus] = useState('Open');

  // Fetch projects from database
  const { data: projects } = useQuery({
    queryKey: ['projects-for-issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch team members for selection
  const { data: teamMembers } = useQuery({
    queryKey: ['team-members-for-issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const priorities = [
    'Low',
    'Medium',
    'High',
    'Critical'
  ];

  const statuses = [
    'Open',
    'In Progress',
    'Resolved'
  ];

  // Set project ID from prop when available
  useEffect(() => {
    if (initialProjectId) {
      setProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  // Populate form with issue data when in edit mode
  useEffect(() => {
    if (isEditing && initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setProjectId(initialData.project_id);
      setPriority(initialData.priority);
      setStatus(initialData.status);
      
      // For reported_by and assigned_to, handle both string IDs and User objects
      if (typeof initialData.reported_by === 'string') {
        setReportedBy(initialData.reported_by);
      } else if (initialData.reported_by) {
        setReportedBy(initialData.reported_by.id);
      }
      
      if (typeof initialData.assigned_to === 'string') {
        setAssignedTo(initialData.assigned_to);
      } else if (initialData.assigned_to) {
        setAssignedTo(initialData.assigned_to.id);
      }
    }
  }, [isEditing, initialData]);

  const formatUserName = (user: any) => {
    if (!user) return '';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !projectId || !priority) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const issueData = {
        title,
        description,
        project_id: projectId,
        priority,
        reported_by: reportedBy === "unassigned" ? null : reportedBy,
        assigned_to: assignedTo === "unassigned" ? null : assignedTo,
        status
      };

      if (isEditing && initialData) {
        // Update existing issue
        const { error } = await supabase
          .from('issues')
          .update(issueData)
          .eq('id', initialData.id);
        
        if (error) throw error;
        
        toast({
          title: "Issue updated",
          description: "The issue has been updated successfully.",
        });
      } else {
        // Insert new issue
        const { error } = await supabase
          .from('issues')
          .insert({
            ...issueData,
            status: 'Open',
            report_date: new Date().toISOString(),
          });
        
        if (error) throw error;
        
        toast({
          title: "Issue reported",
          description: "Your issue has been reported successfully.",
        });
      }
      
      setOpen(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setProjectId(initialProjectId || '');
      setPriority('Medium');
      setReportedBy('');
      setAssignedTo('');
      setStatus('Open');
      
      // Notify parent component
      if (onIssueCreated) {
        onIssueCreated();
      }
    } catch (error: any) {
      console.error("Error submitting issue:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit issue. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogTitle = isEditing ? "Edit Issue" : "Report New Issue";
  const submitBtnText = isEditing ? "Update Issue" : "Submit Issue";
  const triggerBtn = isEditing ? (
    <Button variant="outline" onClick={() => setOpen(true)}>
      Edit Issue
    </Button>
  ) : (
    <Button className="bg-construction-700 hover:bg-construction-800">
      <Plus className="h-4 w-4 mr-2" /> Report Issue
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerBtn}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Issue Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="project">Project</Label>
                <Select 
                  value={projectId} 
                  onValueChange={setProjectId} 
                  disabled={isEditing}
                  required
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority} required>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priorityName) => (
                      <SelectItem key={priorityName} value={priorityName}>
                        {priorityName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="reportedBy">Reported By</Label>
                <Select value={reportedBy} onValueChange={setReportedBy}>
                  <SelectTrigger id="reportedBy">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers?.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {formatUserName(member) || member.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger id="assignedTo">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers?.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {formatUserName(member) || member.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus} required>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((statusName) => (
                      <SelectItem key={statusName} value={statusName}>
                        {statusName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide details about the issue"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                  Submitting...
                </>
              ) : (
                <>
                  {isEditing ? (
                    "Save Changes"
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      {submitBtnText}
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IssueForm;
