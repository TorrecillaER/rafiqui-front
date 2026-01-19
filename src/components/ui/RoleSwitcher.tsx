'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useHydration } from '@/hooks/useHydration';
import { User, Building2, Eye, ChevronUp, Sparkles } from 'lucide-react';
import type { UserRole } from '@/types';

const roles: { role: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
  { role: 'GUEST', label: 'Visitante', icon: <Eye size={18} />, color: 'bg-dark-600' },
  { role: 'DONOR', label: 'Donador', icon: <User size={18} />, color: 'bg-primary-500' },
  { role: 'PARTNER', label: 'Socio', icon: <Building2 size={18} />, color: 'bg-accent-500' },
];

export function RoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const hydrated = useHydration();
  const { userRole, setUserRole } = useAuthStore();

  if (!hydrated) {
    return null;
  }

  const currentRole = roles.find((r) => r.role === userRole) || roles[0];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-16 right-0 mb-2 glass rounded-xl p-2 min-w-[180px]"
          >
            <div className="text-xs text-dark-400 px-3 py-2 flex items-center gap-2">
              <Sparkles size={12} />
              Demo: Cambiar Rol
            </div>
            {roles.map((item) => (
              <button
                key={item.role}
                onClick={() => {
                  setUserRole(item.role);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  userRole === item.role
                    ? 'bg-dark-700 text-white'
                    : 'text-dark-300 hover:bg-dark-700/50 hover:text-white'
                }`}
              >
                <span className={`p-1.5 rounded-lg ${item.color}`}>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {userRole === item.role && (
                  <motion.div
                    layoutId="activeRole"
                    className="ml-auto w-2 h-2 rounded-full bg-primary-400"
                  />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all duration-300 ${currentRole.color} text-white`}
      >
        {currentRole.icon}
        <span className="font-semibold">{currentRole.label}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronUp size={18} />
        </motion.div>
      </motion.button>
    </div>
  );
}
