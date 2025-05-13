
import React, { useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ProfessionalInfo from '@/components/settings/ProfessionalInfo';

interface TeamMemberEditProps {
  memberId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onMemberUpdated?: () => void;
}

const TeamMemberEdit: React.FC<TeamMemberEditProps> = ({ 
  memberId, 
  isOpen, 
  onClose,
  onMemberUpdated 
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    role: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState<boolean>(false);

  // Fetch current user - optimized with useCallback
  const fetchCurrentUser = useCallback(async () => {
    if (!isOpen) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        // Check if current user is editing their own profile
        setCanEdit(session.user.id === memberId);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }, [memberId, isOpen]);

  // Fetch member data - optimized with useCallback
  const fetchMemberData = useCallback(async () => {
    if (!memberId || !isOpen) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', memberId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          position: data.position || '',
          department: data.department || '',
          role: data.role || '',
        });
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load member information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [memberId, isOpen, toast]);

  // Use separate effects to prevent cascade updates
  useEffect(() => {
    if (isOpen) {
      fetchCurrentUser();
    }
  }, [isOpen, fetchCurrentUser]);

  useEffect(() => {
    if (isOpen && memberId) {
      fetchMemberData();
    }
  }, [isOpen, memberId, fetchMemberData]);

  // Reset form data when the sheet is closed
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        role: '',
      });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberId) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
        })
        .eq('id', memberId);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Member information updated successfully',
      });
      
      if (onMemberUpdated) {
        // Use setTimeout to prevent freezing
        setTimeout(() => {
          onMemberUpdated();
        }, 0);
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member information',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfessionalUpdate = async (data: { position: string; department: string; role: string }) => {
    if (!memberId) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          position: data.position,
          department: data.department,
          role: data.role
        })
        .eq('id', memberId);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Professional information updated successfully',
      });
      
      // Use setTimeout to prevent freezing
      if (onMemberUpdated) {
        setTimeout(() => {
          onMemberUpdated();
        }, 0);
      }
    } catch (error) {
      console.error('Error updating professional info:', error);
      toast({
        title: 'Error',
        description: 'Failed to update professional information',
        variant: 'destructive',
      });
    }
  };

  // Use memo for the form content
  const formContent = !isLoading ? (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              disabled={!canEdit}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              disabled={!canEdit}
            />
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={!canEdit}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={!canEdit}
          />
        </div>
        
        {canEdit && (
          <SheetFooter className="pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : 'Save Changes'}
            </Button>
          </SheetFooter>
        )}
      </form>

      <div className="pt-6">
        <ProfessionalInfo
          initialData={{
            position: formData.position,
            department: formData.department,
            role: formData.role
          }}
          onUpdate={handleProfessionalUpdate}
          readOnly={!canEdit}
        />
      </div>
    </>
  ) : (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Team Member</SheetTitle>
        </SheetHeader>
        {formContent}
      </SheetContent>
    </Sheet>
  );
};

export default TeamMemberEdit;
