import logging
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.products.models import Product

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Semilla datos iniciales para el Marketplace CambiaYa (Usuarios y Productos)"

    def handle(self, *args, **options):
        User = get_user_model()

        self.stdout.write("Iniciando la inyección de datos de prueba...")

        # 1. Crear o actualizar usuarios de prueba
        users_data = [
            {
                "email": "test@example.com",
                "name": "Usuario de Prueba",
                "bio": "Estudiante de ingeniería buscando intercambiar gadgets y libros de texto.",
                "location": "Facultad de Ingeniería",
            },
            {
                "email": "juan@example.com",
                "name": "Juan Zambrano",
                "bio": "Aficionado al ciclismo y a la tecnología. Intercambio lo que ya no uso.",
                "location": "Pasto, Nariño",
            },
            {
                "email": "andres@example.com",
                "name": "Andrés Silva",
                "bio": "Estudiante de diseño gráfico. Interesado en ropa retro y libros de arte.",
                "location": "Campus Central",
            },
            {
                "email": "maria@example.com",
                "name": "María López",
                "bio": "Apasionada por la lectura y los deportes al aire libre.",
                "location": "Facultad de Medicina",
            }
        ]

        created_users = {}
        for u_data in users_data:
            user, created = User.objects.get_or_create(email=u_data["email"])
            user.name = u_data["name"]
            user.bio = u_data["bio"]
            user.location = u_data["location"]
            # Colocar una contraseña por defecto
            user.set_password("password123")
            user.save()
            created_users[u_data["email"]] = user
            if created:
                self.stdout.write(f"Usuario creado: {u_data['email']}")
            else:
                self.stdout.write(f"Usuario actualizado: {u_data['email']}")

        # 2. Limpiar productos antiguos para poder re-ejecutar sin duplicar infinitamente
        Product.objects.all().delete()
        self.stdout.write("Productos anteriores eliminados de la base de datos.")

        # 3. Crear productos de prueba
        products_data = [
            {
                "title": "Nintendo Switch Lite",
                "description": "Consola Nintendo Switch Lite color turquesa. En excelente estado, incluye protector de pantalla de vidrio templado y cargador original. Busco intercambiar por una tablet o bicicleta rin 26+.",
                "category": "Electrónica",
                "estimated_value": 150000.00,
                "owner": created_users["juan@example.com"],
            },
            {
                "title": "Chaqueta de Cuero Vintage",
                "description": "Chaqueta de cuero marrón estilo bomber vintage, talla L. Muy poco uso, el cuero está perfectamente cuidado e hidratado. Me interesa intercambiar por libros de programación o novelas históricas.",
                "category": "Ropa",
                "estimated_value": 80000.00,
                "owner": created_users["juan@example.com"],
            },
            {
                "title": "Bicicleta de Montaña Trek Rin 29",
                "description": "Bicicleta rin 29 con marco de aluminio liviano, frenos de disco hidráulicos y suspensión delantera. Tiene algunos rasguños leves por uso normal. Busco una laptop básica para estudios o celular gama media.",
                "category": "Deportes",
                "estimated_value": 350000.00,
                "owner": created_users["andres@example.com"],
            },
            {
                "title": "Libro 'Clean Code' - Robert C. Martin",
                "description": "Edición física de 'Código Limpio' en español. Un libro fundamental para cualquier desarrollador que quiera mejorar la calidad de su software. Busco otros libros de tecnología o juegos de mesa estratégicos.",
                "category": "Libros",
                "estimated_value": 35000.00,
                "owner": created_users["andres@example.com"],
            },
            {
                "title": "Cafetera Espresso Oster",
                "description": "Cafetera espresso con bomba de 15 bares de presión y boquilla de vapor para espumar leche. Ideal para cappuccinos y lattes. Usada solo un semestre. Cambio por decoración para el hogar o plantas de interior grandes.",
                "category": "Hogar",
                "estimated_value": 120000.00,
                "owner": created_users["maria@example.com"],
            },
            {
                "title": "Balón de Baloncesto Spalding TF-150",
                "description": "Balón de baloncesto de cuero sintético premium para exteriores e interiores. Está prácticamente nuevo, nunca ha tocado el asfalto. Busco mancuernas ajustables de 10kg o ropa deportiva talla M.",
                "category": "Deportes",
                "estimated_value": 25000.00,
                "owner": created_users["maria@example.com"],
            },
            {
                "title": "Audífonos Inalámbricos Sony WH-CH520",
                "description": "Auriculares supraurales bluetooth con hasta 50 horas de autonomía y carga rápida. Muy cómodos y sonido nítido. Busco a cambio libros de texto de ingeniería o accesorios de computación.",
                "category": "Electrónica",
                "estimated_value": 65000.00,
                "owner": created_users["test@example.com"],
            },
            {
                "title": "Saco Tejido de Invierno Unisex",
                "description": "Saco grueso de lana tejido a mano, color beige y azul, ideal para el frío. Unisex, talla M/L. Muy abrigado y en perfecto estado. Busco novela gráfica o cómics.",
                "category": "Ropa",
                "estimated_value": 45000.00,
                "owner": created_users["test@example.com"],
            }
        ]

        for p_data in products_data:
            product = Product.objects.create(**p_data)
            self.stdout.write(f"Producto creado: {product.title} (Categoría: {product.category})")

        self.stdout.write(self.style.SUCCESS("¡Inyección de datos de prueba finalizada correctamente!"))
