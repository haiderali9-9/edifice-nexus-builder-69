
import React, { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EventForm from "@/components/schedule/EventForm";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Schedule = () => {
  const { toast } = useToast();
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  const [currentWeek, setCurrentWeek] = useState(getWeekDates(currentDate));
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  function getWeekDates(date: Date) {
    const week = [];
    const day = date.getDay(); // Get day of week (0-6)
    const diff = date.getDate() - day; // Adjust to get Sunday
    
    // Generate dates for the week
    for (let i = 0; i < 7; i++) {
      const newDate = new Date(date);
      newDate.setDate(diff + i);
      week.push(newDate);
    }
    
    return week;
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const firstDay = new Date(currentWeek[0]);
    const daysToAdd = direction === 'next' ? 7 : -7;
    firstDay.setDate(firstDay.getDate() + daysToAdd);
    setCurrentWeek(getWeekDates(firstDay));
  };
  
  // Fetch schedule events from Supabase
  const { data: scheduleItems, isLoading, refetch } = useQuery({
    queryKey: ['schedule-events', currentWeek[0], currentWeek[6]],
    queryFn: async () => {
      const startDate = currentWeek[0].toISOString().split('T')[0];
      const endDate = currentWeek[6].toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('schedule_events')
        .select(`
          *,
          projects:project_id(name)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');
        
      if (error) {
        console.error('Error fetching schedule events:', error);
        throw error;
      }
      
      return data.map(item => ({
        id: item.id,
        title: item.title,
        project: item.projects?.name || '',
        type: item.type,
        start: new Date(`${item.date}T${item.start_time}`),
        end: new Date(`${item.date}T${item.end_time}`),
        description: item.description,
        resourceIds: item.resource_ids || []
      }));
    }
  });

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    try {
      const { error } = await supabase
        .from('schedule_events')
        .delete()
        .eq('id', eventToDelete);
        
      if (error) throw error;
      
      toast({
        title: "Event deleted",
        description: "The event has been removed from the schedule.",
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete the event. Please try again.",
        variant: "destructive"
      });
    } finally {
      setEventToDelete(null);
    }
  };

  const getScheduleItemsForDate = (date: Date) => {
    if (!scheduleItems) return [];
    
    return scheduleItems.filter(item => {
      const itemDate = new Date(item.start);
      return itemDate.getDate() === date.getDate() && 
             itemDate.getMonth() === date.getMonth() && 
             itemDate.getFullYear() === date.getFullYear();
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getItemClass = (type: string) => {
    switch(type) {
      case 'meeting':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'field':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'construction':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const handleEventCreated = () => {
    refetch();
  };
  
  const { data: upcomingDeadlines = [] } = useQuery({
    queryKey: ['upcoming-deadlines'],
    queryFn: async () => {
      const today = new Date();
      const inTwoWeeks = new Date();
      inTwoWeeks.setDate(today.getDate() + 14); // Look ahead 14 days
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, end_date')
        .gt('end_date', today.toISOString())
        .lte('end_date', inTwoWeeks.toISOString())
        .order('end_date');
        
      if (error) {
        console.error('Error fetching deadlines:', error);
        return [];
      }
      
      return data.map(project => ({
        id: project.id,
        title: `Project Deadline: ${project.name}`,
        project: project.name,
        dueDate: new Date(project.end_date),
        priority: 'high',
      }));
    }
  });
  
  const { data: resourceAllocations = [] } = useQuery({
    queryKey: ['resource-allocations-returnable'],
    queryFn: async () => {
      const today = new Date().toISOString();
      
      // Fetch resources and their allocations with the duration information
      const { data: resources, error: resourcesError } = await supabase
        .from('resources')
        .select(`
          id, 
          name,
          resource_allocations(
            id, 
            project_id,
            quantity,
            created_at,
            consumed,
            days,
            hours,
            projects:project_id(name)
          )
        `)
        .eq('returnable', true)
        .order('name');
        
      if (resourcesError) {
        console.error('Error fetching resources:', resourcesError);
        return [];
      }
      
      // Process resources to create a weekly allocation schedule
      const processedResources = resources
        .filter(resource => resource.resource_allocations && resource.resource_allocations.length > 0)
        .map(resource => {
          const activeAllocations = resource.resource_allocations?.filter(
            allocation => !allocation.consumed
          ) || [];
          
          if (activeAllocations.length === 0) return null;
          
          // Map allocations to days of the week
          // Use custom days/hours if specified, otherwise use default distribution
          const dayAllocation = [1, 2, 3, 4, 5].map(day => {
            const allocation = activeAllocations[day % activeAllocations.length];
            
            if (!allocation) return null;
            
            const hours = allocation.hours || 
                         (allocation.days ? Math.min(allocation.days * 8, 8) : 8);
            
            return {
              id: allocation.id,
              project: allocation.projects?.name || 'Unknown',
              project_id: allocation.project_id,
              day,
              hours,
              // Include duration information
              days: allocation.days,
              hours_allocation: allocation.hours,
              // Add the created_at property from the allocation
              created_at: allocation.created_at
            };
          }).filter(Boolean);
          
          return {
            id: resource.id,
            name: resource.name,
            allocation: dayAllocation
          };
        })
        .filter(Boolean);
        
      return processedResources;
    }
  });

  useEffect(() => {
    const checkReturnableDates = async () => {
      // Get current date minus 7 days
      const returnDate = new Date();
      returnDate.setDate(returnDate.getDate() - 7);
      const returnDateStr = returnDate.toISOString();
      
      // Collect IDs of allocations that should be marked as consumed
      const expiredAllocationIds = [];
      
      // Iterate through all resource allocations
      for (const resource of resourceAllocations) {
        for (const alloc of resource.allocation) {
          if (alloc.created_at && new Date(alloc.created_at) < returnDate) {
            expiredAllocationIds.push(alloc.id);
          }
        }
      }
      
      // If there are expired allocations, update them
      if (expiredAllocationIds.length > 0) {
        const { error } = await supabase
          .from('resource_allocations')
          .update({ consumed: true })
          .in('id', expiredAllocationIds);
        
        if (error) {
          console.error('Error updating expired allocations:', error);
        } else {
          console.log(`Marked ${expiredAllocationIds.length} expired allocations as consumed`);
          // Refresh the page to reflect the changes
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
    };
    
    if (resourceAllocations.length > 0) {
      checkReturnableDates();
    }
  }, [resourceAllocations]);

  return (
    <PageLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-gray-500 mt-1">
            Manage your project timelines and events
          </p>
        </div>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Previous Week
          </Button>
          <Button variant="outline" onClick={() => navigateWeek('next')}>
            Next Week <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
          <EventForm onEventCreated={handleEventCreated} />
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              Weekly Schedule <span className="text-gray-500 text-sm ml-2">{`${currentMonth} ${currentYear}`}</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((day, index) => (
              <div key={day} className="text-center p-2 font-medium">
                <div className="mb-1">{day}</div>
                <div className={`text-sm inline-flex items-center justify-center w-7 h-7 rounded-full ${isToday(currentWeek[index]) ? 'bg-construction-600 text-white' : 'text-gray-500'}`}>
                  {currentWeek[index].getDate()}
                </div>
              </div>
            ))}
            
            {currentWeek.map((date, dateIndex) => (
              <div key={dateIndex} className="min-h-[300px] border rounded-md p-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-75">
                    <CalendarClock className="h-6 w-6 mb-1 text-gray-400 animate-pulse" />
                    <span className="text-xs text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <>
                    {getScheduleItemsForDate(date).map(item => (
                      <div 
                        key={item.id} 
                        className={`mb-2 p-2 border rounded ${getItemClass(item.type)} relative group cursor-pointer transition-all hover:shadow`}
                      >
                        <div className="flex justify-between items-start">
                          <div
                            onClick={() => {
                              toast({
                                title: item.title,
                                description: `${item.project} - ${formatTime(item.start)} to ${formatTime(item.end)}`,
                              });
                            }}
                            className="flex-1"
                          >
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs">{item.project}</div>
                            <div className="text-xs mt-1">{formatTime(item.start)} - {formatTime(item.end)}</div>
                            {item.resourceIds && item.resourceIds.length > 0 && (
                              <div className="text-xs mt-1 text-gray-600">
                                Resources: {item.resourceIds.length}
                              </div>
                            )}
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="opacity-0 group-hover:opacity-100 h-7 w-7 transition-opacity"
                                onClick={() => setEventToDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{item.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setEventToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteEvent} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                    {getScheduleItemsForDate(date).length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full opacity-50">
                        <CalendarClock className="h-6 w-6 mb-1 text-gray-400" />
                        <span className="text-xs text-gray-400">No events</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h4 className="font-medium">{deadline.title}</h4>
                      <p className="text-sm text-gray-500">{deadline.project}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{deadline.dueDate.toLocaleDateString()}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        deadline.priority === 'high' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {deadline.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming deadlines</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Returnable Resource Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left pb-3">Resource</th>
                    <th className="text-center pb-3">Mon</th>
                    <th className="text-center pb-3">Tue</th>
                    <th className="text-center pb-3">Wed</th>
                    <th className="text-center pb-3">Thu</th>
                    <th className="text-center pb-3">Fri</th>
                  </tr>
                </thead>
                <tbody>
                  {resourceAllocations.map((resource) => (
                    <tr key={resource.id} className="border-t">
                      <td className="py-3 font-medium">{resource.name}</td>
                      {[1, 2, 3, 4, 5].map((day) => {
                        const allocation = resource.allocation.find(a => a.day === day);
                        return (
                          <td key={day} className="py-3 text-center">
                            {allocation ? (
                              <div className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs">
                                <div>{allocation.project.split(' ')[0]}</div>
                                <div className="text-xs mt-1">
                                  {allocation.hours}h
                                  {allocation.days ? ` (${allocation.days}d total)` : ''}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {resourceAllocations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        No returnable resource allocations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Note: Returnable resources are automatically marked as returned after 7 days.
              Resources with specified durations are allocated according to those values.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Schedule;
