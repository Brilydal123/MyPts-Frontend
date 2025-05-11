import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProfileInfo, useUpdateProfileBasicInfo } from "@/hooks/use-mypts-data";
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';

interface ProfileEditFormProps {
  profileId?: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

export function ProfileEditForm({ profileId, onCancel, onSuccess }: ProfileEditFormProps) {
  // Get profile data
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useProfileInfo(profileId);

  // State for form fields
  const [username, setUsername] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // Initialize form with profile data when it loads
  if (profile && !isFormInitialized) {
    setUsername(profile.name || profile.username || '');
    setDescription(profile.description || '');
    setIsFormInitialized(true);
  }

  // Mutation hook for updating profile
  const updateProfileMutation = useUpdateProfileBasicInfo();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileId) {
      toast.error('No profile selected');
      return;
    }

    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        profileId,
        username,
        description
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Error handling is done in the mutation hook
    }
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="p-4 text-destructive">
        <p>Error loading profile information</p>
        <Button variant="outline" onClick={onCancel} className="mt-2">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="space-y-2">
        <label 
          htmlFor="username" 
          className="text-sm font-medium"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
            fontWeight: 500,
          }}
        >
          Profile Name
        </label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter profile name"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label 
          htmlFor="description" 
          className="text-sm font-medium"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
            fontWeight: 500,
          }}
        >
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter profile description"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={updateProfileMutation.isPending}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
