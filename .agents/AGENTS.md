# Reglas de Trabajo con Git y Mantenimiento de Versiones

## 1. Verificación Obligatoria de la Versión del Código
Antes de realizar cualquier modificación de código o de asumir que un fragmento de código pegado por el usuario es la versión activa:
- Ejecuta siempre `git status`, `git log -n 5 --oneline` y `git branch -a` para comprender el estado y la historia del repositorio de trabajo.
- Si se detecta que el repositorio local o remoto contiene commits más recientes y avanzados que un archivo pegado en el chat (por ejemplo, el chat se inició con código V10 pero el repositorio tiene commits V14.2), **nunca** sobrescribas el código con la versión del chat. Los cambios nuevos deben aplicarse quirúrgicamente sobre la versión del repositorio.

## 2. Resolución Segura de Conflictos
- Está prohibido el uso automático de `git checkout --ours` o `git checkout --theirs` para resolver conflictos de fusión si no se ha analizado primero el contenido de ambas ramas.
- Si hay dudas sobre qué versión mantener, detén la ejecución y consulta explícitamente al usuario.
