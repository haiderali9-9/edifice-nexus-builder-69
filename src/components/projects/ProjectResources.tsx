
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Trash, ArrowDownToLine, Check } from "lucide-react";
import { Resource, ResourceAllocation } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AddResourceModal from "./AddResourceModal";

interface EnhancedResourceAllocation extends ResourceAllocation {
  resource: Resource;
}

interface ProjectResourcesProps {
  projectId: string;
}

const ProjectResources = ({ projectId }: ProjectResourcesProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [resources, setResources] = useState<EnhancedResourceAllocation[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const { data: allocations, error: allocError } = await supabase
        .from("resource_allocations")
        .select(`
          id,
          quantity,
          hours,
          days,
          consumed,
          resource_id,
          project_id,
          resource:resources(
            id, 
            name, 
            type, 
            unit, 
            cost, 
            status,
            returnable,
            hour_rate,
            day_rate
          )
        `)
        .eq("project_id", projectId)
        .order("id", { ascending: false });

      if (allocError) throw allocError;
      
      const formattedResources = allocations.map(allocation => ({
        ...allocation,
        resource: allocation.resource as Resource
      })) as EnhancedResourceAllocation[];
      
      setResources(formattedResources);
    } catch (error) {
      console.error("Error loading resources:", error);
      toast({
        title: "Error",
        description: "Failed to load project resources",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchResources();
    }
  }, [projectId]);

  const handleResourceAdded = () => {
    toast({
      title: "Resource Added",
      description: "The resource has been successfully added to this project.",
    });
    fetchResources();
  };

  const handleMarkUsed = async (id: string) => {
    try {
      const { error } = await supabase
        .from("resource_allocations")
        .update({ consumed: true })
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Resource Marked as Used",
        description: "The resource has been marked as used.",
      });
      
      fetchResources();
    } catch (error) {
      console.error("Error marking resource as used:", error);
      toast({
        title: "Error",
        description: "Failed to mark resource as used",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("resource_allocations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Resource Removed",
        description: "The resource has been removed from this project.",
      });
      
      fetchResources();
    } catch (error) {
      console.error("Error removing resource:", error);
      toast({
        title: "Error",
        description: "Failed to remove resource",
        variant: "destructive",
      });
    }
  };

  const handleReturnResource = async (allocation: EnhancedResourceAllocation) => {
    if (!allocation.resource.returnable) {
      toast({
        title: "Cannot Return",
        description: "This resource cannot be returned as it's not a returnable resource.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("resource_allocations")
        .delete()
        .eq("id", allocation.id);

      if (error) throw error;
      
      toast({
        title: "Resource Returned",
        description: `${allocation.resource.name} has been successfully returned.`,
      });
      
      fetchResources();
    } catch (error) {
      console.error("Error returning resource:", error);
      toast({
        title: "Error",
        description: "Failed to return the resource.",
        variant: "destructive",
      });
    }
  };

  const handleConsumeResource = async (allocation: EnhancedResourceAllocation) => {
    if (allocation.resource.returnable) {
      toast({
        title: "Cannot Consume",
        description: "This is a returnable resource and cannot be consumed.",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, fetch the current resource to ensure we have the latest quantity
      const { data: resourceData, error: fetchError } = await supabase
        .from("resources")
        .select("quantity")
        .eq("id", allocation.resource.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (resourceData && typeof resourceData.quantity === 'number') {
        // Update the resource quantity - subtract directly from total
        const { error: resourceError } = await supabase
          .from("resources")
          .update({ 
            quantity: Math.max(0, resourceData.quantity - allocation.quantity)
          })
          .eq("id", allocation.resource.id);
        
        if (resourceError) throw resourceError;
        
        // Mark the allocation as consumed
        const { error: allocationError } = await supabase
          .from("resource_allocations")
          .update({ consumed: true })
          .eq("id", allocation.id);

        if (allocationError) throw allocationError;
        
        toast({
          title: "Resource Consumed",
          description: `${allocation.resource.name} has been consumed and removed from inventory.`,
        });
        
        fetchResources();
      } else {
        throw new Error("Invalid resource quantity");
      }
    } catch (error) {
      console.error("Error consuming resource:", error);
      toast({
        title: "Error",
        description: "Failed to consume the resource.",
        variant: "destructive",
      });
    }
  };

  const calculateTotalCost = (allocation: EnhancedResourceAllocation) => {
    if (!allocation.resource) return 0;
    
    let cost = 0;
    
    const baseCost = allocation.quantity * allocation.resource.cost;
    
    if (allocation.resource.returnable) {
      if (allocation.resource.hour_rate && allocation.hours) {
        cost += allocation.resource.hour_rate * allocation.hours;
      }
      
      else if (allocation.resource.day_rate && allocation.days) {
        cost += allocation.resource.day_rate * allocation.days;
      }
      
      else {
        cost = baseCost;
      }
    } else {
      cost = baseCost;
    }
    
    return cost;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-background/50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Project Resources</CardTitle>
            <CardDescription>Manage resources allocated to this project</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Resource
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableCaption>A list of all resources allocated to this project.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Resource</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.length > 0 ? (
              resources.map((allocation) => (
                <TableRow key={allocation.id}>
                  <TableCell className="font-medium">{allocation.resource.name}</TableCell>
                  <TableCell>{allocation.resource.type}</TableCell>
                  <TableCell className="text-right">
                    {allocation.quantity} {allocation.resource.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {allocation.days ? `${allocation.days} days` : ''}
                    {allocation.hours ? `${allocation.hours} hours` : ''}
                    {!allocation.days && !allocation.hours ? 'N/A' : ''}
                  </TableCell>
                  <TableCell className="text-right">
                    ${calculateTotalCost(allocation).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {allocation.consumed ? "Used" : "Available"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!allocation.consumed && allocation.resource.returnable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReturnResource(allocation)}
                          className="text-blue-600"
                        >
                          <ArrowDownToLine className="h-4 w-4 mr-1" />
                          Return
                        </Button>
                      )}
                      {!allocation.consumed && !allocation.resource.returnable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConsumeResource(allocation)}
                          className="text-green-600"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Consume
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(allocation.id)}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  {isLoading ? "Loading resources..." : "No resources allocated to this project."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {projectId && ( 
        <AddResourceModal
          projectId={projectId}
          open={showAddModal}
          onOpenChange={setShowAddModal}
          onResourceAdded={handleResourceAdded}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </Card>
  );
};

export default ProjectResources;
