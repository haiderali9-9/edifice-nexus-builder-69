
import React, { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Briefcase,
  Loader2
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TeamMemberForm from "@/components/team/TeamMemberForm";
import TeamMemberProfile from "@/components/team/TeamMemberProfile";
import TeamMemberEdit from "@/components/team/TeamMemberEdit";
import TeamMemberProjects from "@/components/team/TeamMemberProjects";
import PendingUserRequests from "@/components/team/PendingUserRequests";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  role: string;
  avatar_url?: string | null;
  position?: string;
  department?: string;
}

const Team = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();
  
  // State for member actions
  const [viewProfileMemberId, setViewProfileMemberId] = useState<string | null>(null);
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [viewProjectsMemberId, setViewProjectsMemberId] = useState<string | null>(null);

  // Fetch team members from the database
  useEffect(() => {
    const fetchTeamMembers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_active', true);
        
        if (error) throw error;
        
        setTeamMembers(data as TeamMember[]);
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast({
          title: "Error fetching team members",
          description: "Failed to load team members from the database.",
          variant: "destructive"
        });
        
        // Set default team members if there's an error or no data
        setTeamMembers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  // Filter team members based on search term
  const filteredTeamMembers = teamMembers.filter(member => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  const handleMemberAdded = async () => {
    // Refresh the team members list
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      
      setTeamMembers(data as TeamMember[]);
    } catch (error) {
      console.error("Error refreshing team members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProfile = (member: TeamMember) => {
    setViewProfileMemberId(member.id);
  };

  const handleEditMember = (member: TeamMember) => {
    setEditMemberId(member.id);
  };

  const handleViewProjects = (member: TeamMember) => {
    setViewProjectsMemberId(member.id);
  };

  return (
    <PageLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-gray-500 mt-1">
            Manage and coordinate your team members
          </p>
        </div>
        {isAdmin && <TeamMemberForm onMemberAdded={handleMemberAdded} />}
      </div>

      {/* Show pending user requests section only for admins */}
      {isAdmin && <PendingUserRequests />}

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search team members..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading team members...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeamMembers.length > 0 ? (
                  filteredTeamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar_url || undefined} alt={`${member.first_name} ${member.last_name}`} />
                            <AvatarFallback className="bg-construction-100 text-construction-700">
                              {getInitials(member.first_name || '', member.last_name || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            {`${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unnamed Member'}
                            <div className="text-xs text-gray-500">
                              {member.position || 'No position'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.role || 'N/A'}</TableCell>
                      <TableCell>{member.department || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{member.email || 'Not specified'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{member.phone || 'Not specified'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="bg-transparent p-2 rounded-full hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProfile(member)}>
                              View Profile
                            </DropdownMenuItem>
                            {isAdmin && (
                              <DropdownMenuItem onClick={() => handleEditMember(member)}>
                                Edit Member
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleViewProjects(member)}>
                              View Projects
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                      No team members found matching your search criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Profile Modal */}
      <TeamMemberProfile
        memberId={viewProfileMemberId}
        isOpen={viewProfileMemberId !== null}
        onClose={() => setViewProfileMemberId(null)}
      />

      {/* Edit Member Modal */}
      <TeamMemberEdit
        memberId={editMemberId}
        isOpen={editMemberId !== null}
        onClose={() => setEditMemberId(null)}
        onMemberUpdated={handleMemberAdded}
      />

      {/* View Projects Modal */}
      <TeamMemberProjects
        memberId={viewProjectsMemberId}
        isOpen={viewProjectsMemberId !== null}
        onClose={() => setViewProjectsMemberId(null)}
      />
    </PageLayout>
  );
};

export default Team;
