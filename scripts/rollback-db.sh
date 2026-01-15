#!/bin/bash
# Rollback de base de datos al último backup

BACKUP_DIR="backups"

echo "🔄 ROLLBACK - Restaurar Base de Datos"
echo "====================================="

# Buscar último backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/quoorum_backup_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ No se encontró ningún backup"
  echo "   Ejecuta: bash scripts/backup-db.sh"
  exit 1
fi

echo "→ Último backup encontrado:"
echo "   $LATEST_BACKUP"
echo "   Fecha: $(stat -c %y "$LATEST_BACKUP" 2>/dev/null || stat -f %Sm "$LATEST_BACKUP")"
echo ""

# Confirmar rollback
read -p "⚠️  ¿Restaurar este backup? ESTO SOBRESCRIBIRÁ LA DB ACTUAL (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Rollback cancelado"
  exit 0
fi

# Descomprimir backup
echo "→ Descomprimiendo backup..."
TEMP_SQL="${LATEST_BACKUP%.gz}"
gunzip -c "$LATEST_BACKUP" > "$TEMP_SQL"

# Restaurar backup
echo "→ Restaurando base de datos..."
docker exec -i quoorum-postgres psql -U postgres -d quoorum < "$TEMP_SQL"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ ROLLBACK COMPLETADO"
  echo "   Base de datos restaurada correctamente"

  # Limpiar archivo temporal
  rm "$TEMP_SQL"
  exit 0
else
  echo ""
  echo "❌ Error al restaurar backup"
  rm "$TEMP_SQL"
  exit 1
fi
