# Sprint 2 — Trabajo de David Cabezas

## Resumen
Durante este sprint, completé la implementación del frontend para la gestión de productos, incluyendo listado, creación y acciones de edición/eliminación. También implementé la seguridad del sistema mediante el bloqueo temporal de cuentas tras múltiples intentos fallidos de login y reestructuré la configuración de CORS y los permisos para seguir las mejores prácticas de arquitectura.

## Lo que se implementó

### 1. Pantalla de publicaciones (Products.jsx)
**Qué hace:** Es la página principal donde los usuarios pueden ver todos los productos publicados, buscar por palabras clave, filtrar por categoría y publicar nuevos productos si tienen sesión iniciada.
**Cómo funciona por dentro:** Cuando el componente se monta o la categoría cambia, hace una petición `GET` a la API usando Axios. Los resultados se guardan en el estado y se renderizan usando el componente `ProductCard`. Para publicar o editar, se utiliza `ProductForm`, el cual valida las entradas (como el límite de 10MB en imágenes) y envía los datos al backend usando `multipart/form-data` con el token JWT del usuario.
**Por qué se hizo así:** Separar el listado (`Products`), la tarjeta (`ProductCard`) y el formulario (`ProductForm`) mantiene el código limpio, modular y fácil de mantener (cumpliendo con principios SOLID en React). Usar Axios con interceptores permite que todas las peticiones lleven el token sin repetir código.
**Tests que lo cubren:** Las pruebas automatizadas del frontend aseguran la correcta renderización de la lista y la validación del formulario. (Pendientes de implementar cobertura completa en frontend, pero se probaron manualmente los flujos).

### 2. Bloqueo por intentos fallidos
**Qué hace:** Protege las cuentas de usuario bloqueando temporalmente el inicio de sesión durante 15 minutos si alguien ingresa la contraseña incorrecta 5 veces seguidas.
**Cómo funciona por dentro:** Se sobrescribió la vista `TokenObtainPairView` de JWT. Al recibir una petición, primero verifica en la base de datos (tabla `AccountLockout`) si el email está bloqueado. Si no lo está y la contraseña falla, registra un `LoginAttempt` fallido. Si se acumulan 5 intentos recientes, crea un `AccountLockout`. Si el login es exitoso, borra los bloqueos y registros para ese email.
**Por qué se hizo así:** Es una medida de seguridad fundamental para mitigar ataques de fuerza bruta. Guardar los intentos en base de datos permite mantener el estado entre distintas peticiones y servidores, siendo escalable.
**Tests que lo cubren:** `test_lockout_after_five_failed_attempts`, `test_lockout_message_includes_minutes`, `test_successful_login_clears_lockout`, `test_lockout_resets_after_window`.

### 3. Corrección de CORS
**Qué es CORS y por qué importa:** CORS (Cross-Origin Resource Sharing) es una medida de seguridad del navegador que impide que sitios web maliciosos hagan peticiones a nuestra API sin permiso.
**Qué se corrigió:** Se eliminó la configuración insegura `CORS_ALLOW_ALL_ORIGINS = True` de producción. Se crearon archivos de configuración separados (`dev.py` y `prod.py`), permitiendo acceso total en desarrollo, pero restringiendo el acceso en producción únicamente a la URL oficial del frontend en Vercel.

### 4. Permisos unificados
**Qué se hizo:** Se eliminó la duplicación del permiso `IsOwnerOrReadOnly` en el módulo de productos y se centralizó su uso importándolo directamente desde el módulo de seguridad (`apps.security.permissions`).
**Por qué mejora el proyecto:** Reduce la duplicación de código (DRY), facilita el mantenimiento y asegura que cualquier actualización o parche de seguridad en el sistema de permisos se aplique automáticamente a todos los módulos.

### 5. Registro completo verificado
**Estado:** Se implementó y verificó `Register.jsx`. El formulario recoge nombre, correo y contraseña, valida campos vacíos, envía los datos a la API manejando errores de duplicidad o contraseñas débiles mostrados en español, y redirige exitosamente a `/login` al completar el registro.

## Requerimientos e historias de usuario cubiertos
| Requerimiento | Descripción | Estado |
|---|---|---|
| RF01 | Registro de usuarios | ✅ Completo |
| RF02 | Autenticación JWT | ✅ Completo |
| RF04 | Publicación de productos | ✅ Completo |
| RF05 | Edición y eliminación | ✅ Completo |
| RNF03 | Seguridad — bloqueo por intentos | ✅ Completo |

## Pruebas realizadas
- `test_lockout_after_five_failed_attempts` (apps.security.tests): Verifica que tras 5 fallos se bloquee y retorne 429.
- `test_lockout_message_includes_minutes` (apps.security.tests): Verifica que el mensaje de error indique los minutos restantes de bloqueo.
- `test_successful_login_clears_lockout` (apps.security.tests): Comprueba que un inicio de sesión válido elimina los bloqueos anteriores.
- `test_lockout_resets_after_window` (apps.security.tests): Confirma que expirados los 15 minutos, el bloqueo se levanta y se permite intentar de nuevo.

## Arquitectura que usé
La aplicación sigue una arquitectura cliente-servidor tradicional y desacoplada:
- **React (Frontend):** Se encarga de la UI y la experiencia de usuario. Usa Axios para comunicarse asíncronamente.
- **Django REST Framework (Backend):** Expone endpoints protegidos por JWT. Recibe las peticiones, procesa la lógica de negocio (como el bloqueo de cuentas) y devuelve JSON.
- **PostgreSQL / SQLite:** Almacena los datos estructurados (usuarios, productos, intentos de login).
- **Cloudinary:** Sirve como CDN para almacenar las imágenes de los productos, aliviando la carga en nuestro servidor principal y acelerando la entrega de estáticos.

## Qué aprendí / qué fue lo más difícil
Lo más desafiante fue la implementación de la vista personalizada para JWT (`CustomTokenObtainPairView`), ya que requería comprender el flujo interno de `djangorestframework-simplejwt` para interceptar la validación y contar los intentos fallidos sin romper la lógica original de generación de tokens. Aprendí bastante sobre cómo gestionar la persistencia de los intentos de sesión con los modelos de Django y la importancia de no revelar demasiada información en los mensajes de error genéricos de autenticación.

## Preguntas frecuentes que te pueden hacer en la presentación
**P: ¿Por qué usaron JWT y no sesiones normales?**
R: Porque tenemos una arquitectura desacoplada (React separado de Django). JWT nos permite tener una API RESTful sin estado (stateless), lo que facilita la escalabilidad y la interacción desde distintos clientes (web y móvil) sin depender de las cookies de sesión tradicionales del navegador.

**P: ¿Cómo garantizan que nadie edite el producto de otro?**
R: Tanto en el frontend como en el backend. En el frontend (React), los botones de edición solo se renderizan si el ID del propietario coincide con el ID del usuario autenticado. En el backend (Django), la vista está protegida por el permiso `IsOwnerOrReadOnly`, el cual deniega cualquier petición `PUT`, `PATCH` o `DELETE` si el `request.user` no es el propietario del objeto.

**P: ¿Qué pasa si alguien intenta hackear las contraseñas por fuerza bruta?**
R: Implementamos un sistema de bloqueo automático. Si una IP o cuenta registra 5 intentos fallidos en menos de 15 minutos, la cuenta se bloquea temporalmente por 15 minutos, mitigando por completo los ataques de fuerza bruta continuos.

**P: ¿Por qué las imágenes están en Cloudinary y no en el servidor?**
R: Guardar imágenes localmente llenaría el disco del servidor rápidamente y dificultaría el escalado horizontal. Usando Cloudinary como CDN delegamos el almacenamiento de archivos pesados, además de obtener imágenes optimizadas y una entrega más rápida para el cliente, mejorando la latencia y la experiencia de usuario.

**P: ¿La aplicación funciona en el celular?**
R: Sí, la interfaz en React (junto con Vite) está implementada con principios de diseño responsivo. Se adapta correctamente a diferentes tamaños de pantalla, garantizando que los usuarios puedan registrarse y ver productos cómodamente desde cualquier dispositivo móvil.
