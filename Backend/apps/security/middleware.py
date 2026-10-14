"""
Middleware de seguridad HTTP — CambiaYa.
Ítem 13, Tarea 2: Protección de datos sensibles.
Ítem 13, Tarea 3: Configuración de acceso seguro.

Agrega cabeceras HTTP de seguridad a todas las respuestas
para proteger contra ataques comunes (XSS, clickjacking, MIME sniffing).
"""
import logging

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware:
    """
    Middleware que agrega cabeceras de seguridad HTTP a cada respuesta.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        logger.info("SecurityHeadersMiddleware inicializado.")

    def __call__(self, request):
        """Procesa la petición y agrega headers de seguridad a la respuesta."""
        response = self.get_response(request)

        # Protección contra MIME sniffing
        response["X-Content-Type-Options"] = "nosniff"

        # Protección contra clickjacking
        response["X-Frame-Options"] = "DENY"

        # Filtro XSS del navegador
        response["X-XSS-Protection"] = "1; mode=block"

        # Control de información del referer
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Restringir APIs del navegador no necesarias
        response["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )

        # No cachear endpoints de API con datos sensibles
        if "/api/" in request.path:
            response["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response["Pragma"] = "no-cache"

        return response
