
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Mail, Phone, Building, Briefcase, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TeamMemberProfileProps {
  memberId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  position: string | null;
  department: string | null;
  avatar_url: string | null;
}

const TeamMemberProfile: React.FC<TeamMemberProfileProps> = ({ memberId, isOpen, onClose }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!memberId || !isOpen) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', memberId)
          .maybeSingle();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [memberId, isOpen]);

  // Reset profile when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setProfile(null);
    }
  }, [isOpen]);

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  };

  const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Team Member Profile</SheetTitle>
        </SheetHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : !profile ? (
          <div className="text-center pt-8 pb-8 text-gray-500">
            Profile not found
          </div>
        ) : (
          <div className="py-6">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={profile.avatar_url || undefined} alt={fullName} />
                <AvatarFallback className="bg-construction-100 text-construction-700 text-xl">
                  {getInitials(profile.first_name, profile.last_name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-center">{fullName}</h2>
              <Badge variant="outline" className="mt-1">
                {profile.role || 'No role assigned'}
              </Badge>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm text-gray-500">Position</Label>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{profile.position || 'Not specified'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-500">Department</Label>
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{profile.department || 'Not specified'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-500">Contact</Label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{profile.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{profile.phone || 'No phone provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default TeamMemberProfile;
