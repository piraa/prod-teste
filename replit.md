# Produtivo.AI

## Overview

Produtivo.AI is a productivity dashboard application built with React and TypeScript. It provides users with a comprehensive interface for managing daily tasks, tracking habits, monitoring goals, and viewing calendar events. The application features a modern, responsive design with dark/light theme support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Framework
- **React 19** with TypeScript for type-safe component development
- **Vite** as the build tool and development server for fast HMR and optimized builds
- Components are organized in a flat structure under `/components` directory

### Styling Approach
- **Tailwind CSS** loaded via CDN with custom configuration
- CSS custom properties (CSS variables) for theming, enabling seamless dark/light mode switching
- Design system uses semantic color tokens (background, foreground, primary, secondary, etc.)

### State Management
- Local React state using `useState` hooks
- No external state management library - application is currently using mock data
- Theme preference detection via `window.matchMedia` for system preference

### Component Architecture
- Functional components with TypeScript interfaces
- Props-based data flow from parent to child components
- Shared type definitions in `/types.ts` for Task, Habit, Goal, and Stat interfaces

### Data Layer
- Currently uses mock data defined directly in `App.tsx`
- No backend integration or API calls implemented yet
- Prepared for Gemini API integration (environment variable `GEMINI_API_KEY` configured in Vite)

### Theming System
- Dark mode controlled via `dark` class on HTML root element
- CSS variables defined in `index.html` for both light and dark themes
- Theme toggle persists user preference visually but not to storage

## External Dependencies

### Core Libraries
- **React 19.2.3** - UI framework
- **React DOM 19.2.3** - React renderer for web
- **Lucide React 0.562.0** - Icon library

### Development Tools
- **Vite 6.2.0** - Build tool and dev server
- **TypeScript 5.8.2** - Type checking
- **@vitejs/plugin-react** - React plugin for Vite

### External Services (Prepared but not implemented)
- **Google Gemini API** - AI capabilities (API key configured via environment variable)
- Google Fonts CDN for Inter font family

### CDN Dependencies
- Tailwind CSS loaded via CDN script tag
- Google Fonts for Inter typeface