
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import TeamMemberForm from '@/components/team/TeamMemberForm';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
}

interface ProjectTeamProps {
  projectId: string;
  projectName: string;
}

const ProjectTeam: React.FC<ProjectTeamProps> = ({ projectId, projectName }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  
  // Fetch team members from database
  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch team members from the join table
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select(`
          id,
          role,
          user_id,
          profiles (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('project_id', projectId);
      
      if (teamError) throw teamError;
      
      // Transform the data into the format we need, fixing the type issue
      const formattedMembers = teamData.map(item => {
        // Extract the profile from the response correctly
        const profile = item.profiles as unknown as { 
          id: string; 
          first_name: string | null; 
          last_name: string | null; 
          avatar_url: string | null 
        };
        
        return {
          id: item.id,
          user_id: item.user_id,
          name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown User',
          role: item.role,
          avatar: profile?.avatar_url,
          first_name: profile?.first_name,
          last_name: profile?.last_name
        };
      });
      
      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast({
        title: "Error fetching team members",
        description: "Failed to load the project team data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load team members when component mounts
  useEffect(() => {
    fetchTeamMembers();
  }, [projectId]);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };
  
  const handleAddMember = () => {
    setShowAddMemberForm(true);
  };

  const handleMemberAdded = () => {
    fetchTeamMembers();
    setShowAddMemberForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Project Team</h3>
        <Button size="sm" onClick={handleAddMember}>
          <PlusCircle className="h-4 w-4 mr-2" /> Add Member
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading team members...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center p-4 border rounded-lg bg-white hover:bg-gray-50"
              >
                <Avatar className="h-10 w-10 mr-4">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="bg-construction-100 text-construction-700">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <Badge variant="outline" className="mt-1">{member.role}</Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
              No team members assigned to this project yet.
            </div>
          )}
        </div>
      )}
      
      {showAddMemberForm && (
        <TeamMemberForm 
          onMemberAdded={handleMemberAdded} 
          projectId={projectId}
          onClose={() => setShowAddMemberForm(false)}
        />
      )}
    </div>
  );
};

export default ProjectTeam;
