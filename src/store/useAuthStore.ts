import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole, User } from '@/types';

interface AuthState {
  user: User | null;
  userRole: UserRole;
  isAuthenticated: boolean;
  setUserRole: (role: UserRole) => void;
  login: (user: User) => void;
  logout: () => void;
}

// Mock users for demo
const mockUsers: Record<UserRole, User | null> = {
  GUEST: null,
  DONOR: {
    id: 'donor-001',
    name: 'María García',
    email: 'maria@ejemplo.com',
    role: 'DONOR',
    avatar: '/avatars/donor.png',
  },
  PARTNER: {
    id: 'partner-001',
    name: 'EcoTech Industries',
    email: 'contacto@ecotech.mx',
    role: 'PARTNER',
    avatar: '/avatars/partner.png',
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      userRole: 'GUEST',
      isAuthenticated: false,

      setUserRole: (role: UserRole) => {
        const user = mockUsers[role];
        set({
          userRole: role,
          user,
          isAuthenticated: role !== 'GUEST',
        });
      },

      login: (user: User) => {
        set({
          user,
          userRole: user.role,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          userRole: 'GUEST',
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'rafiqui-auth',
    }
  )
);
