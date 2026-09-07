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
