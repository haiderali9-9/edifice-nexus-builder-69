
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PhotoUploadProps {
  avatarUrl: string | null;
  userId: string;
  userInitials: string;
  onAvatarUpdate: (url: string) => void;
}

const PhotoUpload = ({ avatarUrl, userId, userInitials, onAvatarUpdate }: PhotoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Delete existing avatar if there is one
      if (avatarUrl) {
        const oldFilePath = new URL(avatarUrl).pathname.split('/').pop();
        if (oldFilePath) {
          await supabase.storage
            .from('avatars')
            .remove([`${userId}/${oldFilePath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Math.random()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      onAvatarUpdate(publicUrl);

      toast({
        title: "Photo updated",
        description: "Your profile photo has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading photo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={avatarUrl || ''} alt="Profile" />
        <AvatarFallback className="bg-construction-100 text-construction-700 text-xl">
          {userInitials}
        </AvatarFallback>
      </Avatar>
      <div>
        <Button
          variant="outline"
          className="relative"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Change Photo
            </>
          )}
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </Button>
        <p className="text-sm text-gray-500 mt-1">
          Recommended: Square JPG or PNG, max 2MB
        </p>
      </div>
    </div>
  );
};

export default PhotoUpload;
