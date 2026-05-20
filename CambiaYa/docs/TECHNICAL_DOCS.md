# Documentación Técnica: CambiaYa

Esta documentación aborda aspectos iniciales de arquitectura, lineamientos de pruebas (QA) y procedimientos de respaldo de datos (Backup & Restore).

---

## 1. Arquitectura del Sistema

El proyecto **CambiaYa** es una aplicación tipo Marketplace estructurada de la siguiente manera:

- **Frontend:** React + Vite, estilizado con Tailwind CSS.
- **Backend:** Django (Python) expuesto mediante Django REST Framework.
- **Base de Datos:** PostgreSQL (con interacciones mediante `psycopg2`).
- **Autenticación:** JWT (JSON Web Tokens).
- **Almacenamiento de Archivos:** Cloudinary (para imágenes de productos y perfiles).

---

## 2. Pruebas de Compatibilidad (RNF06)

Para asegurar que la aplicación responda correctamente en navegadores modernos y dispositivos móviles:

### Pruebas en Navegadores Modernos
El proyecto frontend está configurado con `browserslist` en el `package.json`. Esto garantiza que, durante la fase de *build*, herramientas como Autoprefixer y Babel adapten el código CSS y JS para que funcione en las últimas versiones de navegadores principales.

**Matriz de Navegadores Recomendada para Pruebas Manuales:**
- Google Chrome (últimas 2 versiones)
- Mozilla Firefox (últimas 2 versiones)
- Apple Safari (últimas 2 versiones)
- Microsoft Edge (últimas 2 versiones)

### Pruebas en Dispositivos Móviles
Dado que se utiliza Tailwind CSS, el diseño debe ser *Mobile-First*. Para probar la correcta adaptación a dispositivos móviles:
1. **Chrome DevTools (Simulación):**
   - Abrir Google Chrome y presionar `F12`.
   - Activar el modo de dispositivo (Ctrl + Shift + M).
   - Probar con dimensiones estándar: iPhone 12 Pro (390x844), Pixel 5 (393x851), y un iPad (768x1024).
2. **Pruebas en red local:**
   - Iniciar el servidor con `npm run dev -- --host`.
   - Acceder desde el navegador del dispositivo móvil utilizando la IP local (ej. `http://192.168.x.x:5173`).

---

## 3. Respaldo y Restauración de Base de Datos (RNF10)

Para asegurar la disponibilidad de la información, se han creado scripts en PowerShell para facilitar la creación de copias de seguridad de la base de datos PostgreSQL.

### 3.1. Requisitos Previos
- Tener instalado PostgreSQL y sus utilidades en la máquina (`pg_dump`, `psql`).
- Las utilidades de PostgreSQL deben estar agregadas al `PATH` del sistema (por ejemplo, `C:\Program Files\PostgreSQL\15\bin`).

### 3.2. Realizar un Respaldo (Backup)
Se recomienda automatizar este script mediante el **Programador de tareas de Windows** para que se ejecute de forma diaria o semanal.

1. Abre PowerShell.
2. Dirígete a la carpeta raíz del proyecto y ejecuta el script:
   ```powershell
   .\scripts\backup.ps1
   ```
3. El script creará automáticamente una carpeta `backups` y generará un archivo `.sql` con la fecha y hora actual (ej. `backup_cambiaya_db_20260429_150000.sql`).

### 3.3. Restaurar un Respaldo (Restore)
> **ADVERTENCIA:** Este proceso sobrescribirá los datos actuales de la base de datos local.

1. Abre PowerShell.
2. Dirígete a la carpeta raíz del proyecto y ejecuta el script:
   ```powershell
   .\scripts\restore.ps1
   ```
3. El sistema solicitará la ruta completa del archivo de respaldo que deseas restaurar (ej. `C:\Users\labinf1.pasto\Documents\CambiaYa-develop\backups\backup_cambiaya_db_20260429_150000.sql`).
4. Confirma escribiendo `s`.

---

## 4. Lineamientos Generales (RNF07)
- **Mantenibilidad:** Asegurarse de utilizar comentarios adecuados en el código.
- **Componentización:** Para el frontend, crear componentes reutilizables en `src/components`.
- **APIs:** Mantener el archivo `.env` seguro, sin subirlo nunca al repositorio (asegurarse de que está en `.gitignore`).
