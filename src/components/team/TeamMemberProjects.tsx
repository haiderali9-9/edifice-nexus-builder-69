
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface TeamMemberProjectsProps {
  memberId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Project {
  id: string;
  name: string;
  status: string;
  role: string;
}

const TeamMemberProjects: React.FC<TeamMemberProjectsProps> = ({ 
  memberId, 
  isOpen, 
  onClose 
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [memberName, setMemberName] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMemberProjects = async () => {
      if (!memberId) return;
      
      setIsLoading(true);
      try {
        // First, get member name
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', memberId)
          .maybeSingle();

        if (profileError) throw profileError;
        
        if (profileData) {
          setMemberName(`${profileData.first_name || ''} ${profileData.last_name || ''}`.trim());
        }

        // Then, get projects this member is part of
        const { data: teamData, error: teamError } = await supabase
          .from('team_members')
          .select(`
            role,
            project_id,
            projects:project_id (
              id,
              name,
              status
            )
          `)
          .eq('user_id', memberId);

        if (teamError) throw teamError;
        
        // Transform the data into the format we need
        const projectsList = teamData.map(item => ({
          id: item.projects?.id || '',
          name: item.projects?.name || 'Unknown Project',
          status: item.projects?.status || 'Unknown',
          role: item.role || 'Team Member'
        }));
        
        setProjects(projectsList);
      } catch (error) {
        console.error('Error fetching member projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && memberId) {
      fetchMemberProjects();
    }
  }, [memberId, isOpen]);

  const handleViewProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'in progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on hold':
        return 'bg-amber-100 text-amber-800';
      case 'planning':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{memberName ? `${memberName}'s Projects` : 'Team Member Projects'}</SheetTitle>
        </SheetHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : projects.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">This team member is not assigned to any projects.</p>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{project.name}</h3>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-500 mb-3">Role: {project.role}</p>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full" 
                  onClick={() => handleViewProject(project.id)}
                >
                  View Project <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default TeamMemberProjects;
