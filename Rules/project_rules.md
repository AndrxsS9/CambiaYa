# Reglas Globales del Proyecto - Marketplace de Intercambios

## Contexto del Proyecto
- **Nombre:** Marketplace de Intercambios Universitario (Sin dinero).
- **Stack:** Django REST Framework (Backend) + React + Vite (Frontend).
- **Base de Datos:** PostgreSQL (Producción) / SQLite (Dev).
- **Auth:** JWT (djangorestframework-simplejwt).
- **Storage:** Cloudinary para imágenes.

## Estándares de Código
- **Idiomas:** - Nombres de variables, funciones, clases y archivos: **Inglés**.
  - Comentarios, docstrings y mensajes de commit: **Español**.
  - Interfaz de usuario (labels, placeholders, mensajes): **Español**.
- **Seguridad:** - Nunca exponer passwords o tokens en las respuestas.
  - Usar siempre `IsAuthenticated` en rutas protegidas.
  - Validar datos siempre mediante Serializers.
- **Calidad:** - Prohibido usar `print()`, usar el módulo `logging`.
  - No dejar código muerto ni imports sin utilizar.