'use client';

import { useState, useEffect, use } from 'react';
import { AppSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, Mail, Calendar, Shield, Trash2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  created_at: string;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
}

interface EditUserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
}

export default function UsersPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = use(params);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMenuAnimating, setDeleteMenuAnimating] = useState(false);
  const [createFormAnimating, setCreateFormAnimating] = useState(false);
  const [editFormAnimating, setEditFormAnimating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreateUserData>({
    name: '',
    email: '',
    password: '',
    role: 'employee'
  });
  const [editData, setEditData] = useState<EditUserData>({
    id: '',
    name: '',
    email: '',
    role: 'employee'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // Auto-hide success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token not found. Please login again.');
        return;
      }

      const response = await fetch('http://localhost:3000/auth/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.employees)) {
        setUsers(data.employees);
      } else {
        console.error('Invalid response format:', data);
        setError('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating user with data:', formData);
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token not found. Please login again.');
        return;
      }

      console.log('Sending request to create employee...');
      const response = await fetch('http://localhost:3000/auth/create-employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (result.success) {
        setSuccess('User created successfully!');
        setFormData({ name: '', email: '', password: '', role: 'employee' });
        setCreateFormAnimating(false);
        setTimeout(() => {
          setShowCreateForm(false);
        }, 150);
        fetchUsers();
      } else {
        setError(result.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditUser = (user: User) => {
    setEditData({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    if (showCreateForm) {
      // Close create form first, then open edit form
      setCreateFormAnimating(false);
      setTimeout(() => {
        setShowCreateForm(false);
        setShowEditForm(true);
        setTimeout(() => {
          setEditFormAnimating(true);
        }, 10);
      }, 150);
    } else {
      setShowEditForm(true);
      setShowCreateForm(false);
      setShowDeleteMenu(false);
      setTimeout(() => {
        setEditFormAnimating(true);
      }, 10);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditing(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token not found. Please login again.');
        return;
      }

      const response = await fetch('http://localhost:3000/auth/update-employee', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('User updated successfully!');
        setEditData({ id: '', name: '', email: '', role: 'employee' });
        setEditFormAnimating(false);
        setTimeout(() => {
          setShowEditForm(false);
        }, 150);
        fetchUsers();
      } else {
        setError(result.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteMenu(true);
    setShowCreateForm(false);
    setShowEditForm(false);
    
    // Trigger animation after a short delay
    setTimeout(() => {
      setDeleteMenuAnimating(true);
    }, 10);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token not found. Please login again.');
        return;
      }

      const response = await fetch('http://localhost:3000/auth/delete-employee', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: userToDelete.id }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('User deleted successfully!');
        
        // Animate out before closing
        setDeleteMenuAnimating(false);
        setTimeout(() => {
          setUserToDelete(null);
          setShowDeleteMenu(false);
          fetchUsers();
        }, 200);
      } else {
        setError(result.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteMenuAnimating(false);
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setUserToDelete(null);
      setShowDeleteMenu(false);
      setShowCreateForm(false);
      setShowEditForm(false);
    }, 200);
  };

  const filteredUsers = Array.isArray(users) ? users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'employee':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
        {/* HEADER */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/${org}/dashboard`}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${org}/settings`}>
                  Settings
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Users</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* MAIN */}
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Users</h1>
              <p className="text-gray-600 mt-1">
                Manage your organization's users and their permissions
              </p>
            </div>
            <Button
              onClick={() => {
                if (showEditForm) {
                  // Close edit form first, then open create form
                  setEditFormAnimating(false);
                  setTimeout(() => {
                    setShowEditForm(false);
                    setShowCreateForm(true);
                    setTimeout(() => {
                      setCreateFormAnimating(true);
                    }, 10);
                  }, 150);
                } else {
                  setShowCreateForm(true);
                  setShowEditForm(false);
                  setShowDeleteMenu(false);
                  setTimeout(() => {
                    setCreateFormAnimating(true);
                  }, 10);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>

          {/* Search and Stats */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* Create User Form */}
          {showCreateForm && (
            <Card className={`transform transition-all duration-150 ease-out ${
              createFormAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <CardHeader>
                <CardTitle>Create New User</CardTitle>
                <CardDescription>
                  Add a new user to your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter password"
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={creating}
                      className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    >
                      {creating ? 'Creating...' : 'Create User'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCreateFormAnimating(false);
                        setTimeout(() => {
                          setShowCreateForm(false);
                        }, 150);
                      }}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Edit User Form */}
          {showEditForm && (
            <Card className={`transform transition-all duration-150 ease-out ${
              editFormAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <CardHeader>
                <CardTitle>Edit User</CardTitle>
                <CardDescription>
                  Update user information and role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <Input
                        id="edit-name"
                        name="name"
                        type="text"
                        value={editData.name}
                        onChange={handleEditInputChange}
                        required
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <Input
                        id="edit-email"
                        name="email"
                        type="email"
                        value={editData.email}
                        onChange={handleEditInputChange}
                        required
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      id="edit-role"
                      name="role"
                      value={editData.role}
                      onChange={handleEditInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={editing}
                      className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    >
                      {editing ? 'Updating...' : 'Update User'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditFormAnimating(false);
                        setTimeout(() => {
                          setShowEditForm(false);
                        }, 150);
                      }}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Error Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Success Notification - Top Right */}
          {success && (
            <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                {success}
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 && !showCreateForm ? (
              <Card>
                <CardContent className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 'No users match your search criteria.' : 'Get started by adding your first user.'}
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={() => {
                        console.log('Add First User button clicked');
                        setShowCreateForm(true);
                        setShowEditForm(false);
                        setShowDeleteMenu(false);
                        setTimeout(() => {
                          setCreateFormAnimating(true);
                        }, 10);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First User
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : filteredUsers.length === 0 && showCreateForm ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Fill out the form above to create your first user</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>Joined {formatDate(user.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          <Shield className="w-3 h-3 mr-1" />
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="cursor-pointer"
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="cursor-pointer text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

      {/* Delete Confirmation Sidebar */}
      {showDeleteMenu && userToDelete && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="flex-1"
            onClick={cancelDelete}
          ></div>
          
          {/* Sidebar */}
          <div className={`w-96 bg-white shadow-xl transform transition-transform duration-200 ease-out ${
            deleteMenuAnimating ? 'translate-x-0' : 'translate-x-full'
          }`}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Delete User</h2>
                <p className="text-gray-600 mt-1">This action cannot be undone.</p>
              </div>
              
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-red-900">{userToDelete.name}</h3>
                      <p className="text-red-700">{userToDelete.email}</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete this user? This will permanently remove 
                  their account and all associated data.
                </p>
                
                <div className="flex gap-3">
                  <Button
                    onClick={confirmDeleteUser}
                    disabled={deleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                  >
                    {deleting ? 'Deleting...' : 'Delete User'}
                  </Button>
                  <Button
                    onClick={cancelDelete}
                    variant="outline"
                    className="flex-1 cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
    </AuthGuard>
  );
}
