'use client';

import { useState, useEffect } from 'react';
// Admin layout is provided by /admin/layout.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { ProfilesTable } from '@/components/admin/profiles-table';
import { toast } from 'sonner';
import { Search, RefreshCw } from 'lucide-react';

export default function AdminProfilesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [limit, setLimit] = useState(20);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      if (searchTerm) {
        params.append('name', searchTerm);
      }

      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }

      // Fetch profiles from API
      const response = await fetch(`/api/admin/profiles?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }

      const data = await response.json();

      if (data.success) {
        setProfiles(data.data.profiles);
        setTotalPages(data.data.pagination.pages);
        setTotalProfiles(data.data.pagination.total);
      } else {
        toast.error('Failed to fetch profiles', {
          description: data.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to fetch profiles', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [page, limit, categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    fetchProfiles();
  };

  const handleRefresh = () => {
    fetchProfiles();
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
            onRefresh={fetchProfiles}
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
