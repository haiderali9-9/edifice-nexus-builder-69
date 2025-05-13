
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Resource } from "@/types";

interface EditResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: Resource;
  onResourceUpdated: () => void;
}

const EditResourceModal: React.FC<EditResourceModalProps> = ({
  open,
  onOpenChange,
  resource,
  onResourceUpdated,
}) => {
  const { toast } = useToast();
  const [name, setName] = useState(resource.name);
  const [unit, setUnit] = useState(resource.unit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('resources')
        .update({
          name,
          unit
        })
        .eq('id', resource.id);
      
      if (error) throw error;
      
      onResourceUpdated();
    } catch (error) {
      console.error("Error updating resource:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update the resource. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit Resource</SheetTitle>
          <SheetDescription>
            Update the resource details. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Resource Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="unit">Unit of Measurement</Label>
            <Input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
            />
            <p className="text-sm text-gray-500">
              Specify the unit used for this resource (e.g., kg, tons, hours)
            </p>
          </div>
          
          <SheetFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EditResourceModal;
