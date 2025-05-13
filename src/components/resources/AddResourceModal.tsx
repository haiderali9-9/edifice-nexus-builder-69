
import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import AddResourceForm from "./AddResourceForm";

interface AddResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResourceAdded: () => void;
}

const AddResourceModal: React.FC<AddResourceModalProps> = ({
  open,
  onOpenChange,
  onResourceAdded,
}) => {
  const handleSuccess = () => {
    onResourceAdded();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="h-full flex flex-col p-0 sm:max-w-md md:max-w-lg lg:max-w-xl">
        <div className="flex-grow flex flex-col overflow-y-auto">
          <SheetHeader className="p-6 pb-2">
            <SheetTitle>Add New Resource</SheetTitle>
            <SheetDescription>
              Create a new resource to add to your inventory. Fill out the details below.
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-grow p-6 pt-2 flex justify-center">
            <AddResourceForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddResourceModal;
