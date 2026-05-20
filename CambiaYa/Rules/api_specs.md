# Especificación de API (Sprint 1)

## Auth - Registro
- **POST** `/api/v1/auth/register/`
- **Body:** `{ email, password, name }`
- **Success (201):** `{ id, email, name }`

## Usuarios - Perfil
- **GET/PUT** `/api/v1/users/me/`
- **Auth:** Bearer Token requerido.
- **Data:** `{ id, email, name, bio, location, profile_picture_url }`

## Productos - CRUD
- **GET** `/api/v1/products/` (Público).
- **POST** `/api/v1/products/` (Privado, Multipart/form-data).
- **Filtros:** Por categoría y por usuario dueño.