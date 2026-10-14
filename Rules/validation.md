# Criterios de Validación (DoD - Definition of Done)

## Backend
- [ ] Cobertura de tests unitarios > 80% en lógica de auth.
- [ ] Los passwords están hasheados con bcrypt.
- [ ] Las imágenes se visualizan correctamente desde Cloudinary.

## Frontend
- [ ] Los formularios muestran errores de validación en español.
- [ ] El Axios interceptor refresca el JWT automáticamente.
- [ ] Las rutas privadas redirigen a `/login` si el token expira.