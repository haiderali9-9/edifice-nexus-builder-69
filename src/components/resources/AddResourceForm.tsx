
import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";

// Predefined list of resources based on the image
const availableResources = [
  { name: "Brick", type: "Material" },
  { name: "Cement", type: "Material" },
  { name: "Crane", type: "Equipment" },
  { name: "Drill", type: "Equipment" },
  { name: "Forklift", type: "Equipment" },
  { name: "Helmet", type: "Equipment" },
  { name: "Ladder", type: "Equipment" },
  { name: "Lumber", type: "Material" },
  { name: "Steel", type: "Material" },
];

// Predefined list of measurement units - now including equipment names
const availableUnits = [
  "kg", "tons", "cubic meters", "pieces", "pallets", 
  "hours", "days", "meters", "square meters",
  // Adding equipment names as units
  "Brick", "Cement", "Crane", "Drill", "Forklift", 
  "Helmet", "Ladder", "Lumber", "Steel"
];

// Define form schema for resource validation
const resourceSchema = z.object({
  name: z.string().min(1, "Resource name is required"),
  type: z.enum(["Material", "Equipment", "Labor"]),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  cost: z.coerce.number().positive("Cost must be positive"),
  status: z.enum(["Available", "Low Stock", "Out of Stock"]),
  returnable: z.boolean().default(false),
  hourlyRate: z.boolean().default(false),
  dailyRate: z.boolean().default(false),
});

type ResourceFormValues = z.infer<typeof resourceSchema>;

interface AddResourceFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddResourceForm: React.FC<AddResourceFormProps> = ({ onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Set up form with default values
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      name: "",
      type: "Material",
      quantity: 0,
      unit: "",
      cost: 0,
      status: "Available",
      returnable: false,
      hourlyRate: false,
      dailyRate: false,
    },
  });

  // Handle resource selection and auto-set the type
  const handleResourceSelection = (resourceName: string) => {
    const selectedResource = availableResources.find(r => r.name === resourceName);
    if (selectedResource) {
      form.setValue("name", resourceName);
      form.setValue("type", selectedResource.type as any);
      
      // Set default returnable value for equipment
      if (selectedResource.type === "Equipment") {
        form.setValue("returnable", true);
      } else {
        form.setValue("returnable", false);
      }
      
      // Auto-set the unit to match the resource name if it's in the available units
      if (availableUnits.includes(resourceName)) {
        form.setValue("unit", resourceName);
      }
    }
  };

  // Watch for returnable changes to update form
  const isReturnable = form.watch("returnable");
  const isHourlyRate = form.watch("hourlyRate");
  const isDailyRate = form.watch("dailyRate");

  // Toggle pricing options
  const handleHourlyRateChange = (checked: boolean) => {
    form.setValue("hourlyRate", checked);
    if (checked) {
      form.setValue("dailyRate", false);
    }
  };

  const handleDailyRateChange = (checked: boolean) => {
    form.setValue("dailyRate", checked);
    if (checked) {
      form.setValue("hourlyRate", false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: ResourceFormValues) => {
    setIsSubmitting(true);
    try {
      // Prepare the data to insert
      const resourceData = {
        name: data.name,
        type: data.type,
        quantity: data.quantity,
        unit: data.unit,
        cost: data.cost,
        status: data.status,
        returnable: data.returnable,
      };

      // Add pricing data if applicable
      if (data.returnable) {
        if (data.hourlyRate) {
          resourceData["hour_rate"] = data.cost;
        } else if (data.dailyRate) {
          resourceData["day_rate"] = data.cost;
        }
      }

      // Insert new resource into Supabase
      const { data: newResource, error } = await supabase
        .from("resources")
        .insert(resourceData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Resource added",
        description: `${data.name} has been added successfully.`,
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error adding resource:", error);
      toast({
        title: "Error adding resource",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource</FormLabel>
                  <Select 
                    onValueChange={(value) => handleResourceSelection(value)} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a resource" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableResources.map((resource) => (
                        <SelectItem key={resource.name} value={resource.name}>
                          {resource.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Type</FormLabel>
                  <FormControl>
                    <Input value={field.value} readOnly className="bg-gray-50" />
                  </FormControl>
                  <FormDescription>
                    Type is automatically set based on the selected resource
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Cost per Unit ($)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Low Stock">Low Stock</SelectItem>
                      <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="returnable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Returnable Resource</FormLabel>
                    <FormDescription>
                      Is this resource returnable after use?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={form.watch("type") === "Equipment"} // Disable switch for equipment as they are always returnable
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isReturnable && (
              <div className="border rounded-md p-4 mt-4">
                <FormLabel className="mb-2 block">Duration Pricing</FormLabel>
                <FormDescription className="mb-3">
                  Select pricing type for time-based usage
                </FormDescription>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hourlyRate" 
                      checked={isHourlyRate} 
                      onCheckedChange={handleHourlyRateChange}
                    />
                    <label
                      htmlFor="hourlyRate"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Hourly Rate
                    </label>
                    {isHourlyRate && <Check className="h-4 w-4 text-green-500 ml-2" />}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="dailyRate" 
                      checked={isDailyRate}
                      onCheckedChange={handleDailyRateChange}
                    />
                    <label
                      htmlFor="dailyRate"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Daily Rate
                    </label>
                    {isDailyRate && <Check className="h-4 w-4 text-green-500 ml-2" />}
                  </div>
                  
                  {(isHourlyRate || isDailyRate) ? (
                    <p className="text-sm text-green-500 mt-2">
                      Base cost will be used as the {isHourlyRate ? "hourly" : "daily"} rate
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">
                      No time-based pricing selected
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Resource"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddResourceForm;
