'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, AlertTriangle, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface RoleIndicatorProps {
  currentRole?: string;
  userEmail?: string;
}

export function RoleIndicator({ currentRole, userEmail }: RoleIndicatorProps) {
  const [showRoleConflict, setShowRoleConflict] = useState(false);
  const [attemptedRole, setAttemptedRole] = useState('');

  useEffect(() => {
    // Check for role conflict in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const roleConflict = urlParams.get('roleConflict');
    const attempted = urlParams.get('attemptedRole');
    
    if (roleConflict === 'true' && attempted) {
      setShowRoleConflict(true);
      setAttemptedRole(attempted);
      
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Show toast notification
      toast({
        title: 'Role Conflict Detected',
        description: `You tried to access ${attempted} but you're logged in as ${currentRole}. Logout first to switch roles.`,
        variant: 'destructive',
      });
    }
  }, [currentRole]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin_demografi':
        return 'Admin Demografi';
      case 'admin_ekonomi':
        return 'Admin Ekonomi';
      case 'admin_lingkungan':
        return 'Admin Lingkungan';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin_demografi':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'admin_ekonomi':
        return 'bg-green-500 hover:bg-green-600';
      case 'admin_lingkungan':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  if (!currentRole || !userEmail) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white border-b border-gray-200">
      {/* Role Conflict Warning */}
      {showRoleConflict && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Role conflict detected! You tried to access {getRoleDisplayName(attemptedRole)} 
            but you're logged in as {getRoleDisplayName(currentRole)}.
          </span>
          <Button
            onClick={() => setShowRoleConflict(false)}
            variant="ghost"
            size="sm"
            className="text-red-700 hover:bg-red-100"
          >
            ×
          </Button>
        </div>
      )}

      {/* Current Role Indicator */}
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-gray-600" />
        <span className="text-sm text-gray-600">{userEmail}</span>
        <Badge className={`${getRoleBadgeColor(currentRole)} text-white`}>
          {getRoleDisplayName(currentRole)}
        </Badge>
      </div>

      {/* Switch Admin Button */}
      <Button
        onClick={handleLogout}
        variant="outline"
        size="sm"
        className="ml-auto flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        Switch Admin
      </Button>

      {/* Info Text */}
      <span className="text-xs text-gray-500">
        To switch admin roles, logout first
      </span>
    </div>
  );
}