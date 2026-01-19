---
description: Configurar estructura base con Zustand store, Navbar y RoleSwitcher
---

# Configurar Estructura Base

Este workflow configura el store de autenticación con Zustand, el Navbar responsivo y el componente RoleSwitcher para la demo.

## Contexto

- **Zustand Store**: Maneja el rol del usuario (GUEST, DONOR, PARTNER)
- **Navbar**: Cambia links según el rol del usuario
- **RoleSwitcher**: Componente flotante para cambiar de rol en la demo

## Pasos

### 1. Crear Zustand Store para autenticación

Crear `src/store/useAuthStore.ts`:

```typescript
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
```

### 2. Crear componente RoleSwitcher

Crear `src/components/ui/RoleSwitcher.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { User, Building2, Eye, ChevronUp, Sparkles } from 'lucide-react';
import type { UserRole } from '@/types';

const roles: { role: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
  { role: 'GUEST', label: 'Visitante', icon: <Eye size={18} />, color: 'bg-dark-600' },
  { role: 'DONOR', label: 'Donador', icon: <User size={18} />, color: 'bg-primary-500' },
  { role: 'PARTNER', label: 'Socio', icon: <Building2 size={18} />, color: 'bg-accent-500' },
];

export function RoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { userRole, setUserRole } = useAuthStore();

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
```

### 3. Crear componente Navbar

Crear `src/components/layout/Navbar.tsx`:

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
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
  const { userRole, user, isAuthenticated, logout, setUserRole } = useAuthStore();

  const navLinks = [
    { href: '/donar', label: 'Donar Paneles', icon: <Recycle size={18} />, roles: ['GUEST', 'DONOR', 'PARTNER'] },
    { href: '/market', label: 'Marketplace', icon: <ShoppingBag size={18} />, roles: ['GUEST', 'DONOR', 'PARTNER'] },
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['DONOR', 'PARTNER'] },
  ];

  const filteredLinks = navLinks.filter((link) => link.roles.includes(userRole));

  const handleLogin = () => {
    // For demo, switch to DONOR role
    setUserRole('DONOR');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="p-2 bg-primary-500 rounded-xl"
            >
              <Leaf className="text-white" size={24} />
            </motion.div>
            <span className="text-xl font-display font-bold text-white">
              Rafi<span className="text-primary-400">qui</span>
            </span>
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
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-dark-400 capitalize">{userRole.toLowerCase()}</p>
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
                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user?.name}</p>
                        <p className="text-xs text-dark-400 capitalize">{userRole.toLowerCase()}</p>
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
```

### 4. Crear Layout principal

Actualizar `src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Rafiqui - Reciclaje Solar Inteligente",
  description: "Plataforma de reciclaje de paneles solares. Dona, recicla y transforma.",
  keywords: ["reciclaje", "paneles solares", "sostenibilidad", "ESG", "economía circular"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <Navbar />
        <main className="pt-16 min-h-screen">
          {children}
        </main>
        <RoleSwitcher />
      </body>
    </html>
  );
}
```

### 5. Crear página de inicio

Actualizar `src/app/page.tsx`:

```typescript
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Recycle, ShoppingBag, BarChart3, ArrowRight, Leaf, Zap, Globe } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <Recycle className="text-primary-400" size={32} />,
      title: 'Dona tus Paneles',
      description: 'Solicita recolección gratuita de paneles solares en desuso.',
      href: '/donar',
      color: 'primary',
    },
    {
      icon: <ShoppingBag className="text-accent-400" size={32} />,
      title: 'Marketplace',
      description: 'Compra materiales reciclados y obras de arte únicas.',
      href: '/market',
      color: 'accent',
    },
    {
      icon: <BarChart3 className="text-primary-400" size={32} />,
      title: 'Impacto ESG',
      description: 'Visualiza tu contribución al medio ambiente.',
      href: '/dashboard',
      color: 'primary',
    },
  ];

  const stats = [
    { value: '2,500+', label: 'Paneles Reciclados', icon: <Recycle size={20} /> },
    { value: '150 ton', label: 'CO₂ Ahorrado', icon: <Leaf size={20} /> },
    { value: '89%', label: 'Materiales Recuperados', icon: <Zap size={20} /> },
    { value: '12', label: 'Países', icon: <Globe size={20} /> },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-eco-gradient" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/30 rounded-full text-primary-400 text-sm font-medium mb-6">
              <Leaf size={16} />
              Economía Circular para Energía Solar
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold text-white mb-6"
          >
            Transforma el{' '}
            <span className="text-gradient">Futuro Solar</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-dark-300 max-w-2xl mx-auto mb-10"
          >
            Rafiqui conecta donadores de paneles solares con empresas que transforman 
            residuos en recursos valiosos. Cada panel cuenta una historia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/donar" className="btn-primary flex items-center justify-center gap-2">
              Solicitar Recolección
              <ArrowRight size={18} />
            </Link>
            <Link href="/market" className="btn-outline flex items-center justify-center gap-2">
              Explorar Marketplace
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 px-4 border-y border-dark-700">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500/10 text-primary-400 mb-4">
                  {stat.icon}
                </div>
                <p className="text-3xl md:text-4xl font-display font-bold text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-dark-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              ¿Cómo Funciona?
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Tres simples pasos para ser parte de la revolución del reciclaje solar.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link href={feature.href} className="block group">
                  <div className={`card h-full ${feature.color === 'accent' ? 'card-art' : ''}`}>
                    <div className={`inline-flex p-3 rounded-xl mb-4 ${
                      feature.color === 'accent' ? 'bg-accent-500/10' : 'bg-primary-500/10'
                    }`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-dark-400 mb-4">{feature.description}</p>
                    <span className={`inline-flex items-center gap-2 text-sm font-medium ${
                      feature.color === 'accent' ? 'text-accent-400' : 'text-primary-400'
                    }`}>
                      Explorar
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
```

// turbo
### 6. Verificar compilación

```bash
npm run dev
```

## Verificación Final

- [ ] `useAuthStore.ts` creado con Zustand
- [ ] `RoleSwitcher.tsx` funciona y cambia roles
- [ ] `Navbar.tsx` muestra links según el rol
- [ ] `layout.tsx` incluye Navbar y RoleSwitcher
- [ ] Página de inicio muestra hero y features
- [ ] Navegación funciona correctamente
- [ ] Animaciones de Framer Motion funcionan
- [ ] App compila sin errores

## Siguiente Paso

Continúa con `/step-3-pagina-donar` para crear el formulario de solicitud de recolección.
