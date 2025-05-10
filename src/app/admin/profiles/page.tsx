'use client';

import { useState } from 'react';
// Admin layout is provided by /admin/layout.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/custom/pagination';
import { ProfilesTable } from '@/components/admin/profiles-table';
import { toast } from 'sonner';
import { Search, RefreshCw } from 'lucide-react';
import { useProfiles } from '@/hooks/useProfileData';

// Main component for admin profiles page
export default function AdminProfilesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Use our custom hook to fetch profiles
  const {
    data: profilesData,
    isLoading,
    refetch
  } = useProfiles({
    page: page.toString(),
    limit: limit.toString(),
    name: searchTerm || undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined
  });

  const profiles = profilesData?.profiles || [];
  const totalPages = profilesData?.pagination?.pages || 1;
  const totalProfiles = profilesData?.pagination?.total || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    refetch();
  };

  const handleRefresh = () => {
    refetch();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Profile Management</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Profiles</CardTitle>
          <CardDescription>Find profiles by name, type, or category</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search by profile name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="functional">Functional</SelectItem>
                <SelectItem value="group">Group</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Profiles</CardTitle>
          <CardDescription>
            Showing {profiles.length} of {totalProfiles} profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfilesTable
            profiles={profiles}
            isLoading={isLoading}
            onRefresh={refetch}
          />

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
