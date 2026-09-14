# 🏛️ BLUEPRINT MAESTRO: ARQUITECTURA PWA PARA HOSTELERÍA Y ALTA COCINA (MISEPRO STANDARD)

Este documento es la **Guía Maestra y Especificación Técnica Definitiva** para replicar, clonar o inicializar desde cero cualquier aplicación web progresiva (PWA) de nivel profesional para brigadas de cocina, restaurantes de lujo, hoteles, servicios de catering o coctelería.

---

## 🎯 1. Filosofía y Principios No Negociables

1. **Offline-First Absoluto (Resiliencia en Cámaras Frigoríficas y Sótanos):**
   - La aplicación debe funcionar al 100% sin conexión a internet.
   - El almacenamiento NO debe bloquear el hilo de renderizado (UI thread). Prohibido usar `localStorage` para conjuntos de datos pesados; obligatorio **IndexedDB** mediante `idb-keyval`.

2. **Diseño Adaptativo por Hardware (Físico en Cocina):**
   - **Tablets / Pantallas de Pase (>= 768px):** Tablero panorámico de 3 columnas (Pendiente, En Proceso, Completado) con Drag-and-Drop fluido (`@hello-pangea/dnd`).
   - **Móviles de Cocineros / Camareros (< 768px):** Lista vertical con barra segmentada de estados y gestos táctiles de **Swipe a una mano** (`framer-motion`). Deslizar a la derecha avanza de estado; deslizar a la izquierda retrocede.

3. **Ergonomía Táctil Extrema (Dedos húmedos, guantes, prisas):**
   - **Touch Targets Mínimos:** Todos los botones interactivos deben medir como mínimo **48x48px** (`min-h-[48px] min-w-[48px]`).
   - Botón Flotante Permanente (FAB) en la esquina inferior para crear tareas sin scroll.
   - Acceso rápido inline para añadir tareas en 2 toques sin abrir modales pesados.
   - Modo edición en línea (doble toque) directamente sobre cualquier tarjeta.

4. **Identidad Visual Ejecutiva de Alto Rendimiento (Lujo + Legibilidad):**
   - **Tema Dual Conmutable:**
     - **Dark Luxury (Default):** Fondos carbón profundo (`#0b0f19`), superficies elevadas (`#0f172a`, `#1e293b`), bordes con sutil resplandor ámbar/dorado, glassmorphism con `backdrop-blur-md` y sombras multicapa profundas.
     - **Warm Ivory:** Fondo marfil cálido (`#fcfaf6`), tarjetas en blanco puro con sombras envolventes y acentos dorados.
   - **Codificación Cromática por Partida:** Cada estación de trabajo (Saucier = Ámbar/Coñac, Garde Manger = Esmeralda, Pescados = Zafiro/Cian, Carnes = Rubí/Rojo) tiene su propio color, icono y badge identificativo.

5. **Doble Modalidad Operativa (Preparación ⇄ Servicio en Vivo):**
   - **Modo Preparación:** Tablero Kanban para mise en place, gestión de partidas, asignación de tareas y cálculo de escandallos con IA.
   - **Modo Servicio (En Pleno Pase):** Oculta el Kanban y transforma la pantalla en un centro de mando con **Multi-Temporizadores persistentes** para hornos, fuegos y pases, junto a un **Panel de Fuera de Carta (86)** para avisar a sala en tiempo real.

---

## 🛠️ 2. Stack Tecnológico Estándar

| Capa | Tecnología | Propósito |
|---|---|---|
| **Bundler & Runtime** | Vite + React 19 + TypeScript | Compilación ultrarrápida y tipado estricto |
| **Estilos & UI** | Tailwind CSS v4 + PostCSS (`@tailwindcss/postcss`) | Sistema de diseño de alto rendimiento |
| **Primitivas UI Accesibles** | Radix UI (`@radix-ui/react-tabs`, `@radix-ui/react-dialog`) | Modales, Tabs y Drawers accesibles |
| **Animaciones & Gestos** | Framer Motion | Gestos de swipe móvil y micro-interacciones |
| **Drag and Drop** | `@hello-pangea/dnd` | Arrastre y suelta en tablets/desktop |
| **Iconografía** | Lucide React (`lucide-react`) | Iconos vectoriales limpios y coherentes |
| **Gestión de Estado** | Zustand | Estado global reactivo y ligero |
| **Persistencia Offline** | `idb-keyval` | Almacenamiento asíncrono en IndexedDB |

---

## ⚡ 3. Paso a Paso: Creación desde Cero (Scaffolding)

### Paso 3.1: Inicializar el Proyecto Vite
```bash
npm create vite@latest mi-app-cocina -- --template react-ts
cd mi-app-cocina
```

### Paso 3.2: Instalar Dependencias Exactas
```bash
# Dependencias de producción
npm install zustand idb-keyval @radix-ui/react-tabs @radix-ui/react-dialog @hello-pangea/dnd framer-motion lucide-react

# Dependencias de desarrollo (Tailwind CSS v4)
npm install -D tailwindcss @tailwindcss/postcss postcss
```

### Paso 3.3: Configurar PostCSS (`postcss.config.js`)
**CRÍTICO:** En Tailwind v4 se debe usar `@tailwindcss/postcss`, NUNCA `tailwindcss`:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### Paso 3.4: Configurar Tailwind v4 (`src/index.css`)
**REGLA DE ORO:** Tailwind v4 NO usa `@tailwind base; @tailwind components; @tailwind utilities;`.
Debe utilizar `@import "tailwindcss";`:
```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@layer base {
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
}
```

### Paso 3.5: Validación de Entorno (Bundle Size Check)
Ejecutar `npm run build`.
- Si el archivo CSS en `dist/assets/` pesa **> 50KB**, la configuración es **CORRECTA**.
- Si el CSS pesa **< 20KB**, Tailwind v4 ha descartado silenciosamente las utilidades. ¡No continuar sin corregirlo!

---

## 🧠 4. Arquitectura del Estado Global (`Zustand + IndexedDB`)

La estructura de datos debe residir en `src/store/useBrigadeStore.ts`:

```typescript
export interface TurnoData {
  nombreServicio: string; // 'Almuerzo' | 'Cena' | 'Eventos'
  comensales: number;     // PAX
  horaPase?: string;      // '14:30' | '21:00'
}

export interface Tarea {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  prioridad: 'Critica' | 'Media' | 'Baja';
  estado: 'Pendiente' | 'En Proceso' | 'Completado';
  partida: string;
}

export interface Temporizador {
  id: string;
  nombre: string;
  partida: string;
  duracionSegundos: number;
  finTimestamp: number; // Date.now() + segundos * 1000 (ABSOLUTO)
  estado: 'activo' | 'pausado' | 'terminado';
  segundosRestantesPausado?: number;
}

export interface Item86 {
  id: string;
  nombre: string;
  partida: string;
  hora: string;
  motivo?: string;
}
```

### Regla de Oro para Temporizadores Persistentes:
> **NUNCA** guardes un temporizador como un contador decreciente en el estado de React (`secondsLeft - 1`). Si la tablet se bloquea o el usuario refresca la página, el contador se congelará o se reiniciará.
> **SIEMPRE** calcula y almacena la `finTimestamp` (timestamp absoluto en ms). Al renderizar, calcula el tiempo restante como:
> `const restante = Math.max(0, Math.floor((timer.finTimestamp - Date.now()) / 1000));`

---

## 🎨 5. Sistema de Partidas y Codificación Cromática (`src/types/stations.ts`)

```typescript
export interface StationStyleConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string; // hex
  card: {
    tag: string;
    dragging: string;
    hoverBorder: string;
  };
  tab: {
    active: string;
    badge: string;
  };
}
```
- **Saucier:** Tono Ámbar / Coñac (`#f59e0b`). Salsas, fondos, reducciones.
- **Garde Manger:** Tono Esmeralda botánico (`#10b981`). Cocina fría, ensaladas, postres, pan.
- **Pescados:** Tono Zafiro / Océano (`#0284c7`). Limpieza, plancha de pescados, mariscos.
- **Carnes:** Tono Rubí / Carmesí (`#ef4444`). Cortes, asados, hornos, fondos oscuros.

---

## 📱 6. Componentes Clave y Responsabilidades

1. **`App.tsx`:** Layout sticky, cabecera con KPIs globales, cuenta atrás al pase, selector de tema dual y alternador de Modo Prep / Modo Servicio.
2. **`KanbanBoard.tsx`:** Contenedor adaptativo:
   - Pantallas grandes: 3 columnas con drag-and-drop.
   - Móviles: lista vertical con tabs y swipe gestures.
   - Columna 'Pendiente': contiene `InlineQuickAdd.tsx` en la parte superior.
3. **`TaskCard.tsx`:** Tarjeta interactiva:
   - Doble clic: abre el formulario inline de edición rápida (cambio de nombre, cantidad o eliminación).
   - Botón de One-Click Shopping (agrega ingredientes faltantes con `e.stopPropagation()`).
4. **`CreateTaskModal.tsx`:** Floating Action Button (FAB) fijado en `bottom-6 right-6` para crear elaboraciones en cualquier momento.
5. **`ServiceCountdown.tsx`:** Widget que calcula los minutos restantes hasta la hora del pase configurada; cambia a amarillo a falta de 45m y a rojo pulsante a falta de 30m si hay tareas críticas.
6. **`ShiftSettingsModal.tsx`:** Diálogo accesible para configurar rápidamente Servicio, Comensales (PAX) y Hora del Pase.
7. **`SidebarDrawer.tsx`:** Menú lateral deslizable para:
   - Añadir y eliminar partidas dinámicamente.
   - Exportar backup completo en JSON.
   - Resetear el turno de forma limpia.
8. **`ServiceDashboard.tsx`:** Dashboard del Modo Servicio:
   - Panel de Multi-Temporizadores con presets rápidos (1 tap).
   - Botones `+1m` y `+5m` para ajuste en caliente de cocciones.
   - Alarma visual y auditiva al terminar.
   - Panel de Agotados (86 / Fuera de carta) con botón de exportar/copiar aviso directo para sala (camareros).

---

## 🚫 7. Errores Críticos a Evitar (Antipatrones)

1. ❌ **Usar sintaxis Tailwind v3 (`@tailwind base;`):** Provoca que el CSS compilado se reduzca a ~12KB y la app parezca un diseño de los años 90 en blanco y negro.
2. ❌ **Temporizadores con `setInterval` local no persistido:** Se destruyen al salir de la pantalla o bloquear la tablet.
3. ❌ **No detener la propagación de eventos (`e.stopPropagation()`):** Hace que tocar un botón secundario dentro de una tarjeta active el arrastre o el swipe de forma accidental.
4. ❌ **Controles táctiles pequeños (< 44px):** Inoperables en entornos reales de cocina con dedos mojados o guantes.
5. ❌ **Sobrescribir el estado IndexedDB con arrays vacíos al arrancar:** Asegúrate de fusionar los datos almacenados con los estados por defecto (`cargarDatos`).

---

## 📋 8. Checklist de Validación Final antes de Desplegar
- [ ] `npm run build` compila con 0 errores TypeScript (`tsc -b`).
- [ ] El archivo `dist/assets/*.css` pesa más de 50KB.
- [ ] El switch de tema conmuta instantáneamente entre Dark Luxury y Warm Ivory.
- [ ] Al recargar la página (`F5`), las tareas, partidas, temporizadores y platos 86 permanecen intactos.
- [ ] El modo móvil responde a gestos de swipe a izquierda y derecha.
- [ ] El toggle de Modo Servicio transforma la vista en el dashboard de timers y 86.
