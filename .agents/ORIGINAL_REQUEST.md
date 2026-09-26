# Original User Request

## 2026-09-05T13:31:10Z

Optimizar y evolucionar la aplicación existente GastroCost PRO (PWA offline-first en un único archivo index.html y sw.js) a un estándar ejecutivo para Directores de F&B y Jefes de Cocina. CRÍTICO: No crear una aplicación nueva ni cambiar de tecnología. Todas las modificaciones deben realizarse quirúrgicamente sobre el código existente en index.html y sw.js, preservando todos los temas, recetas existentes, fotos base64, esquema de datos y el motor de IA.

Working directory: C:\Users\zigac\Documents\antigravity\radiant-shannon
Integrity mode: development

## Requirements

### R1. Sistema Jerárquico de Sub-recetas (Recetas Base / Preparaciones)
Permitir que cualquier receta guardada (ej. fondo de ternera, salsa brava, masa madre) pueda ser marcada como "Sub-receta / Elaboración Base" con un rendimiento medido (g, kg, ml, L o ud). Estas preparaciones deben integrarse automáticamente como insumos disponibles en el Catálogo Maestro y recalcular en cascada el coste de todos los platos finales que las utilicen cuando varíen sus ingredientes.

### R2. Importación Masiva de Tarifas de Proveedores (Excel / CSV)
Añadir al Catálogo Maestro una interfaz para subir archivos de tarifas de proveedores (.xlsx, .csv). El sistema debe mapear nombres de insumos existentes con los del archivo, previsualizar los cambios de precio antes de aplicar y actualizar en lote el catálogo y los escandallos asociados de forma instantánea.

### R3. Sistema de Copias de Seguridad y Sincronización en la Nube
Implementar un módulo de persistencia que mantenga la velocidad y resiliencia offline de localStorage, permitiendo exportar e importar instantáneas completas de la base de datos hacia/desde la nube (soporte de descarga/subida de snapshots JSON y enlace para sincronización con Google Drive / Web Storage compartido).

### R4. Modo Producción Interactivo para Tablets en Cocina
Diseñar una vista inmersiva "Modo Tablet / Servicio" pensada para la partida de cocina: tipografía de gran tamaño, contraste visual alto, checklist táctil de ingredientes y pasos de elaboración para los cocineros, y un escalador dinámico de raciones/comensales en tiempo real.

### R5. Generador Consolidado del "Libro Digital de Recetas"
Permitir seleccionar múltiples recetas o la totalidad del recetario para compilar y exportar un único documento consolidado (HTML/Word/PDF para imprimir o archivar) con portada, índice/tabla de contenidos y fichas técnicas estandarizadas para auditorías APPCC y manuales de personal.

### R6. Calidad de Código, Reglas Git y Service Worker
Todo el código debe implementarse quirúrgicamente dentro de index.html y sw.js. Se debe asegurar cero errores de sintaxis (node scratch/test_syntax.js), cumplimiento estricto de las reglas en .agents/AGENTS.md, preservación del escuchador controllerchange para el Service Worker y despliegue continuo verificado en Vercel.

## Acceptance Criteria

### Sub-recetas y Costes
- [ ] Se puede convertir una receta existente en "Elaboración Base" asignándole rendimiento en g, kg, ml, L o ud.
- [ ] La elaboración base aparece seleccionable en el selector de ingredientes de otras recetas.
- [ ] Modificar un ingrediente de la sub-receta actualiza automáticamente el Food Cost del plato principal.

### Importación de Tarifas
- [ ] La app lee archivos .xlsx y .csv usando la librería XLSX ya integrada en la app.
- [ ] Muestra un modal de confirmación con los precios anteriores y nuevos antes de aplicar los cambios.
- [ ] Notifica cuántos ingredientes fueron actualizados con éxito.

### Modo Tablet y Libro de Cocina
- [ ] La vista "Modo Producción" es responsive, accesible desde la barra de navegación y permite tachar pasos/ingredientes.
- [ ] El escalador multiplica cantidades de ingredientes sin alterar la receta base guardada.
- [ ] La función "Libro de Recetas" genera un documento único que incluye portada, índice y cada ficha técnica seleccionada.

### Verificación Técnica
- [ ] El script node scratch/test_syntax.js valida que index.html no tiene ningún error de parseo de JavaScript.
- [ ] Los cambios se integran en Git y el push a master se refleja en el despliegue de Vercel (gastrocost-pro-seven.vercel.app).

## 2026-09-13T12:32:36Z

Rediseño completo de la interfaz de MisePro para elevarla a un centro de mando operativo de hostelería de lujo de alto rendimiento, erradicando el aspecto plano monocromático mediante un sistema de Tema Dual (Dark Luxury y Warm Ivory), elevación tridimensional con sombras multicapa, glassmorphism y codificación cromática viva por partida de cocina.

Working directory: C:\Users\zigac\Documents\antigravity\radiant-shannon\brigade-sync
Integrity mode: development

## Requirements

### R1. Sistema de Tema Dual Ejecutivo (Dark Luxury & Warm Ivory)
- Implementar un switch de tema accesible en el Sticky Header que permita alternar instantáneamente entre dos modos y persista la elección en `localStorage`:
  - **Dark Luxury (Modo Predeterminado):** Fondos carbón y pizarra profunda (`#0b0f19` / `#0f172a`), superficies de tarjetas elevadas (`#1e293b`), bordes con sutil resplandor (`border-slate-700/60` o acentos ámbar `border-amber-500/20`), sombras profundas (`shadow-2xl shadow-black/40`) y efecto glassmorphism en navegación y cabecera (`backdrop-blur-md bg-slate-950/80`).
  - **Warm Ivory:** Fondo marfil cálido de alta cocina (`#fcfaf6`), tarjetas en blanco puro con sombras envolventes suaves (`shadow-lg shadow-amber-900/5`), bordes elegantes (`border-amber-900/10`) y acentos dorados.
- Incorporar tipografía de alta legibilidad y distinción (importar fuentes de Google Fonts como *Inter* y acentos elegantes para títulos/KPIs).

### R2. Identidad Cromática Dinámica por Partida de Cocina
Cada partida operativa debe reflejar su personalidad en los tabs, bordes activos, columnas e insignias:
- **Saucier:** Tono Ámbar / Coñac cálido (#f59e0b / #d97706) con resplandor dorado.
- **Garde Manger:** Tono Esmeralda botánico fresco (#10b981 / #059669) para cocina fría y vegetales.
- **Pescados:** Tono Azul Océano / Zafiro profundo (#0284c7 / #06b6d4).
- **Carnes:** Tono Carmesí / Rubí intenso (#ef4444 / #b91c1c).

### R3. Elevación Tridimensional, Sombras y Micro-Interacciones
- Erradicar las líneas negras duras y toscas (`border-2 border-slate-900`) y los fondos planos sin relieve.
- Rediseñar las `TaskCards`:
  - Bordes redondeados elegantes (`rounded-2xl`).
  - Sombras multicapa y sutiles gradientes de superficie.
  - Efecto de elevación interactiva al pasar el cursor o interactuar (`hover:-translate-y-1 hover:shadow-xl transition-all duration-300`).
  - Badges de prioridad estilizados con puntos de pulso luminoso (`animate-pulse`) en tareas críticas.
- Mejorar el Drawer de Compras y los Modales con fondos difuminados (`backdrop-blur-lg bg-black/60`), tarjetas de ingredientes agrupadas con acabados de cristal y animaciones de entrada suaves.

### R4. Fluidez Operativa Táctil (Móvil y Tablet)
- Mantener la adaptabilidad responsive: Drag-and-Drop fluido en tablet y lista segmentada con gestos de swipe en móvil.
- Refinar los fondos de arrastre (underlays de avanzar/retroceder) con gradientes y micro-iconografía animada.
- Respetar touch targets de al menos 48x48px en botones y controles para máxima ergonomía en cocina.

## Acceptance Criteria

### Criterios de Aceptación
- [ ] El toggle de Tema Dual en el Header conmuta de forma reactiva y sin parpadeos entre Dark Luxury y Warm Ivory, afectando a la totalidad de la aplicación.
- [ ] No existen contenedores con el borde plano negro tosco (`border-slate-900`) ni fondos monótonos sin profundidad; todos los componentes poseen sombras multicapa y estilos visuales refinados.
- [ ] Cada partida (Saucier, Garde Manger, Pescados, Carnes) aplica de manera dinámica su paleta cromática identificativa en tabs, badges, y resaltes del Kanban.
- [ ] Las tarjetas de tarea reaccionan con micro-animaciones al tacto/hover y cuentan con badges de prioridad visualmente enriquecidos.
- [ ] El proyecto compila en producción sin errores mediante `npm run build` en el directorio `brigade-sync`.

## 2026-09-25T22:49:01Z

Auditoría integral operativa, funcional y estratégica de MisePro (Brigade Sync), contrastando la usabilidad en tiempo real en cocina frente a la gestión fuera de servicio, complementado con un análisis competitivo exhaustivo de software gastronómico para redefinir su propuesta de valor y podar funcionalidades innecesarias.

Working directory: C:\Users\zigac\Documents\antigravity\radiant-shannon\brigade-sync
Integrity mode: development

## Requirements

### R1. Auditoría Operativa de Trinchera (Perspectiva In-Service vs Out-of-Service)
- Analizar minuciosamente la herramienta asumiendo dos roles operativos reales:
  1. **Cocinero / Jefe de Partida en el Pase (Servicio en Vivo):** Con prisa, calor, vapor y manos ocupadas. Identificar qué botones sobran, qué elementos generan fricción o confusión cognitiva, y cuáles son las únicas 3-4 interacciones que realmente importan mientras salen comandas.
  2. **Jefe de Cocina / Propietario Fuera de Servicio (Pre/Post Pase):** Planificación del turno, control de mermas y compras, cumplimiento legal (APPCC sanitario con exportación), estandarización de recetas y rendimiento del equipo.
- Entregar una **Matriz de Diagnóstico de Botones y Flujos** clasificada en: *Imprescindible*, *Ruido / Eliminar*, *Simplificar / Reubicar*.

### R2. Batería de Pruebas Extrema de Funcionalidades Existentes
- Inspeccionar exhaustivamente cada módulo de la aplicación en el código fuente y en ejecución:
  - Tablero Kanban / KDS de Mise en Place (estados, tarjetas, modo ticket, acciones vs elaboraciones).
  - Pase de Servicio (temporizadores múltiples, alarmas sonoras/hápticas, controles rápidos).
  - Módulo Sanitario APPCC (registros PCC, temperaturas, cámaras, generación de informes Word/Excel).
  - Módulo de Logística (lista de compras, fuera de carta 86, notificación WhatsApp).
  - Asistente de Voz (detección semántica, transcripción limpia, inserción en 1 toque).
  - Modo Jefe / PIN, notas Post-It, onboarding wizard y configuración de partidas.
- Documentar cualquier botón fantasma, acción redundante o inconsistencia en la persistencia local (IndexedDB / Zustand).

### R3. Estudio de Mercado y Benchmarking Competitivo
- Analizar el panorama de software para hostelería enfocado en el segmento objetivo: **Restaurantes gastronómicos, bistrós de autor y locales medianos (brigadas de 3 a 12 cocineros con partidas definidas)**.
- Comparar MisePro frente a referentes del sector:
  - KDS de Pase: Toast KDS, Square KDS, Lightspeed, Fresh KDS.
  - Gestión de Mise en Place, Recetas y Cocina: Meez, Apicbase, MarketMan, Kitchen CUT, 7shifts.
- Identificar:
  - ¿Qué hacen bien estos competidores y dónde fallan (precios prohibitivos, curvas de aprendizaje complejas, exceso de burocracia digital)?
  - ¿Cuál es la **Propuesta de Valor Única (UVP)** de MisePro frente a ellos?
  - ¿Por qué un jefe de cocina elegiría MisePro frente a un KDS tradicional de TPV o una libreta de papel?

### R4. Plan Maestro de Redefinición y Poda (Roadmap de Excelencia)
- Diseñar el plan estratégico de evolución de la herramienta:
  - **Plan de Poda Inmediata:** Qué eliminar para que la app sea rápida, limpia e intuitiva.
  - **Palancas de Alto Valor:** Qué 2-3 capacidades convertirían a MisePro en una herramienta indispensable por la que cualquier restaurante pagaría una suscripción mensual.

## Acceptance Criteria

### Diagnóstico Operativo & Batería de Pruebas
- [ ] Informe con tabla detallada de auditoría botón por botón y pantalla por pantalla, evaluada con justificación práctica de cocina.
- [ ] Listado claro de elementos y flujos redundantes marcados para eliminación inmediata.
- [ ] Diagnóstico de consistencia técnica del estado de la aplicación.

### Estudio de Mercado y Posicionamiento Estratégico
- [ ] Matriz comparativa de competidores con fortalezas, debilidades, modelo de precios y barrera de adopción.
- [ ] Definición precisa de la Propuesta de Valor Única (UVP) y perfil del cliente ideal (ICP).
- [ ] Documento de síntesis ejecutiva con la hoja de ruta clara para transformar la app en un producto de referencia en el sector.


