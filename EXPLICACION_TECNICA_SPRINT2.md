# Guía de Estudio y Explicación Técnica — Sprint 2 (CambiaYa)

Este documento detalla las decisiones arquitectónicas, la aplicación de la Programación Orientada a Objetos (POO) y las buenas prácticas utilizadas para resolver los requerimientos del Sprint 2. Está diseñado para ayudarte a defender el proyecto en una presentación técnica.

---

## 1. Reestructuración de CORS y Arquitectura de Settings

**El problema original:** 
En el archivo `settings.py` tenías `CORS_ALLOW_ALL_ORIGINS = True`. Esto es un hueco de seguridad gravísimo en producción, porque significa que *cualquier* página web del mundo puede hacer peticiones a tu servidor.

**Cómo lo resolvimos:**
Separamos la configuración en varios archivos (`base.py`, `dev.py`, `prod.py`). Esto es una práctica estándar en la industria.
*   **En `dev.py` (desarrollo):** Dejamos el `CORS_ALLOW_ALL_ORIGINS = True` para que puedas trabajar tranquilo desde `localhost`.
*   **En `prod.py` (producción):** Lo apagamos y usamos `CORS_ALLOWED_ORIGINS = ['https://cambiaya.vercel.app']`.

> 💡 **Ejemplo de la vida real (CORS):**
> Imagina que tu Backend es un club exclusivo. CORS es el cadenero de la puerta. Si está en `True` (desarrollo), el cadenero deja entrar a todo el mundo. En producción, le damos una "lista de invitados" (tu URL de Vercel). Si otra página (`hacker.com`) intenta acceder a tus datos, el cadenero (CORS) la rechaza.

---

## 2. Unificación de Permisos (Principio DRY de POO)

**El requerimiento:** Unificar el permiso `IsOwnerOrReadOnly` para no repetir código.

**Cómo lo resolvimos:**
Aplicamos el principio **DRY (Don't Repeat Yourself)**. Creamos una única clase en `apps/security/permissions.py` usando **Herencia** (un pilar de la Programación Orientada a Objetos):

```python
# Heredamos de BasePermission (POO)
class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Si es GET (solo lectura), pasa directo.
        if request.method in permissions.SAFE_METHODS:
            return True
        # Si es PUT/DELETE, verificamos que quien hace la petición sea el dueño.
        return obj.owner == request.user
```
Luego, en el módulo de productos, simplemente *importamos* esta clase. Si mañana descubres un error en el permiso, lo corriges en un solo lugar y se arregla en toda la aplicación.

---

## 3. El Sistema de Bloqueo (Account Lockout)

**El requerimiento:** Bloquear a un usuario por 15 minutos si falla la contraseña 5 veces seguidas.

**Cómo lo resolvimos aplicando POO (Polimorfismo / Sobrescritura):**
La librería JWT ya trae una clase que hace el login (`TokenObtainPairView`), pero no tiene sistema de bloqueo. Lo que hicimos fue crear nuestra propia clase `CustomTokenObtainPairView` que **hereda** de la original, pero *sobrescribe* el método `post()` para añadir nuestra lógica antes y después:

1. **Antes de validar:** Verificamos si el correo está en la tabla `AccountLockout` y si el tiempo aún no expira. Si es así, cortamos la ejecución y retornamos un error 429 (Too Many Requests).
2. **Durante la validación:** Llamamos a `super().post(request)` (usando la lógica de la clase padre original).
3. **Manejo de Errores:** Si `super()` falla (lanza la excepción `AuthenticationFailed`), atrapamos el error, creamos un registro `LoginAttempt` (intento fallido). Si llega a 5 fallos, creamos un `AccountLockout`.

> 💡 **Buenas prácticas en manejo de errores (Try / Catch):**
> En vez de usar un `except Exception as e` que atraparía *cualquier* error (incluso si se cae la base de datos entera), fuimos específicos: `except AuthenticationFailed`. Esto garantiza que no silenciamos errores críticos del sistema y solo reaccionamos a las contraseñas incorrectas.

---

## 4. El CRUD de Productos

**El requerimiento:** Implementar el listado, creación, edición y eliminación de productos.

**Cómo lo resolvimos:**
En Django REST Framework, aplicamos el patrón de diseño arquitectónico **MVT (Modelo-Vista-Template/Serializer)**:

1. **Modelos (`models.py`):** Creamos `Product` y `ProductImage`. Usamos claves foráneas (`ForeignKey`) para vincular el producto con el usuario que lo creó (`owner`).
2. **Serializador (`serializers.py`):** Es la capa de traducción y validación. Convierte objetos de Python a JSON para React. Las reglas de tu proyecto exigían que la validación ocurra aquí y *nunca* en la vista (ej. "el título no puede estar vacío"). 
3. **Vista (`views.py`):** Usamos un `ModelViewSet`. Esta es una clase especializada de Django que genera automáticamente las operaciones CRUD. Le inyectamos nuestro permiso `IsOwnerOrReadOnly` para proteger la edición.

---

## 5. Frontend: Instancia Axios e Interceptores

**El requerimiento:** Conectar React con el Backend de forma limpia.

**Cómo lo resolvimos:**
Una mala práctica es importar `axios` en cada archivo y pegarle el Token JWT a mano en cada petición. En su lugar, creamos una instancia centralizada en `src/api/axios.js` aplicando el patrón **Singleton**, y le agregamos un **Interceptor**.

> 💡 **Ejemplo de la vida real (Interceptor):**
> Un interceptor es como una oficina de correos. En lugar de que tú le pegues la estampilla (el Token JWT) a cada carta (petición) que envías, simplemente le entregas la carta a la oficina. El interceptor atrapa tu petición justo antes de salir al internet, busca el token en el almacenamiento local (`localStorage`), se lo inyecta a la cabecera de la petición, y la despacha.

Esto permite que en el código de tus componentes solo escribas `api.get('/products/')` y te olvides de la lógica de tokens.

---

## 6. Frontend: AuthContext y Estado Global

**El requerimiento:** Usar el contexto para decidir si mostrar o no el botón de "Publicar".

**Cómo lo resolvimos:**
Usamos el **Context API de React**. Normalmente, para pasar datos entre componentes se usan las *props* (pasando datos de padre a hijo, a nieto). Hacer esto excesivamente se llama *Prop Drilling* y es una mala práctica.

El `AuthContext` crea un "estado global" en tu aplicación. Envuelve a toda la app (`App.jsx`). Cualquier componente, sin importar en qué nivel de profundidad esté, puede invocar `useContext(AuthContext)` y preguntar: *"¿Quién es el usuario actual?"*.
* Si `currentUser` existe, el listado de productos muestra el botón de publicar.
* Si es `null`, asume que es un visitante y lo oculta.

---

## 7. Prevención de Fugas de Memoria (Memory Leaks)

**El requerimiento subyacente:** Escribir código frontend optimizado y sin errores en el manejo de imágenes.

**Cómo lo resolvimos:**
En el formulario de productos (`ProductForm.jsx`), cuando un usuario selecciona una foto para subirla, creamos una URL temporal en el navegador para mostrarle la vista previa usando `URL.createObjectURL()`.

Si el usuario sube una imagen, luego se arrepiente y sube otra distinta, la URL temporal de la primera imagen **sigue existiendo en la memoria RAM**. Si hiciera esto muchas veces, el navegador colapsaría. 
Implementamos un "Hook de limpieza" (`useEffect`) que detecta cuándo el componente se cierra o cambia de imagen, y ejecuta `URL.revokeObjectURL()`, avisándole al navegador que ya puede liberar ese espacio de memoria.

---

## Resumen de Preguntas Rápidas (Q&A)

*   **P: ¿Dónde ocurre la validación de los datos que envía el usuario?**
    *R: En el Backend, la validación estricta ocurre en la capa de los Serializers de DRF. En el Frontend, hacemos validaciones preventivas antes de enviar la petición (por ejemplo, validando el tamaño en MB de la imagen) para ahorrar ancho de banda.*

*   **P: ¿Por qué crearon una vista personalizada para JWT en vez de usar la que viene por defecto?**
    *R: Por el principio Abierto/Cerrado (Letra O en SOLID). En lugar de modificar el código original de la librería externa, heredamos de su vista base y sobrescribimos el método `post()` (polimorfismo) para inyectar nuestra regla de negocio personalizada: los bloqueos por 15 minutos.*

*   **P: ¿Cómo evitan tener código de peticiones HTTP repetido en todo React?**
    *R: Centralizando la configuración de Axios en una única instancia exportable y utilizando interceptores para automatizar la inyección de los tokens de autenticación.*
