# Reglas de Negocio (Tablas de la Verdad)

## Autenticación
- **Email duplicado:** Retornar 400 - "Este correo ya está registrado".
- **Password débil:** Mínimo 8 caracteres (Validar en Serializer).
- **Login fallido:** Error 401 genérico (No decir si falló el email o la clave).

## Módulo de Productos
- **Propiedad:** Un usuario solo puede EDITAR o ELIMINAR productos que él creó (`IsOwnerOrReadOnly`).
- **Imágenes:** Máximo 10MB por archivo. Validar antes de enviar a Cloudinary.
- **Intercambio:** El flujo base es el trueque; el campo precio es opcional o inexistente por defecto.