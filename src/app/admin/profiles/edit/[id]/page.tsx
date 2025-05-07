'use client';

import { useState, useEffect, use } from 'react';
import { profileApi } from '@/lib/api/profile-api';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Save, Trash } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Define form schema
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  description: z.string().optional(),
  profileCategory: z.string().min(1, { message: 'Category is required' }),
  profileType: z.string().min(1, { message: 'Type is required' }),
});

interface PageParams {
  id: string;
}

// Define the props interface according to Next.js App Router requirements
interface PageProps {
  params: Promise<PageParams>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function EditProfilePage({ params, searchParams }: PageProps) {
  // Use React.use to unwrap the params Promise
  const unwrappedParams = use(params);
  const [profileId] = useState<string>(unwrappedParams.id);
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [deleteUserAccount, setDeleteUserAccount] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      profileCategory: '',
      profileType: '',
    },
  });

  // Fetch profile details
  const fetchProfileDetails = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching profile with ID:', profileId);

      // Use the profileApi service to get the profile by ID
      const result = await profileApi.getProfileByIdAdmin(profileId);

      if (result.success) {
        console.log('Profile data:', result.data);
        setProfile(result.data);

        // Set form values
        form.reset({
          name: result.data.name || '',
          description: result.data.description || '',
          profileCategory: result.data.type?.category || result.data.profileCategory || '',
          profileType: result.data.type?.subtype || result.data.profileType || '',
        });
      } else {
        toast.error('Failed to fetch profile details', {
          description: result.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error fetching profile details:', error);
      toast.error('Failed to fetch profile details', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profileId) {
      fetchProfileDetails();
    }
  }, [profileId]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
      console.log('Submitting form with values:', values);

      const payload = {
        name: values.name,
        description: values.description,
        type: {
          category: values.profileCategory,
          subtype: values.profileType,
        },
      };

      const response = await fetch(`/api/admin/profiles/${profileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Profile updated successfully');
        // Navigate back to profile detail page
        router.push(`/admin/profiles/${profileId}`);
      } else {
        toast.error('Failed to update profile', {
          description: data.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsActionLoading(true);
    try {
      // Build the URL with the deleteUserAccount parameter if needed
      const url = deleteUserAccount
        ? `/api/admin/profiles/${profileId}?deleteUserAccount=true`
        : `/api/admin/profiles/${profileId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete profile');
      }

      // Show different success messages based on what was deleted
      if (deleteUserAccount) {
        toast.success('User account and all associated profiles deleted successfully');
      } else {
        toast.success('Profile deleted successfully');
      }

      setIsDeleteDialogOpen(false);
      router.push('/admin/profiles');
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Profile Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">The requested profile could not be found.</p>
            <Button className="mt-4" onClick={() => router.push('/admin/profiles')}>
              Return to Profiles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Edit Profile: {profile.name}</h1>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDeleteClick}>
          <Trash className="h-4 w-4 mr-2" />
          Delete Profile
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile Information</CardTitle>
          <CardDescription>Update the profile details</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter profile name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name that will be displayed for this profile.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter profile description"
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of this profile.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="profileCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="functional">Functional</SelectItem>
                          <SelectItem value="group">Group</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The category of this profile.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profileType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter profile type" {...field} />
                      </FormControl>
                      <FormDescription>
                        The specific type within the selected category.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Profile</DialogTitle>
            <DialogDescription>
              Choose whether to delete just this profile or the entire user account with all associated profiles.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex items-start space-x-3">
              <div>
                <input
                  type="radio"
                  id="delete-profile-only"
                  name="delete-option"
                  className="mt-1"
                  checked={!deleteUserAccount}
                  onChange={() => setDeleteUserAccount(false)}
                  disabled={isActionLoading}
                />
              </div>
              <div>
                <label htmlFor="delete-profile-only" className="font-medium">Delete profile only</label>
                <p className="text-sm text-muted-foreground">
                  This will delete only the profile "{profile?.name}" while keeping the user account and other profiles.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div>
                <input
                  type="radio"
                  id="delete-user-account"
                  name="delete-option"
                  className="mt-1"
                  checked={deleteUserAccount}
                  onChange={() => setDeleteUserAccount(true)}
                  disabled={isActionLoading}
                />
              </div>
              <div>
                <label htmlFor="delete-user-account" className="font-medium">Delete user account</label>
                <p className="text-sm text-muted-foreground">
                  This will delete the entire user account and all associated profiles. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isActionLoading}
            >
              {isActionLoading ? 'Deleting...' : deleteUserAccount ? 'Delete User Account' : 'Delete Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
