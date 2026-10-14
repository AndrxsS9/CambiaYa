<#
.SYNOPSIS
    Script para restaurar la base de datos PostgreSQL de CambiaYa.
.DESCRIPTION
    Este script restaura un archivo de respaldo (.sql) en la base de datos
    utilizando psql. Solicita la ruta del archivo de respaldo a restaurar.
#>

$DB_NAME = "cambiaya_db"
$DB_USER = "postgres"
$DB_HOST = "localhost"
$DB_PORT = "5432"

# Solicitar la ruta del archivo de respaldo
$BACKUP_FILE = Read-Host "Introduce la ruta completa del archivo de respaldo (.sql) a restaurar"

if (-not (Test-Path -Path $BACKUP_FILE)) {
    Write-Host "El archivo especificado no existe: $BACKUP_FILE" -ForegroundColor Red
    exit
}

Write-Host "Iniciando restauración de la base de datos '$DB_NAME' desde '$BACKUP_FILE'..." -ForegroundColor Cyan
Write-Host "ADVERTENCIA: Esto sobrescribirá datos existentes en las tablas afectadas." -ForegroundColor Yellow

# Confirmación
$CONFIRM = Read-Host "¿Estás seguro de continuar? (s/n)"
if ($CONFIRM -ne 's') {
    Write-Host "Restauración cancelada." -ForegroundColor Yellow
    exit
}

# Definir PGPASSWORD si se requiere de forma automática (Reemplazar 'tu_contraseña' por la real)
# $env:PGPASSWORD="tu_contraseña"

# Ejecutar psql para restaurar
# Asumimos que psql está en el PATH del sistema
try {
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $BACKUP_FILE
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Restauración completada exitosamente." -ForegroundColor Green
    } else {
        Write-Host "Ocurrió un error al realizar la restauración." -ForegroundColor Red
    }
} catch {
    Write-Host "Error al ejecutar psql. Asegúrate de que PostgreSQL esté instalado y en el PATH." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
}

# Limpiar variable de entorno si se usó
# Remove-Item Env:\PGPASSWORD
