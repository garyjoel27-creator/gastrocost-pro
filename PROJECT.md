# Project: MisePro Luxury Executive Redesign

## Architecture & Tech Stack
- **Framework**: React 19 + TypeScript 6 (`verbatimModuleSyntax: true`, `noUnusedLocals: true`)
- **Bundler**: Vite 8 (`npm run build` executes `tsc -b && vite build`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss: ^4.3.3`) + CSS Custom Properties for dual theming
- **State Management**: Zustand 5 + `idb-keyval` persistence
- **Animations & Gestures**: Framer Motion 11
- **Drag-and-Drop**: `@hello-pangea/dnd` 17
- **Icons**: Lucide React

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Dual Theme Engine | Dark Luxury (default) and Warm Ivory modes with instant toggle, FOUC prevention script, and localStorage persistence | M1 | Survey 1 |
| 2 | Executive Typography | Google Fonts Inter (operational UI) + Playfair Display / Cormorant Garamond (brand, headers, KPIs) | M1 | Survey 1 |
| 3 | Station Chromatic Engine | Dynamic palette for Saucier (Amber #f59e0b), Garde Manger (Emerald #10b981), Pescados (Ocean #0284c7), Carnes (Crimson #ef4444) | M2 | Survey 2 |
| 4 | Active Station UI Integration | Station-specific glowing tabs, active border accents, column headers, and badge indicators | M2 | Survey 2 |
| 5 | 3D Multilayer Elevation | Eradicate flat `border-slate-900` & `shadow-none`; apply multilayer depth (`shadow-xl shadow-black/40`, subtle luminous borders) | M3 | Survey 2 |
| 6 | Interactive Micro-Interactions | TaskCard hover lift (`hover:-translate-y-1 hover:shadow-2xl`), animated pulsating beacon (`animate-ping`) on critical tasks | M3 | Survey 2 |
| 7 | Glassmorphic Overlays | High-end frosted glass (`backdrop-blur-lg bg-black/60`) for Logistics Drawer, Shopping Modal, and Sticky Header | M3 | Survey 2 |
| 8 | Kitchen Touch Ergonomics | Upgrade all interactive touch targets to at least 48x48px (resolving 11 failing elements) | M4 | Survey 3 |
| 9 | Kinetic Swipe Underlays | Multi-stop luxury gradients, kinetic micro-iconography, high-contrast state typography for mobile swipe | M4 | Survey 3 |
| 10 | Tablet & Mobile Fluidity | Smooth DnD drag sensors, tablet layout affordance, gesture locking with `popLayout` transitions | M4 | Survey 3 |
| 11 | Production Build & Zero Regressions | Strict TypeScript compilation and bundle generation via `npm run build` in `brigade-sync` | M5 | Survey 1, 2, 3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Theme Engine & Typography | Dual Theme (Dark Luxury / Warm Ivory), Google Fonts, Sticky Header toggle, CSS tokens | none | DONE |
| M2 | Station Chromatic Identity | Station configuration types/constants, dynamic tabs, station badge highlights, board accents | M1 | DONE |
| M3 | 3D Elevation & Glassmorphism | Eradicate `border-slate-900`, TaskCard elevation/pulse, Drawer & Modal glassmorphism | M1, M2 | DONE |
| M4 | Touch Ergonomics & Underlays | 48x48px touch targets, kinetic swipe underlays, tablet DnD and mobile gesture polish | M1, M2, M3 | DONE |
| M5 | E2E Build, Verification & Audit | `npm run build`, forensic audit, reviewer and challenger verification | M1, M2, M3, M4 | DONE |

## Code Layout & File Boundaries
- `brigade-sync/index.html`: Fonts preconnect/stylesheet links, FOUC inline script, viewport, PWA listener
- `brigade-sync/src/index.css`: Tailwind v4 theme directives, CSS variables (`:root` for Ivory, `.dark` for Luxury), font classes
- `brigade-sync/src/types/stations.ts`: Station chromatic configurations, icons, and themes
- `brigade-sync/src/App.tsx`: Sticky Header with luxury Theme Toggle, Station tabs, Station selector
- `brigade-sync/src/components/TaskCard.tsx`: TaskCard 3D elevation, station accents, pulse badges, swipe underlays
- `brigade-sync/src/components/KanbanBoard.tsx`: Column elevation, station glows, tablet/mobile layout, segmented status tabs
- `brigade-sync/src/components/LogisticsDrawer.tsx`: Glassmorphism drawer, grouped ingredient cards, 48px controls
- `brigade-sync/src/components/ShoppingModal.tsx`: Glassmorphism modal, ingredient checklist, 48px touch targets
