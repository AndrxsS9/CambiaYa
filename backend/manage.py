"""
Script de administración de Django.
"""
import os
import sys


def main():
    """Punto de entrada para comandos administrativos."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "No se pudo importar Django. Asegúrate de que el entorno virtual "
            "está activado y Django está instalado."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
