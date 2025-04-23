'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  UserPlus, 
  Filter, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Download,
  UserX,
  UserCheck,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { myPtsApi } from '@/lib/api/mypts-api';

// Sample user data (replace with API calls)
const mockUsers = Array.from({ length: 20 }).map((_, i) => ({
  id: `user-${i}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i % 5 === 0 ? 'admin' : 'user',
  status: i % 4 === 0 ? 'suspended' : 'active',
  balance: Math.floor(Math.random() * 10000),
  joinDate: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(),
}));

export default function UserManagementPage() {
  const [users, setUsers] = useState(mockUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const itemsPerPage = 10;
  const totalPages = Math.ceil(users.length / itemsPerPage);
  
  // Filter users based on search and active tab
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'admins') return matchesSearch && user.role === 'admin';
    if (activeTab === 'suspended') return matchesSearch && user.status === 'suspended';
    
    return matchesSearch;
  });
  
  // Paginate users
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle user actions
  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };
  
  const handleSuspendUser = (userId: string) => {
    // Show confirmation toast with action
    toast('Confirm user suspension', {
      description: 'Are you sure you want to suspend this user?',
      action: {
        label: 'Suspend',
        onClick: () => {
          // API call would go here
          setUsers(users.map(u => 
            u.id === userId ? { ...u, status: 'suspended' } : u
          ));
          toast.success('User suspended');
        }
      },
      // Note: Toast cancel needs onClick too
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    });
  };
  
  const handleReactivateUser = (userId: string) => {
    // API call would go here
    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: 'active' } : u
    ));
    toast.success('User reactivated');
  };
  
  const handleToggleAdminRole = (userId: string, isAdmin: boolean) => {
    // Show confirmation toast with action
    toast(`Confirm role change`, {
      description: `Are you sure you want to ${isAdmin ? 'remove' : 'grant'} admin privileges?`,
      action: {
        label: isAdmin ? 'Remove Admin' : 'Make Admin',
        onClick: () => {
          // API call would go here
          setUsers(users.map(u => 
            u.id === userId ? { ...u, role: isAdmin ? 'user' : 'admin' } : u
          ));
          toast.success(`User ${isAdmin ? 'removed from' : 'added to'} admin role`);
        }
      },
      // Fix cancel property by adding onClick
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    });
  };
  
  // Get badge variant based on transaction status
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'secondary'; 
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Management</h1>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button size="sm" className="flex items-center gap-1">
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">MyPts Balance</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(user.status)}>
                      {user.status === 'active' ? 'Active' : 'Suspended'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {user.balance.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {formatDate(user.joinDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewUser(user)}
                        title="View details"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      
                      {user.status === 'active' ? (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleSuspendUser(user.id)}
                          className="text-destructive"
                          title="Suspend user"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleReactivateUser(user.id)}
                          className="text-green-600"
                          title="Reactivate user"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {user.role === 'admin' ? (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleToggleAdminRole(user.id, true)}
                          className="text-amber-600"
                          title="Remove admin privileges"
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleToggleAdminRole(user.id, false)}
                          className="text-blue-600"
                          title="Grant admin privileges"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found. Try adjusting your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4">
          <div className="text-sm text-muted-foreground">
            Showing {paginatedUsers.length} of {filteredUsers.length} users
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* User details dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedUser.name}</DialogTitle>
                <DialogDescription>{selectedUser.email}</DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium">Role</h4>
                    <p className="text-sm">
                      <Badge variant={selectedUser.role === 'admin' ? 'default' : 'outline'}>
                        {selectedUser.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Status</h4>
                    <p className="text-sm">
                      <Badge variant={getStatusVariant(selectedUser.status)}>
                        {selectedUser.status === 'active' ? 'Active' : 'Suspended'}
                      </Badge>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">MyPts Balance</h4>
                  <p className="text-xl font-bold">{selectedUser.balance.toLocaleString()}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">Joined</h4>
                  <p className="text-sm">{formatDate(selectedUser.joinDate)}</p>
                </div>
                
                <div className="border-t pt-4 mt-2">
                  <h4 className="text-sm font-medium mb-2">Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.status === 'active' ? (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          handleSuspendUser(selectedUser.id);
                          setIsDetailOpen(false);
                        }}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Suspend User
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          handleReactivateUser(selectedUser.id);
                          setIsDetailOpen(false);
                        }}
                        className="text-green-600"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Reactivate User
                      </Button>
                    )}
                    
                    {selectedUser.role === 'admin' ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          handleToggleAdminRole(selectedUser.id, true);
                          setIsDetailOpen(false);
                        }}
                      >
                        <ShieldAlert className="h-4 w-4 mr-2" />
                        Remove Admin Role
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          handleToggleAdminRole(selectedUser.id, false);
                          setIsDetailOpen(false);
                        }}
                      >
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Grant Admin Role
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
