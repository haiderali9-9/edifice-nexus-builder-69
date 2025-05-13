
import React from 'react';
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const POSITIONS = [
  'Project Manager',
  'Construction Manager',
  'Site Engineer',
  'Cost Estimator',
  'Safety Officer'
];

export const DEPARTMENTS = [
  'Management',
  'Engineering',
  'Design',
  'Construction',
  'Safety',
  'Administration',
  'Project Coordination',
  'Site Supervision',
  'Schedule Management',
  'Cost Control',
  'Safety Compliance'
];

export const ROLES = [
  'Admin',
  'Manager',
  'Team Lead',
  'Member',
  'Guest',
  'Contractor'
];

interface ProfessionalInfoProps {
  initialData: {
    position?: string | null;
    department?: string | null;
    role?: string | null;
  };
  onUpdate: (data: { position: string; department: string; role: string }) => Promise<void> | void;
  readOnly?: boolean;
}

const ProfessionalInfo = ({ 
  initialData, 
  onUpdate, 
  readOnly = false 
}: ProfessionalInfoProps) => {
  const { register, handleSubmit, formState: { isSubmitting }, setValue, watch } = useForm({
    defaultValues: {
      position: initialData.position || '',
      department: initialData.department || '',
      role: initialData.role || '',
    }
  });
  const { toast } = useToast();
  
  const currentPosition = watch('position');
  const currentDepartment = watch('department');
  const currentRole = watch('role');

  const onSubmit = async (data: { position: string; department: string; role: string }) => {
    try {
      await onUpdate(data);
      toast({
        title: "Professional info updated",
        description: "Your professional information has been saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error updating information",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePositionChange = (value: string) => {
    setValue('position', value);
  };

  const handleDepartmentChange = (value: string) => {
    setValue('department', value);
  };

  const handleRoleChange = (value: string) => {
    setValue('role', value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Information</CardTitle>
        <CardDescription>
          Update your work-related information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Select 
              value={currentPosition} 
              onValueChange={handlePositionChange}
              disabled={readOnly}
            >
              <SelectTrigger id="position">
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((position) => (
                  <SelectItem key={position} value={position}>
                    {position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('position')} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select 
              value={currentDepartment} 
              onValueChange={handleDepartmentChange}
              disabled={readOnly}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('department')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={currentRole} 
              onValueChange={handleRoleChange}
              disabled={readOnly}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('role')} />
          </div>
          
          {!readOnly && (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfessionalInfo;
