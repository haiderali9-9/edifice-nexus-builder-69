import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Task, User, Resource, TaskAssignment, TaskResource } from "@/types";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, Minus } from "lucide-react";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onTaskUpdated: () => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onTaskUpdated,
}) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    name: task.name,
    description: task.description,
    start_date: task.start_date,
    end_date: task.end_date,
    status: task.status,
    priority: task.priority,
  });
  const [activeTab, setActiveTab] = useState("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projectTeam, setProjectTeam] = useState<User[]>([]);
  const [projectResources, setProjectResources] = useState<(Resource & { allocation: { days?: number; hours?: number; quantity: number } })[]>([]);
  
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<{
    id: string;
    assignmentId?: string;
    hours?: number;
    days?: number;
    quantity?: number;
  }[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      fetchTaskData();
      fetchProjectTeam();
      fetchProjectResources();
    }
  }, [isOpen, task.id]);
  
  const fetchTaskData = async () => {
    setIsLoading(true);
    try {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select('id, user_id')
        .eq('task_id', task.id);
        
      if (assignmentsError) throw assignmentsError;
      
      if (assignments) {
        setSelectedTeamMembers(assignments.map(a => a.user_id));
      }
      
      const { data: resources, error: resourcesError } = await supabase
        .from('task_resources')
        .select('id, resource_id, hours, days, quantity')
        .eq('task_id', task.id);
        
      if (resourcesError) throw resourcesError;
      
      if (resources) {
        setSelectedResources(resources.map(r => ({
          id: r.resource_id,
          assignmentId: r.id,
          hours: r.hours || undefined,
          days: r.days || undefined,
          quantity: r.quantity || 1
        })));
      }
      
    } catch (error) {
      console.error("Error fetching task data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchProjectTeam = async () => {
    setIsLoading(true);
    try {
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select(`
          user_id,
          profiles:user_id (
            id,
            first_name,
            last_name,
            email,
            role,
            avatar_url
          )
        `)
        .eq('project_id', task.project_id);

      if (teamError) throw teamError;

      const formattedTeam = teamData.map(member => ({
        id: member.profiles.id,
        name: `${member.profiles.first_name} ${member.profiles.last_name}`,
        email: member.profiles.email || '',
        role: member.profiles.role || '',
        avatar: member.profiles.avatar_url
      }));

      setProjectTeam(formattedTeam);
    } catch (error) {
      console.error("Error fetching project team:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectResources = async () => {
    setIsLoading(true);
    try {
      const { data: allocations, error: allocationsError } = await supabase
        .from('resource_allocations')
        .select(`
          id,
          resource_id,
          quantity,
          days,
          hours,
          resources:resource_id (
            id,
            name,
            type,
            unit,
            cost,
            quantity,
            status,
            returnable
          )
        `)
        .eq('project_id', task.project_id)
        .eq('consumed', false);

      if (allocationsError) throw allocationsError;

      if (allocations && allocations.length > 0) {
        const formattedResources = allocations
          .filter(allocation => allocation.resources)
          .map(allocation => ({
            ...allocation.resources,
            available: allocation.quantity,
            allocation: {
              quantity: allocation.quantity,
              days: allocation.days,
              hours: allocation.hours
            },
            type: allocation.resources.type as 'Material' | 'Equipment' | 'Labor'
          }));

        setProjectResources(formattedResources);
      } else {
        setProjectResources([]);
      }
    } catch (error) {
      console.error("Error fetching project resources:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const toggleTeamMember = (userId: string) => {
    setSelectedTeamMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleResourceSelect = (resourceId: string) => {
    if (selectedResources.some(r => r.id === resourceId)) {
      setSelectedResources(prev => prev.filter(r => r.id !== resourceId));
    } else {
      const resource = projectResources.find(r => r.id === resourceId);
      if (resource) {
        setSelectedResources(prev => [
          ...prev,
          { 
            id: resourceId, 
            hours: resource.type === 'Labor' ? resource.allocation.hours || 8 : undefined,
            days: resource.type !== 'Labor' && resource.returnable ? resource.allocation.days || 1 : undefined,
            quantity: resource.allocation.quantity || 1
          }
        ]);
      }
    }
  };

  const updateResourceAllocation = (resourceId: string, type: 'hours' | 'days' | 'quantity', value: number) => {
    setSelectedResources(prev => 
      prev.map(r => 
        r.id === resourceId 
          ? { ...r, [type]: value } 
          : r
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error: taskError } = await supabase
        .from("tasks")
        .update({
          name: formData.name,
          description: formData.description,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          status: formData.status,
          priority: formData.priority,
        })
        .eq("id", task.id);

      if (taskError) throw taskError;
      
      const { data: currentAssignments, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select('id, user_id')
        .eq('task_id', task.id);
        
      if (assignmentsError) throw assignmentsError;
      
      if (currentAssignments) {
        const currentUserIds = currentAssignments.map(a => a.user_id);
        const assignmentsToAdd = selectedTeamMembers.filter(id => !currentUserIds.includes(id));
        const assignmentsToRemove = currentAssignments
          .filter(a => !selectedTeamMembers.includes(a.user_id))
          .map(a => a.id);
        
        if (assignmentsToAdd.length > 0) {
          const newAssignments = assignmentsToAdd.map(userId => ({
            task_id: task.id,
            user_id: userId
          }));
          
          const { error: addError } = await supabase
            .from('task_assignments')
            .insert(newAssignments);
            
          if (addError) throw addError;
        }
        
        if (assignmentsToRemove.length > 0) {
          const { error: removeError } = await supabase
            .from('task_assignments')
            .delete()
            .in('id', assignmentsToRemove);
            
          if (removeError) throw removeError;
        }
      }
      
      const { data: currentResources, error: resourcesError } = await supabase
        .from('task_resources')
        .select('id, resource_id')
        .eq('task_id', task.id);
        
      if (resourcesError) throw resourcesError;
      
      if (currentResources) {
        const currentResourceIds = currentResources.map(r => r.resource_id);
        const resourcesToAdd = selectedResources.filter(r => !r.assignmentId && !currentResourceIds.includes(r.id));
        const resourcesToUpdate = selectedResources.filter(r => r.assignmentId);
        const resourcesToRemove = currentResources
          .filter(r => !selectedResources.some(sr => sr.id === r.resource_id))
          .map(r => r.id);
        
        if (resourcesToAdd.length > 0) {
          const newResources = resourcesToAdd.map(resource => ({
            task_id: task.id,
            resource_id: resource.id,
            hours: resource.hours,
            days: resource.days,
            quantity: resource.quantity || 1
          }));
          
          const { error: addError } = await supabase
            .from('task_resources')
            .insert(newResources);
            
          if (addError) throw addError;
        }
        
        for (const resource of resourcesToUpdate) {
          if (!resource.assignmentId) continue;
          
          const { error: updateError } = await supabase
            .from('task_resources')
            .update({
              hours: resource.hours,
              days: resource.days,
              quantity: resource.quantity || 1
            })
            .eq('id', resource.assignmentId);
            
          if (updateError) throw updateError;
        }
        
        if (resourcesToRemove.length > 0) {
          const { error: removeError } = await supabase
            .from('task_resources')
            .delete()
            .in('id', resourcesToRemove);
            
          if (removeError) throw removeError;
        }
      }

      onTaskUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="details">Task Details</TabsTrigger>
              <TabsTrigger value="team">Team Members</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Task Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      value={formData.start_date ? formData.start_date.split('T')[0] : ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_date">Due Date</Label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="date"
                      value={formData.end_date ? formData.end_date.split('T')[0] : ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status as string}
                      onValueChange={handleSelectChange("status")}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Delayed">Delayed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority as string}
                      onValueChange={handleSelectChange("priority")}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="team">
              <div className="grid gap-4 py-2">
                <Label>Assign Team Members</Label>
                {isLoading ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                    <span>Loading team members...</span>
                  </div>
                ) : projectTeam.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-[240px] overflow-y-auto p-2 border rounded-md">
                    {projectTeam.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md">
                        <Checkbox 
                          id={`member-${member.id}`}
                          checked={selectedTeamMembers.includes(member.id)}
                          onCheckedChange={() => toggleTeamMember(member.id)}
                        />
                        <label htmlFor={`member-${member.id}`} className="flex items-center space-x-2 cursor-pointer flex-1">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm text-gray-600">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-gray-500">{member.role}</div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-gray-500 border rounded-md">
                    <p>No team members assigned to this project</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="resources">
              <div className="grid gap-4 py-2">
                <Label>Assign Resources</Label>
                {isLoading ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                    <span>Loading resources...</span>
                  </div>
                ) : projectResources.length > 0 ? (
                  <div className="max-h-[240px] overflow-y-auto border rounded-md p-2">
                    {projectResources.map((resource) => (
                      <div key={resource.id} className="mb-2">
                        <div className="flex items-center">
                          <Checkbox 
                            id={`resource-${resource.id}`}
                            checked={selectedResources.some(r => r.id === resource.id)}
                            onCheckedChange={() => handleResourceSelect(resource.id)}
                          />
                          <label htmlFor={`resource-${resource.id}`} className="ml-2 flex-1 font-medium cursor-pointer">
                            {resource.name}
                          </label>
                          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                            {resource.type} • {resource.allocation.quantity} {resource.unit}
                            {resource.allocation.days ? ` • ${resource.allocation.days} days` : ''}
                            {resource.allocation.hours ? ` • ${resource.allocation.hours} hours` : ''}
                            {` • ${resource.returnable ? 'Returnable' : 'Consumable'}`}
                          </span>
                        </div>
                        
                        {selectedResources.some(r => r.id === resource.id) && (
                          <div className="ml-6 mt-2 flex items-center flex-wrap gap-2">
                            {resource.type === 'Labor' && (
                              <>
                                <Label htmlFor={`hours-${resource.id}`} className="text-xs whitespace-nowrap">Hours:</Label>
                                <div className="flex items-center border rounded-md">
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => {
                                      const current = selectedResources.find(r => r.id === resource.id)?.hours || 0;
                                      if (current > 1) {
                                        updateResourceAllocation(resource.id, 'hours', current - 1);
                                      }
                                    }}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                    id={`hours-${resource.id}`}
                                    type="number"
                                    className="w-16 h-8 text-center border-0"
                                    value={selectedResources.find(r => r.id === resource.id)?.hours || 0}
                                    onChange={(e) => updateResourceAllocation(resource.id, 'hours', parseInt(e.target.value) || 0)}
                                    min={1}
                                    max={resource.allocation.hours || resource.available}
                                  />
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => {
                                      const current = selectedResources.find(r => r.id === resource.id)?.hours || 0;
                                      const max = resource.allocation.hours || resource.available;
                                      if (current < max) {
                                        updateResourceAllocation(resource.id, 'hours', current + 1);
                                      }
                                    }}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </>
                            )}
                            
                            {resource.returnable && resource.type !== 'Labor' && (
                              <>
                                <Label htmlFor={`days-${resource.id}`} className="text-xs whitespace-nowrap">Days:</Label>
                                <div className="flex items-center border rounded-md mr-4">
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => {
                                      const current = selectedResources.find(r => r.id === resource.id)?.days || 0;
                                      if (current > 1) {
                                        updateResourceAllocation(resource.id, 'days', current - 1);
                                      }
                                    }}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                    id={`days-${resource.id}`}
                                    type="number"
                                    className="w-16 h-8 text-center border-0"
                                    value={selectedResources.find(r => r.id === resource.id)?.days || 0}
                                    onChange={(e) => updateResourceAllocation(resource.id, 'days', parseInt(e.target.value) || 0)}
                                    min={1}
                                    max={resource.allocation.days || resource.available}
                                  />
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => {
                                      const current = selectedResources.find(r => r.id === resource.id)?.days || 0;
                                      const max = resource.allocation.days || resource.available;
                                      if (current < max) {
                                        updateResourceAllocation(resource.id, 'days', current + 1);
                                      }
                                    }}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </>
                            )}
                            
                            <Label htmlFor={`quantity-${resource.id}`} className="text-xs whitespace-nowrap">Quantity:</Label>
                            <div className="flex items-center border rounded-md">
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => {
                                  const current = selectedResources.find(r => r.id === resource.id)?.quantity || 0;
                                  if (current > 1) {
                                    updateResourceAllocation(resource.id, 'quantity', current - 1);
                                  }
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                id={`quantity-${resource.id}`}
                                type="number"
                                className="w-16 h-8 text-center border-0"
                                value={selectedResources.find(r => r.id === resource.id)?.quantity || 0}
                                onChange={(e) => updateResourceAllocation(resource.id, 'quantity', parseInt(e.target.value) || 0)}
                                min={1}
                                max={resource.allocation.quantity}
                              />
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => {
                                  const current = selectedResources.find(r => r.id === resource.id)?.quantity || 0;
                                  if (current < resource.allocation.quantity) {
                                    updateResourceAllocation(resource.id, 'quantity', current + 1);
                                  }
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-gray-500 border rounded-md">
                    <p>No returnable resources available for this project</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskModal;
