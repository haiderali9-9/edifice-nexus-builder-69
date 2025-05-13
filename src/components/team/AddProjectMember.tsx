import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

interface AddProjectMemberProps {
  projectId: string;
  onMemberAdded?: () => void;
  onClose?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  role?: string;
}

const roles = [
  'Project Manager',
  'Construction Manager',
  'Site Engineer',
  'Cost Estimator',
  'Safety Officer'
];

export const AddProjectMember: React.FC<AddProjectMemberProps> = ({
  projectId,
  onMemberAdded,
  onClose,
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [role, setRole] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role');
        
        if (error) throw error;
        setUsers(data as UserProfile[] || []);
      } catch (error) {
        console.error("Error fetching profiles:", error);
        toast({
          title: "Error loading team members",
          description: "Failed to load available team members.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !role) {
      toast({
        title: "Missing information",
        description: "Please select a team member and role",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          project_id: projectId,
          user_id: selectedUser,
          role: role
        });
      
      if (error) throw error;
      
      toast({
        title: "Team member added",
        description: "The team member has been added to the project.",
      });
      
      setSelectedUser('');
      setRole('');
      onOpenChange(false);
      
      if (onMemberAdded) {
        onMemberAdded();
      }

      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error("Error adding team member:", error);
      toast({
        title: "Error adding team member",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Team Member to Project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user">Select Team Member</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser} required>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} {user.role ? `(${user.role})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">Project Role</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                  Adding...
                </>
              ) : (
                'Add Team Member'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
