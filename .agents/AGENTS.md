# Reglas de Trabajo con Git y Mantenimiento de Versiones

## 1. Verificación Obligatoria de la Versión del Código
Antes de realizar cualquier modificación de código o de asumir que un fragmento de código pegado por el usuario es la versión activa:
- Ejecuta siempre `git status`, `git log -n 5 --oneline` y `git branch -a` para comprender el estado y la historia del repositorio de trabajo.
- Si se detecta que el repositorio local o remoto contiene commits más recientes y avanzados que un archivo pegado en el chat (por ejemplo, el chat se inició con código V10 pero el repositorio tiene commits V14.2), **nunca** sobrescribas el código con la versión del chat. Los cambios nuevos deben aplicarse quirúrgicamente sobre la versión del repositorio.

## 2. Resolución Segura de Conflictos
- Está prohibido el uso automático de `git checkout --ours` o `git checkout --theirs` para resolver conflictos de fusión si no se ha analizado primero el contenido de ambas ramas.
- Si hay dudas sobre qué versión mantener, detén la ejecución y consulta explícitamente al usuario.

## 3. Validación Obligatoria de Sintaxis
Antes de realizar un commit, push o subir cualquier archivo a Vercel/Netlify, es obligatorio verificar que no se introduzcan errores de sintaxis que rompan la aplicación:
- Ejecuta el script de validación local `node C:\Users\zigac\.gemini\antigravity\brain\2dddf984-cda6-4b93-9379-758cac9a152f\scratch\test_syntax.js` para asegurar que el bloque JavaScript dentro de `index.html` compila con cero errores.
- Si no se dispone del script, realiza un parseo estricto del código modificado. Nunca subas código con llaves desparejadas o variables sueltas.

## 4. Gestión Activa de Actualizaciones del Service Worker (PWA Caching)
Para evitar que el navegador del usuario sirva versiones obsoletas desde la caché persistente:
- Asegura que `index.html` siempre mantenga el escuchador del evento `controllerchange` en `navigator.serviceWorker`:
  ```javascript
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
  ```
- Esto asegura que el cliente se actualice y recargue de forma automática en el primer acceso en cuanto el Service Worker active una nueva versión en segundo plano.

## 5. Regla Inmutable: Estudio de Mercado y Benchmarking Previo Obligatorio en Hostelería
Antes de diseñar, planificar o codificar cualquier nueva funcionalidad, módulo o aplicación en el ámbito de hostelería y restauración:
- **Benchmarking Competitivo Obligatorio:** Es mandatorio investigar y contrastar las herramientas líderes del mercado (KDS, ERPs, gestores de mise en place, TPVs, escandallos).
- **Matriz de Valor Previa:** Debe identificarse explícitamente:
  1. ¿Qué funciones ya existen en el mercado y cómo las resuelven?
  2. ¿Qué funciones faltan o están mal ejecutadas en los competidores?
  3. ¿Cuáles son los riesgos operativos y barreras de adopción en cocina real?
  4. ¿Cuál es nuestra Propuesta de Valor Única (UVP) y qué valor añadido diferencial aportamos?
- **Prohibición Estricta:** Está terminantemente prohibido programar o añadir complejidad técnica a ciegas sin este análisis comparativo previo para no malgastar tiempo en herramientas redundantes.

