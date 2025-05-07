import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Eye, MoreHorizontal, Edit, Trash, Award } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface ProfilesTableProps {
  profiles: any[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ProfilesTable({ profiles, isLoading, onRefresh }: ProfilesTableProps) {
  const router = useRouter();
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [deleteUserAccount, setDeleteUserAccount] = useState(false);

  const handleViewProfile = (profile: any) => {
    // Navigate to a profile detail view in the admin section
    router.push(`/admin/profiles/${profile._id}`);
    toast.info(`Viewing profile: ${profile.name}`);
  };

  const handleEditProfile = (profile: any) => {
    // Navigate to the profile edit page in the admin section
    router.push(`/admin/profiles/edit/${profile._id}`);
    toast.info(`Editing profile: ${profile.name}`);
  };

  const handleRewardProfile = (profile: any) => {
    // Navigate to the reward page with the profile ID as a query parameter
    router.push(`/admin/reward?profileId=${profile._id}`);
  };

  const handleDeleteClick = (profile: any) => {
    setSelectedProfile(profile);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProfile) return;

    setIsActionLoading(true);
    try {
      // Build the URL with the deleteUserAccount parameter if needed
      const url = deleteUserAccount
        ? `/api/admin/profiles/${selectedProfile._id}?deleteUserAccount=true`
        : `/api/admin/profiles/${selectedProfile._id}`;

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
      onRefresh();
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const getProfileTypeBadge = (profile: any) => {
    const category = profile.type?.category || profile.profileCategory;
    const type = profile.type?.subtype || profile.profileType;

    let color = '';
    switch (category?.toLowerCase()) {
      case 'individual':
        color = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        break;
      case 'functional':
        color = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        break;
      case 'group':
        color = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
        break;
      default:
        color = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }

    return (
      <div className="flex flex-col gap-1">
        <Badge variant="outline" className={color}>
          {category || 'Unknown'}
        </Badge>
        <span className="text-xs text-muted-foreground">{type || 'Unknown'}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No profiles found</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile._id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {profile.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt={profile.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {profile.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div>{profile.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {profile.description || 'No description'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getProfileTypeBadge(profile)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {profile.owner ? (
                      typeof profile.owner === 'string' ?
                        profile.owner.substring(0, 8) + '...' :
                        profile.owner._id ? profile.owner._id.substring(0, 8) + '...' : 'Unknown'
                    ) : 'Unknown'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {profile.createdAt ? (
                      formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })
                    ) : 'Unknown'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={profile.claimed ? "default" : "outline"}>
                    {profile.claimed ? 'Claimed' : 'Unclaimed'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleViewProfile(profile)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditProfile(profile)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRewardProfile(profile)}>
                        <Award className="h-4 w-4 mr-2" />
                        Reward MyPts
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(profile)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete Profile
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
                  This will delete only the profile "{selectedProfile?.name}" while keeping the user account and other profiles.
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
    </>
  );
}
