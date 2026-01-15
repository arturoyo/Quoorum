#!/bin/bash
# Backup automático de PostgreSQL local

BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/quoorum_backup_$TIMESTAMP.sql"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo "💾 BACKUP PostgreSQL Local"
echo "=========================="
echo "→ Creando backup en: $BACKUP_FILE"

# Hacer dump de la base de datos
docker exec quoorum-postgres pg_dump -U postgres -d quoorum > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  # Comprimir backup
  gzip "$BACKUP_FILE"

  echo "✅ Backup completado: ${BACKUP_FILE}.gz"

  # Mostrar tamaño
  SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
  echo "   Tamaño: $SIZE"

  # Limpiar backups antiguos (mantener últimos 10)
  echo "→ Limpiando backups antiguos..."
  ls -t "$BACKUP_DIR"/quoorum_backup_*.sql.gz | tail -n +11 | xargs -r rm

  BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/quoorum_backup_*.sql.gz 2>/dev/null | wc -l)
  echo "   Backups totales: $BACKUP_COUNT"

  exit 0
else
  echo "❌ Error al crear backup"
  exit 1
fi
