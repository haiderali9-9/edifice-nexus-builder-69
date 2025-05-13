
import React from 'react';
import { AddProjectMember } from './AddProjectMember';
import { InviteTeamMember } from './InviteTeamMember';

interface TeamMemberFormProps {
  onMemberAdded?: () => void;
  projectId?: string;
  onClose?: () => void;
}

const TeamMemberForm: React.FC<TeamMemberFormProps> = ({ onMemberAdded, projectId, onClose }) => {
  if (projectId) {
    return (
      <AddProjectMember
        projectId={projectId}
        onMemberAdded={onMemberAdded}
        onClose={onClose}
        open={true}
        onOpenChange={() => onClose?.()}
      />
    );
  }

  return <InviteTeamMember onMemberAdded={onMemberAdded} />;
};

export default TeamMemberForm;
