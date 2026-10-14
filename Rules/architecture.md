# Diseño del Sistema (Arquitectura)

## Capas y Responsabilidades
1. **Cliente (React):** Renderiza UI y maneja estado de autenticación. NUNCA accede a la DB directamente.
2. **Comunicación:** Axios con Bearer Token a `/api/v1/`.
3. **Backend (Django):** Valida reglas de negocio y responde en JSON.
4. **Almacenamiento:** Cloudinary para archivos binarios (imágenes).

## Límites de Módulos
- Las apps de Django (`users`, `products`) deben ser independientes.
- El backend procesa la subida a Cloudinary; el frontend solo recibe y muestra la URL.
- El filtrado de datos sensibles se hace en la capa de Serializers.