import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type PendingUser = Database['public']['Tables']['profiles']['Row'] & {
  email: string;
};

type UserRole = Database['public']['Enums']['app_role'];

const PendingUserRequests: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingUsers, setProcessingUsers] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching pending users...');
      // First fetch inactive profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', false);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }
      
      if (!profilesData || profilesData.length === 0) {
        console.log('No pending users found');
        setPendingUsers([]);
        setIsLoading(false);
        return;
      }
      
      console.log('Found pending profiles:', profilesData);
      
      // Then fetch the corresponding auth users to get emails
      const userIds = profilesData.map(profile => profile.id);
      
      // Get the current session for auth header
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        console.error('No access token available');
        throw new Error('Authentication required');
      }
      
      console.log('Calling get-user-emails edge function with user IDs:', userIds);
      
      // Using the Edge Function to get user emails
      const { data: functionData, error: functionError } = await supabase.functions.invoke('get-user-emails', {
        body: { userIds },
      });
      
      if (functionError) {
        console.error('Error invoking get-user-emails function:', functionError);
        // Continue with profiles data even if we couldn't get emails
        setPendingUsers(profilesData as PendingUser[]);
        toast({
          title: 'Warning',
          description: 'Could not fetch user emails',
          variant: 'destructive',
        });
      } else {
        console.log('Received function response:', functionData);
        
        // Merge profile data with email data
        const enhancedUsers = profilesData.map(profile => {
          const userWithEmail = functionData.users?.find((user: any) => user.id === profile.id);
          return {
            ...profile,
            email: userWithEmail?.email || 'Email not available'
          };
        });
        
        console.log('Enhanced users with emails:', enhancedUsers);
        setPendingUsers(enhancedUsers as PendingUser[]);
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending user requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const approveUser = async (userId: string, role: UserRole) => {
    setProcessingUsers(prev => ({ ...prev, [userId]: true }));
    try {
      console.log(`Approving user ${userId} with role ${role}`);
      
      // Update is_active status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // Set the user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: userId, 
          role: role
        });
        
      if (roleError) {
        console.error('Error setting role:', roleError);
        // If the user already has a role assigned, update it
        if (roleError.code === '23505') { // Unique violation error code
          const { error: updateError } = await supabase
            .from('user_roles')
            .update({ role: role })
            .eq('user_id', userId);
          
          if (updateError) {
            console.error('Error updating role:', updateError);
            throw updateError;
          }
        } else {
          throw roleError;
        }
      }

      toast({
        title: 'User Approved',
        description: 'User has been approved and granted access.',
        variant: 'default',
      });

      // Refresh the list
      fetchPendingUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve user',
        variant: 'destructive',
      });
    } finally {
      setProcessingUsers(prev => ({ ...prev, [userId]: false }));
    }
  };

  const rejectUser = async (userId: string) => {
    setProcessingUsers(prev => ({ ...prev, [userId]: true }));
    try {
      console.log(`Rejecting user ${userId}`);
      
      // Keep the profile but mark it as rejected or remove it entirely
      // For this example, we'll keep it with a rejected flag
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting profile:', error);
        throw error;
      }

      toast({
        title: 'User Rejected',
        description: 'User request has been rejected',
        variant: 'default',
      });

      // Remove from the list
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject user',
        variant: 'destructive',
      });
    } finally {
      setProcessingUsers(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          <Badge variant="outline" className="mr-2 bg-yellow-50 text-yellow-700 border-yellow-300">
            Pending
          </Badge>
          User Access Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingUsers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Assign Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Select 
                      onValueChange={(value: UserRole) => approveUser(user.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => rejectUser(user.id)}
                      disabled={processingUsers[user.id]}
                    >
                      {processingUsers[user.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1" />
                      )}
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No pending user requests
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingUserRequests;
