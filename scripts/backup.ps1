<#
.SYNOPSIS
    Script para respaldar la base de datos PostgreSQL de CambiaYa.
.DESCRIPTION
    Este script genera un archivo de respaldo (.sql o .backup) de la base de datos
    utilizando pg_dump. Se asegura de crear la carpeta de respaldos si no existe y 
    añade la fecha y hora al nombre del archivo para evitar sobrescrituras.
#>

$DB_NAME = "cambiaya_db"
$DB_USER = "postgres"
$DB_HOST = "localhost"
$DB_PORT = "5432"

# Ruta donde se guardarán los respaldos
$BACKUP_DIR = "C:\Users\labinf1.pasto\Documents\CambiaYa-develop\backups"

# Crear directorio si no existe
if (-not (Test-Path -Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "Directorio de backups creado: $BACKUP_DIR" -ForegroundColor Green
}

# Generar el nombre del archivo con timestamp
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\backup_${DB_NAME}_${TIMESTAMP}.sql"

Write-Host "Iniciando respaldo de la base de datos '$DB_NAME'..." -ForegroundColor Cyan

# Definir PGPASSWORD si se requiere de forma automática (Reemplazar 'tu_contraseña' por la real)
# $env:PGPASSWORD="tu_contraseña"

# Ejecutar pg_dump
# Asumimos que pg_dump está en el PATH del sistema
try {
    pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F p -f $BACKUP_FILE
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Respaldo completado exitosamente: $BACKUP_FILE" -ForegroundColor Green
    } else {
        Write-Host "Ocurrió un error al realizar el respaldo." -ForegroundColor Red
    }
} catch {
    Write-Host "Error al ejecutar pg_dump. Asegúrate de que PostgreSQL esté instalado y en el PATH." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
}

# Limpiar variable de entorno si se usó
# Remove-Item Env:\PGPASSWORD
