import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Resource, ResourceAllocation } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeftRight, RotateCcw, Trash2, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ResourceStatusProps {
  resources?: Resource[];
  isLoading?: boolean;
}

const ResourceStatus = ({ resources, isLoading }: ResourceStatusProps) => {
  const [resourceToReturn, setResourceToReturn] = useState<Resource | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [resourceToRefill, setResourceToRefill] = useState<Resource | null>(null);
  const [refillQuantity, setRefillQuantity] = useState<number>(0);
  const [newCost, setNewCost] = useState<number | null>(null);
  const [resourceToReset, setResourceToReset] = useState<Resource | null>(null);
  
  const sortedResources = resources 
    ? [...resources].sort((a, b) => {
        if (a.status === "Out of Stock" && b.status !== "Out of Stock") return -1;
        if (a.status !== "Out of Stock" && b.status === "Out of Stock") return 1;
        if (a.status === "Low Stock" && b.status !== "Low Stock") return -1;
        if (a.status !== "Low Stock" && b.status === "Low Stock") return 1;
        return 0;
      })
    : [];

  const calculateAvailableQuantity = (resource: Resource) => {
    const allocatedQuantity = resource.resource_allocations?.reduce((sum, a) => {
      if (!a.consumed) {
        return sum + a.quantity;
      }
      return sum;
    }, 0) || 0;
    
    return resource.quantity - allocatedQuantity;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Available</Badge>;
      case "Low Stock":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
      case "Out of Stock":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Out of Stock</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getResourceCategoryBadge = (returnable: boolean) => {
    return returnable ? 
      <Badge variant="outline" className="bg-purple-100 text-purple-800">Returnable</Badge> :
      <Badge variant="outline" className="bg-teal-100 text-teal-800">Consumable</Badge>;
  };

  const handleReturnResource = async (resource: Resource) => {
    setResourceToReturn(resource);
  };
  
  const confirmReturnResource = async () => {
    if (!resourceToReturn) return;
    
    if (!resourceToReturn.returnable || !resourceToReturn.resource_allocations || resourceToReturn.resource_allocations.length === 0) {
      toast.error("This resource cannot be returned");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('resource_allocations')
        .delete()
        .eq('resource_id', resourceToReturn.id);
      
      if (error) throw error;
      
      toast.success("Resource marked as returned", {
        description: `${resourceToReturn.name} has been returned to inventory.`
      });
      
      window.location.reload();
    } catch (error) {
      console.error("Error returning resource:", error);
      toast.error("Failed to process the return");
    } finally {
      setResourceToReturn(null);
    }
  };
  
  const handleDeleteResource = (resource: Resource) => {
    setResourceToDelete(resource);
  };
  
  const confirmDeleteResource = async () => {
    if (!resourceToDelete) return;
    
    try {
      if (resourceToDelete.resource_allocations && resourceToDelete.resource_allocations.length > 0) {
        const { error: allocationError } = await supabase
          .from('resource_allocations')
          .delete()
          .eq('resource_id', resourceToDelete.id);
          
        if (allocationError) throw allocationError;
      }
      
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceToDelete.id);
      
      if (error) throw error;
      
      toast.success("Resource deleted", {
        description: `${resourceToDelete.name} has been permanently removed.`
      });
      
      window.location.reload();
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    } finally {
      setResourceToDelete(null);
    }
  };

  const handleRefillResource = (resource: Resource) => {
    setResourceToRefill(resource);
    setRefillQuantity(0);
    setNewCost(resource.cost);
  };

  const confirmRefillResource = async () => {
    if (!resourceToRefill || refillQuantity <= 0) return;
    
    try {
      const { error } = await supabase
        .from('resources')
        .update({ 
          quantity: resourceToRefill.quantity + refillQuantity,
          cost: newCost !== null ? newCost : resourceToRefill.cost,
          status: resourceToRefill.quantity + refillQuantity > 0 ? 'Available' : 'Out of Stock'
        })
        .eq('id', resourceToRefill.id);
      
      if (error) throw error;
      
      toast.success("Resource Refilled", {
        description: `${resourceToRefill.name} refilled with ${refillQuantity} units`
      });
      
      setResourceToRefill(null);
      setRefillQuantity(0);
      setNewCost(null);
      
      window.location.reload();
    } catch (error) {
      console.error("Error refilling resource:", error);
      toast.error("Failed to refill resource");
    }
  };

  const handleResetResource = (resource: Resource) => {
    if (resource.returnable) {
      toast.error("Only consumable resources can be reset");
      return;
    }
    
    setResourceToReset(resource);
  };
  
  const confirmResetResource = async () => {
    if (!resourceToReset) return;
    
    try {
      if (resourceToReset.resource_allocations && resourceToReset.resource_allocations.length > 0) {
        const { error: allocationsError } = await supabase
          .from('resource_allocations')
          .delete()
          .eq('resource_id', resourceToReset.id);
          
        if (allocationsError) throw allocationsError;
      }
      
      const { error } = await supabase
        .from('resources')
        .update({ 
          status: resourceToReset.quantity > 0 ? 'Available' : 'Out of Stock'
        })
        .eq('id', resourceToReset.id);
      
      if (error) throw error;
      
      toast.success("Resource Reset", {
        description: `${resourceToReset.name} has been reset. All allocations cleared.`
      });
      
      window.location.reload();
    } catch (error) {
      console.error("Error resetting resource:", error);
      toast.error("Failed to reset resource");
    } finally {
      setResourceToReset(null);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Resource Status</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="w-[180px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedResources.length > 0 ? (
                sortedResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.name}</TableCell>
                    <TableCell>{resource.type}</TableCell>
                    <TableCell>{getResourceCategoryBadge(resource.returnable)}</TableCell>
                    <TableCell className="text-right">
                      {calculateAvailableQuantity(resource)} / {resource.quantity} {resource.unit}
                    </TableCell>
                    <TableCell className="text-right">{getStatusBadge(resource.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-600"
                          onClick={() => handleRefillResource(resource)}
                        >
                          <Plus className="h-4 w-4" />
                          <span className="sr-only">Refill</span>
                        </Button>
                        
                        {resource.returnable && resource.resource_allocations && resource.resource_allocations.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600"
                            onClick={() => handleReturnResource(resource)}
                          >
                            <RotateCcw className="h-4 w-4" />
                            <span className="sr-only">Return</span>
                          </Button>
                        )}
                        
                        {!resource.returnable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-purple-600"
                            onClick={() => handleResetResource(resource)}
                            title="Reset consumable resource"
                          >
                            <RefreshCw className="h-4 w-4" />
                            <span className="sr-only">Reset</span>
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => handleDeleteResource(resource)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    No resources available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      <AlertDialog open={!!resourceToReturn} onOpenChange={() => setResourceToReturn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark {resourceToReturn?.name} as returned to inventory? 
              This will remove all project allocations for this resource.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReturnResource}>
              Return to Inventory
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={!!resourceToDelete} onOpenChange={() => setResourceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {resourceToDelete?.name}? 
              This action cannot be undone and will remove all allocations of this resource.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteResource}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={!!resourceToRefill} onOpenChange={(open) => !open && setResourceToRefill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refill Resource: {resourceToRefill?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Add Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                className="col-span-3"
                value={refillQuantity}
                onChange={(e) => setRefillQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost" className="text-right">
                New Cost per {resourceToRefill?.unit}
              </Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                className="col-span-3"
                value={newCost !== null ? newCost : ''}
                onChange={(e) => setNewCost(e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>
            
            <div className="col-span-4">
              <p className="text-sm text-gray-500 mt-2">
                Current quantity: {resourceToRefill?.quantity} {resourceToRefill?.unit}<br />
                Current cost: ${resourceToRefill?.cost} per {resourceToRefill?.unit}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setResourceToRefill(null)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmRefillResource}
              disabled={refillQuantity <= 0}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refill Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!resourceToReset} onOpenChange={() => setResourceToReset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Consumable Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset {resourceToReset?.name}? This will clear all allocations 
              and make the full quantity available again. Use this when tracking has become 
              inconsistent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetResource}>
              Reset Resource
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ResourceStatus;
