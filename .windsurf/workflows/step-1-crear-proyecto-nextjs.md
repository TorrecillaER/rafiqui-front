---
description: Crear proyecto Next.js con TypeScript, Tailwind y dependencias
---

# Crear Proyecto Next.js para Rafiqui

Este workflow inicializa el proyecto Next.js con todas las dependencias necesarias para la plataforma de reciclaje solar.

## Contexto

Rafiqui Frontend es una aplicación web para:
- Donadores de paneles solares (solicitar recolección)
- Marketplace de materiales reciclados y galería de arte
- Dashboard con métricas de impacto ESG

## Stack Tecnológico

- **Framework**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React
- **Gráficas**: Recharts
- **Animaciones**: Framer Motion
- **Estado**: Zustand

## Pasos

### 1. Crear proyecto Next.js

```bash
cd /Users/aaronisraeltorrecillajimenez/Documents/rafiqui-front
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Responder a las preguntas:
- Would you like to use TypeScript? **Yes**
- Would you like to use ESLint? **Yes**
- Would you like to use Tailwind CSS? **Yes**
- Would you like to use `src/` directory? **Yes**
- Would you like to use App Router? **Yes**
- Would you like to customize the default import alias? **Yes** (@/*)

### 2. Instalar dependencias adicionales

```bash
npm install lucide-react recharts framer-motion zustand
```

### 3. Instalar dependencias de desarrollo

```bash
npm install -D @types/node
```

### 4. Configurar Tailwind con colores personalizados

Actualizar `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Rafiqui - Economía circular solar
        primary: {
          DEFAULT: "#E6086A", // Razzmatazz - Rosa Rafiqui
          50: "#FFF0F5",
          100: "#FFE0EB",
          200: "#FFC2D7",
          300: "#FF94B8",
          400: "#FF5C93",
          500: "#E6086A",
          600: "#CC0660",
          700: "#B30554",
          800: "#990448",
          900: "#80033C",
        },
        accent: {
          DEFAULT: "#93E1D8", // Tiffany Blue - Turquesa
          50: "#F0FDFB",
          100: "#E0FAF6",
          200: "#C2F5ED",
          300: "#93E1D8",
          400: "#6DD4C8",
          500: "#4DC7B8",
          600: "#3AAFA0",
          700: "#2E9488",
          800: "#257A70",
          900: "#1C5F58",
        },
        dark: {
          DEFAULT: "#102038", // Oxford Blue
          50: "#F0F4F8",
          100: "#D9E2EC",
          200: "#BCCCDC",
          300: "#9FB3C8",
          400: "#829AB1",
          500: "#627D98",
          600: "#486581",
          700: "#334E68",
          800: "#1A3A52",
          900: "#102038",
          950: "#0A1525",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "rafiqui-gradient": "linear-gradient(135deg, #102038 0%, #1A3A52 100%)",
        "rafiqui-accent": "linear-gradient(135deg, #E6086A 0%, #93E1D8 100%)",
        "rafiqui-dark": "linear-gradient(180deg, #102038 0%, #0A1525 100%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px #E6086A, 0 0 10px #E6086A" },
          "100%": { boxShadow: "0 0 20px #E6086A, 0 0 30px #E6086A" },
        },
        "glow-accent": {
          "0%": { boxShadow: "0 0 5px #93E1D8, 0 0 10px #93E1D8" },
          "100%": { boxShadow: "0 0 20px #93E1D8, 0 0 30px #93E1D8" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### 5. Configurar estilos globales

Actualizar `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

@layer base {
  :root {
    --background: 210 33% 14%; /* Oxford Blue */
    --foreground: 0 0% 100%;
    --primary: 338 93% 47%; /* Razzmatazz */
    --accent: 173 55% 73%; /* Tiffany Blue */
  }

  body {
    @apply bg-dark-900 text-white antialiased;
    background: linear-gradient(180deg, #102038 0%, #0A1525 100%);
    min-height: 100vh;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/30;
  }

  .btn-accent {
    @apply bg-accent-300 hover:bg-accent-400 text-dark-900 font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-accent-300/30;
  }

  .btn-outline {
    @apply border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300;
  }

  .btn-outline-accent {
    @apply border-2 border-accent-300 text-accent-300 hover:bg-accent-300 hover:text-dark-900 font-semibold py-3 px-6 rounded-xl transition-all duration-300;
  }

  .card {
    @apply bg-dark-800/80 border border-dark-700 rounded-2xl p-6 transition-all duration-300 hover:border-primary-500/50 backdrop-blur-sm;
  }

  .card-accent {
    @apply bg-dark-800/80 border border-dark-700 rounded-2xl p-6 transition-all duration-300 hover:border-accent-300/50 backdrop-blur-sm;
  }

  .input-field {
    @apply w-full bg-dark-800/80 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all duration-300;
  }

  .glass {
    @apply bg-dark-800/50 backdrop-blur-xl border border-dark-700/50;
  }

  .glass-primary {
    @apply bg-primary-500/10 backdrop-blur-xl border border-primary-500/20;
  }

  .glass-accent {
    @apply bg-accent-300/10 backdrop-blur-xl border border-accent-300/20;
  }
}

@layer utilities {
  .text-gradient {
    @apply bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent;
  }

  .text-gradient-accent {
    @apply bg-gradient-to-r from-accent-300 to-accent-500 bg-clip-text text-transparent;
  }

  .text-gradient-mixed {
    @apply bg-gradient-to-r from-primary-500 to-accent-300 bg-clip-text text-transparent;
  }

  .glow-primary {
    box-shadow: 0 0 20px rgba(230, 8, 106, 0.3);
  }

  .glow-accent {
    box-shadow: 0 0 20px rgba(147, 225, 216, 0.3);
  }
}
```

### 6. Crear estructura de carpetas

```bash
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/forms
mkdir -p src/components/market
mkdir -p src/components/dashboard
mkdir -p src/store
mkdir -p src/lib
mkdir -p src/types
mkdir -p src/hooks
mkdir -p src/data
```

### 7. Crear archivo de tipos base

Crear `src/types/index.ts`:

```typescript
export type UserRole = 'GUEST' | 'DONOR' | 'PARTNER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface CollectionRequest {
  id: string;
  address: string;
  panelCount: number;
  type: 'residential' | 'industrial';
  status: 'pending' | 'approved' | 'collected' | 'processed';
  createdAt: Date;
}

export interface Material {
  id: string;
  name: string;
  type: 'aluminum' | 'glass' | 'silicon' | 'copper';
  quantity: number; // Toneladas
  pricePerTon: number;
  available: boolean;
  image: string;
}

export interface ArtPiece {
  id: string;
  title: string;
  artist: string;
  description: string;
  price: number;
  image: string;
  category: 'nft' | 'sculpture' | 'installation';
  isAvailable: boolean;
}

export interface ESGMetrics {
  co2Saved: number; // kg
  treesEquivalent: number;
  energySaved: number; // kWh
  waterSaved: number; // Litros
  panelsRecycled: number;
}

export interface AIStory {
  id: string;
  title: string;
  content: string;
  generatedAt: Date;
  panelOrigin: string;
}
```

// turbo
### 8. Verificar instalación

```bash
npm run dev
```

Abrir http://localhost:3000 para verificar que el proyecto funciona.

## Estructura de Carpetas Final

```
rafiqui-front/
├── src/
│   ├── app/
│   │   ├── donar/
│   │   │   └── page.tsx
│   │   ├── market/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── forms/
│   │   ├── market/
│   │   └── dashboard/
│   ├── store/
│   │   └── useAuthStore.ts
│   ├── lib/
│   ├── types/
│   │   └── index.ts
│   ├── hooks/
│   └── data/
├── public/
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Verificación Final

- [ ] Proyecto Next.js creado con App Router
- [ ] TypeScript configurado
- [ ] Tailwind CSS con colores personalizados
- [ ] Dependencias instaladas (lucide-react, recharts, framer-motion, zustand)
- [ ] Estructura de carpetas creada
- [ ] Tipos base definidos
- [ ] `npm run dev` funciona sin errores

