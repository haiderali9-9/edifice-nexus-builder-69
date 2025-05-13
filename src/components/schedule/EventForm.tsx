
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Project, Resource } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';

interface EventFormProps {
  onEventCreated?: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ onEventCreated }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('');
  const [type, setType] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);

  const eventTypes = [
    'meeting',
    'field',
    'construction',
    'milestone'
  ];

  const eventTypeLabels: Record<string, string> = {
    'meeting': 'Meeting',
    'field': 'Field Work',
    'construction': 'Construction',
    'milestone': 'Milestone'
  };
  
  useEffect(() => {
    if (open) {
      fetchProjects();
      fetchResources();
    }
  }, [open]);
  
  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      const typedProjects = data?.map(project => ({
        ...project,
        status: project.status as "Planning" | "In Progress" | "On Hold" | "Completed"
      })) || [];
      
      setProjects(typedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error loading projects",
        description: "Could not load projects from the database.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingProjects(false);
    }
  };
  
  const fetchResources = async () => {
    setIsLoadingResources(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      const typedResources = data?.map(resource => ({
        ...resource,
        type: resource.type as "Material" | "Equipment" | "Labor",
        status: resource.status as "Available" | "Low Stock" | "Out of Stock"
      })) || [];
      
      setResources(typedResources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error loading resources",
        description: "Could not load resources from the database.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingResources(false);
    }
  };
  
  const handleToggleResource = (resourceId: string) => {
    setSelectedResources(prev => 
      prev.includes(resourceId) 
        ? prev.filter(id => id !== resourceId) 
        : [...prev, resourceId]
    );
  };

  const resetForm = () => {
    setTitle('');
    setProject('');
    setType('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setDescription('');
    setSelectedResources([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !project || !type || !date || !startTime || !endTime) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('schedule_events')
        .insert({
          title,
          project_id: project,
          type,
          date,
          start_time: startTime,
          end_time: endTime,
          description: description || null,
          resource_ids: selectedResources.length > 0 ? selectedResources : null
        })
        .select()
        .single();
      
      if (eventError) throw eventError;
      
      toast({
        title: "Event created",
        description: `${title} has been added to the schedule.`,
      });
      
      resetForm();
      setOpen(false);
      
      if (onEventCreated) {
        onEventCreated();
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error creating event",
        description: "There was a problem saving your event.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-construction-700 hover:bg-construction-800">
          <Plus className="h-4 w-4 mr-2" /> New Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="project">Project</Label>
                <Select value={project} onValueChange={setProject} required>
                  <SelectTrigger id="project">
                    <SelectValue placeholder={isLoadingProjects ? "Loading..." : "Select project"} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((projectItem) => (
                      <SelectItem key={projectItem.id} value={projectItem.id}>
                        {projectItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="type">Event Type</Label>
                <Select value={type} onValueChange={setType} required>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((eventType) => (
                      <SelectItem key={eventType} value={eventType}>
                        {eventTypeLabels[eventType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Event details..."
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Resources</Label>
              <div className="max-h-[150px] overflow-y-auto border rounded-md p-3">
                {isLoadingResources ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading resources...
                  </div>
                ) : resources.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {resources.map((resource) => (
                      <div key={resource.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`resource-${resource.id}`}
                          checked={selectedResources.includes(resource.id)}
                          onCheckedChange={() => handleToggleResource(resource.id)}
                        />
                        <label 
                          htmlFor={`resource-${resource.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {resource.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">No resources available</p>
                )}
              </div>
              <p className="text-xs text-gray-500">Allocate resources for this event</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                  Creating...
                </>
              ) : (
                'Create Event'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventForm;
