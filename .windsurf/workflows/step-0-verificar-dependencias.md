---
description: Verificar instalación de dependencias para proyecto Next.js
---

# Verificar Dependencias del Sistema

Este workflow verifica que todas las dependencias necesarias estén instaladas para crear el proyecto Next.js de Rafiqui.

## Requisitos

- Node.js 18.17+ (recomendado 20 LTS)
- npm 9+ o pnpm
- Git

## Pasos

// turbo
### 1. Verificar Node.js

```bash
node -v
```

Debe mostrar v18.17.0 o superior. Si no está instalado o es una versión anterior:

```bash
# macOS con Homebrew
brew install node@20

# O usar nvm
nvm install 20
nvm use 20
```

// turbo
### 2. Verificar npm

```bash
npm -v
```

Debe mostrar 9.0.0 o superior.

// turbo
### 3. Verificar Git

```bash
git --version
```

### 4. Verificar espacio en disco

```bash
df -h .
```

Asegúrate de tener al menos 1GB libre.

## Verificación Final

- [ ] Node.js 18.17+ instalado
- [ ] npm 9+ instalado
- [ ] Git instalado
- [ ] Espacio en disco suficiente


