'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useHydration } from '@/hooks/useHydration';
import {
  Recycle,
  ShoppingBag,
  LayoutDashboard,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Leaf,
} from 'lucide-react';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const hydrated = useHydration();
  const { userRole, user, isAuthenticated, logout, setUserRole } = useAuthStore();

  const navLinks = [
    { href: '/donar', label: 'Donar Paneles', icon: <Recycle size={18} />, roles: ['GUEST', 'DONOR', 'PARTNER'] },
    { href: '/market', label: 'Marketplace', icon: <ShoppingBag size={18} />, roles: ['GUEST', 'DONOR', 'PARTNER'] },
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['DONOR', 'PARTNER'] },
  ];

  const currentUserRole = hydrated ? userRole : 'GUEST';
  const currentUser = hydrated ? user : null;
  const currentIsAuthenticated = hydrated ? isAuthenticated : false;

  const filteredLinks = navLinks.filter((link) => link.roles.includes(currentUserRole));

  const handleLogin = () => {
    setUserRole('DONOR');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <img 
                src="https://res.cloudinary.com/dszhbfyki/image/upload/v1768532345/logo-min.png" 
                alt="Rafiqui Logo" 
                className="h-10 w-auto"
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {filteredLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white'
                      : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                  }`}
                >
                  {link.icon}
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-primary-500/20 border border-primary-500/50 rounded-xl -z-10"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center gap-4">
            {currentIsAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{currentUser?.name}</p>
                  <p className="text-xs text-dark-400 capitalize">{currentUserRole.toLowerCase()}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 btn-primary"
              >
                <LogIn size={18} />
                Iniciar Sesión
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-dark-700"
          >
            <div className="px-4 py-4 space-y-2">
              {filteredLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                      isActive
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                        : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                );
              })}
              
              <div className="pt-4 border-t border-dark-700">
                {currentIsAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{currentUser?.name}</p>
                        <p className="text-xs text-dark-400 capitalize">{currentUserRole.toLowerCase()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      handleLogin();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 btn-primary"
                  >
                    <LogIn size={18} />
                    Iniciar Sesión
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
