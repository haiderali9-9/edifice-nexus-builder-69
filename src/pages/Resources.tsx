import React, { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Resource } from "@/types";
import { Search, Plus, Filter, MoreHorizontal, Box, Truck, Loader2, ArrowLeftRight, Trash2, Pencil, RotateCcw, Clock, CalendarDays, DollarSign, ShoppingCart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ResourceStatus from "@/components/dashboard/ResourceStatus";
import AddResourceModal from "@/components/resources/AddResourceModal";
import EditResourceModal from "@/components/resources/EditResourceModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<string | null>(null);
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [isEditResourceModalOpen, setIsEditResourceModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  
  // Fetch resources from Supabase
  const { data: resources, isLoading: resourcesLoading, error, refetch } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      // First fetch all resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('*');
      
      if (resourcesError) {
        throw resourcesError;
      }
      
      // Then fetch all allocations
      const { data: allocationsData, error: allocationsError } = await supabase
        .from('resource_allocations')
        .select('*');
      
      if (allocationsError) {
        throw allocationsError;
      }
      
      // Combine the data to match our Resource type
      return resourcesData.map(resource => ({
        ...resource,
        id: resource.id,
        name: resource.name,
        type: resource.type as 'Material' | 'Equipment' | 'Labor',
        quantity: resource.quantity,
        unit: resource.unit,
        cost: resource.cost,
        status: resource.status,
        returnable: resource.returnable || false,
        hour_rate: resource.hour_rate,
        day_rate: resource.day_rate,
        resource_allocations: allocationsData
          .filter(allocation => allocation.resource_id === resource.id)
          .map(allocation => ({
            id: allocation.id,
            resource_id: allocation.resource_id,
            project_id: allocation.project_id,
            quantity: allocation.quantity
          }))
      })) as Resource[];
    },
  });
  
  // Show error if query failed
  React.useEffect(() => {
    if (error) {
      toast.error("Failed to load resources", {
        description: "There was an error loading resources from the database."
      });
      console.error("Error loading resources:", error);
    }
  }, [error]);

  // Filter resources based on search term, type filter, and category filter
  const filteredResources = resources
    ? resources.filter((resource) => {
        const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter ? resource.type === typeFilter : true;
        const matchesCategory = categoryFilter 
          ? (categoryFilter === "Returnable" && resource.returnable) || 
            (categoryFilter === "Consumable" && !resource.returnable)
          : true;
        const matchesPriceType = priceFilter 
          ? (priceFilter === "Hourly" && resource.hour_rate) ||
            (priceFilter === "Daily" && resource.day_rate) ||
            (priceFilter === "Fixed" && (!resource.hour_rate && !resource.day_rate))
          : true;

        return matchesSearch && matchesType && matchesCategory && matchesPriceType;
      })
    : [];

  const getStatusBadge = (status: Resource["status"]) => {
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

  const getPricingBadge = (resource: Resource) => {
    if (resource.hour_rate) {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          ${resource.hour_rate}/hr
        </Badge>
      );
    } else if (resource.day_rate) {
      return (
        <Badge variant="outline" className="bg-indigo-100 text-indigo-800 flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          ${resource.day_rate}/day
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          Fixed
        </Badge>
      );
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const getResourceTypeIcon = (type: Resource["type"]) => {
    switch (type) {
      case "Material":
        return <Box className="h-4 w-4 mr-2 text-blue-500" />;
      case "Equipment":
        return <Truck className="h-4 w-4 mr-2 text-orange-500" />;
      case "Labor":
        return <Loader2 className="h-4 w-4 mr-2 text-green-500" />;
      default:
        return <Box className="h-4 w-4 mr-2" />;
    }
  };

  // Calculate total usage and value
  const totalAllocation = filteredResources.reduce(
    (sum, resource) => 
      sum + (resource.resource_allocations?.reduce((s, a) => s + a.quantity, 0) || 0),
    0
  );
  
  const totalValue = filteredResources.reduce(
    (sum, resource) => sum + resource.quantity * resource.cost,
    0
  );

  const handleAddResource = () => {
    setIsAddResourceModalOpen(true);
  };

  const handleEditResource = (resource: Resource) => {
    setSelectedResource(resource);
    setIsEditResourceModalOpen(true);
  };

  const handleResourceAdded = () => {
    refetch();
    toast.success("Resource added successfully");
  };

  const handleResourceUpdated = () => {
    refetch();
    toast.success("Resource updated successfully");
    setIsEditResourceModalOpen(false);
    setSelectedResource(null);
  };
  
  const handleReturnResource = async (resource: Resource) => {
    // Only allow returning resources that are returnable and have allocations
    if (!resource.returnable || !resource.resource_allocations || resource.resource_allocations.length === 0) {
      toast.error("This resource cannot be returned");
      return;
    }
    
    try {
      // For simplicity, this example just deletes the allocation
      // In a real app, you might want to create a return record and update inventory
      const { error } = await supabase
        .from('resource_allocations')
        .delete()
        .eq('resource_id', resource.id);
      
      if (error) throw error;
      
      toast.success("Resource marked as returned", {
        description: `${resource.name} has been returned to inventory.`
      });
      
      refetch();
    } catch (error) {
      console.error("Error returning resource:", error);
      toast.error("Failed to process the return");
    }
  };
  
  return (
    <PageLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-gray-500 mt-1">
            Manage materials, equipment, and labor resources
          </p>
        </div>
        <div className="flex space-x-3">
          <Button className="bg-construction-700 hover:bg-construction-800" onClick={handleAddResource}>
            <Plus className="h-4 w-4 mr-2" /> Add Resource
          </Button>
          <Button variant="outline" className="border-construction-700 text-construction-700 hover:bg-construction-50">
            <ShoppingCart className="h-4 w-4 mr-2" /> View Marketplace
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <Box className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Resources</p>
                <h3 className="text-2xl font-bold">{resources ? resources.length : '-'}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full mr-4">
                <Truck className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Resource Utilization</p>
                <h3 className="text-2xl font-bold">{resourcesLoading ? '...' : totalAllocation} Units</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <Loader2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <h3 className="text-2xl font-bold">{resourcesLoading ? '...' : formatCurrency(totalValue)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search resources..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {typeFilter ? typeFilter : "All Types"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setTypeFilter(null)}>
                  All Types
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("Material")}>
                  Material
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("Equipment")}>
                  Equipment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("Labor")}>
                  Labor
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  {categoryFilter ? categoryFilter : "All Categories"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setCategoryFilter(null)}>
                  All Categories
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter("Returnable")}>
                  Returnable
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter("Consumable")}>
                  Consumable
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {priceFilter ? priceFilter : "All Pricing"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setPriceFilter(null)}>
                  All Pricing Types
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriceFilter("Hourly")}>
                  <Clock className="h-4 w-4 mr-2" /> Hourly Rate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriceFilter("Daily")}>
                  <CalendarDays className="h-4 w-4 mr-2" /> Daily Rate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriceFilter("Fixed")}>
                  <DollarSign className="h-4 w-4 mr-2" /> Fixed Price
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Base Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resourcesLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <p className="text-sm text-gray-500 mt-2">Loading resources...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredResources.length > 0 ? (
                    filteredResources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="font-medium">{resource.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getResourceTypeIcon(resource.type)}
                            {resource.type}
                          </div>
                        </TableCell>
                        <TableCell>{getResourceCategoryBadge(resource.returnable)}</TableCell>
                        <TableCell>{getPricingBadge(resource)}</TableCell>
                        <TableCell>{resource.quantity}</TableCell>
                        <TableCell>{resource.unit}</TableCell>
                        <TableCell>{formatCurrency(resource.cost)} / {resource.unit}</TableCell>
                        <TableCell>{getStatusBadge(resource.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditResource(resource)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            
                            {resource.returnable && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600"
                                onClick={() => handleReturnResource(resource)}
                                disabled={!resource.resource_allocations || resource.resource_allocations.length === 0}
                              >
                                <RotateCcw className="h-4 w-4" />
                                <span className="sr-only">Return</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-gray-500">
                        No resources found matching your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="allocation">
          <ResourceStatus resources={filteredResources} isLoading={resourcesLoading} />
        </TabsContent>
      </Tabs>

      <AddResourceModal 
        open={isAddResourceModalOpen}
        onOpenChange={setIsAddResourceModalOpen}
        onResourceAdded={handleResourceAdded}
      />
      
      {selectedResource && (
        <EditResourceModal
          open={isEditResourceModalOpen}
          onOpenChange={setIsEditResourceModalOpen}
          resource={selectedResource}
          onResourceUpdated={handleResourceUpdated}
        />
      )}
    </PageLayout>
  );
};

export default Resources;
