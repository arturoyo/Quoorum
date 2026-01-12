# Sistema de Backup Automatizado

Sistema completo de backup de base de datos siguiendo la recomendación #13 de la auditoría.

## 📋 Características

- ✅ Backup de PostgreSQL con `pg_dump` (formato custom optimizado)
- ✅ Compresión automática con `gzip` (nivel 9)
- ✅ Upload a S3/R2 (Cloudflare R2 compatible con S3 API)
- ✅ **Rotación automática: mantiene solo los últimos 30 días de backups locales**
- ✅ **Script de verificación de integridad (`verify-backup.sh`)**
- ✅ Logging detallado con colores
- ✅ Manejo robusto de errores
- ✅ Verificación de dependencias
- ✅ Soporte para múltiples entornos (local, staging, production)

## 🚀 Uso

### Backup Local

```bash
# Backup del entorno local
./scripts/backup-db.sh

# Backup de staging
./scripts/backup-db.sh staging

# Backup de producción (con confirmación)
./scripts/backup-db.sh prod
```

### Backup con Upload a S3/R2

```bash
# Backup local + upload a S3/R2
./scripts/backup-db.sh prod --upload
```

## ⚙️ Configuración

### Variables de Entorno Requeridas

#### Para Backup Local
- `DATABASE_URL` - URL de conexión a PostgreSQL

#### Para Upload a S3/R2

**Opción 1: Cloudflare R2 (Recomendado)**
```bash
export R2_ACCESS_KEY_ID="your-r2-access-key"
export R2_SECRET_ACCESS_KEY="your-r2-secret-key"
export BACKUP_R2_BUCKET="wallie-backups"
export BACKUP_R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
export R2_REGION="auto"  # R2 no requiere región específica
```

**Opción 2: AWS S3**
```bash
export AWS_ACCESS_KEY_ID="your-aws-access-key"
export AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
export BACKUP_S3_BUCKET="wallie-backups"
export AWS_REGION="us-east-1"
```

### Variables Opcionales

```bash
# Directorio de backups locales (default: ./backups)
export BACKUP_DIR="/path/to/backups"

# Máximo de días de backups locales a mantener (default: 30 días)
export MAX_LOCAL_BACKUP_DAYS=30

# Máximo de días de backups en S3/R2 a mantener (default: 30 días)
export MAX_S3_BACKUPS=30
```

## 📁 Estructura de Archivos

```
backups/
├── wallie_local_20260104_143022.sql.gz
├── wallie_staging_20260104_143022.sql.gz
└── wallie_prod_20260104_143022.sql.gz
```

En S3/R2:
```
s3://wallie-backups/
└── backups/
    ├── local/
    │   └── wallie_local_20260104_143022.sql.gz
    ├── staging/
    │   └── wallie_staging_20260104_143022.sql.gz
    └── prod/
        └── wallie_prod_20260104_143022.sql.gz
```

## 🔄 Automatización

### Cron Job (Linux/macOS)

```bash
# Editar crontab
crontab -e

# Backup diario a las 2 AM UTC con upload
0 2 * * * cd /path/to/wallie && ./scripts/backup-db.sh prod --upload >> /var/log/wallie-backup.log 2>&1
```

### GitHub Actions

Ver `.github/workflows/backup.yml` (si existe) o crear:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Diario a las 2 AM UTC
  workflow_dispatch:  # Permite ejecución manual

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup AWS CLI
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Run Backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          BACKUP_S3_BUCKET: ${{ secrets.BACKUP_S3_BUCKET }}
        run: |
          chmod +x scripts/backup-db.sh
          ./scripts/backup-db.sh prod --upload
```

### Vercel Cron (Next.js)

Crear `apps/web/app/api/cron/backup/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: Request) {
  // Verificar secret para seguridad
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { stdout, stderr } = await execAsync(
      './scripts/backup-db.sh prod --upload',
      { cwd: process.cwd() }
    )

    return NextResponse.json({
      success: true,
      output: stdout,
      error: stderr
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
```

Configurar en `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/backup",
    "schedule": "0 2 * * *"
  }]
}
```

## 🔧 Restaurar Backup

### Desde archivo local

```bash
# Descomprimir y restaurar
gunzip -c backups/wallie_prod_20260104_143022.sql.gz | psql $DATABASE_URL

# O si usaste formato custom (--format=custom)
pg_restore -d $DATABASE_URL -Fc backups/wallie_prod_20260104_143022.sql.gz
```

### Desde S3/R2

```bash
# Descargar desde S3
aws s3 cp s3://wallie-backups/backups/prod/wallie_prod_20260104_143022.sql.gz ./backup.sql.gz

# Restaurar
gunzip -c backup.sql.gz | psql $DATABASE_URL
```

## 📊 Monitoreo

### Verificar backups recientes

```bash
# Listar backups locales
ls -lh backups/

# Listar backups en S3/R2
aws s3 ls s3://wallie-backups/backups/prod/ --recursive --human-readable
```

### Verificar integridad

Wallie incluye un script dedicado para verificar la integridad de los backups:

```bash
# Verificar el último backup creado
./scripts/verify-backup.sh

# Verificar un backup específico
./scripts/verify-backup.sh backups/wallie_prod_20260104_143022.sql.gz
```

El script `verify-backup.sh` realiza las siguientes verificaciones:

1. ✅ **Existencia y tamaño**: Verifica que el archivo existe y no está vacío
2. ✅ **Formato gzip**: Valida que el archivo es un gzip válido y no está corrupto
3. ✅ **Descompresión**: Descomprime el archivo y verifica que no hay errores
4. ✅ **Formato del backup**: Detecta si es formato custom o SQL plano
5. ✅ **Checksum**: Verifica checksum MD5 si existe un archivo `.md5` asociado

**Verificación manual (alternativa):**

```bash
# Verificar que el archivo no está corrupto
gunzip -t backups/wallie_prod_20260104_143022.sql.gz

# Verificar tamaño del backup
du -h backups/wallie_prod_20260104_143022.sql.gz
```

## 🔐 Seguridad

### Mejores Prácticas

1. **No commitear secrets**
   - Usar variables de entorno
   - Usar secret managers (Vercel Secrets, GitHub Secrets)

2. **Permisos de archivos**
   ```bash
   chmod 600 backups/*.sql.gz  # Solo lectura para owner
   ```

3. **Encriptación en S3/R2**
   - Habilitar encriptación server-side en el bucket
   - Usar IAM policies restrictivas

4. **Rotación de credenciales**
   - Rotar keys de acceso regularmente
   - Usar roles IAM en lugar de keys cuando sea posible

## 🐛 Troubleshooting

### Error: pg_dump no encontrado

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Instalar PostgreSQL desde postgresql.org
```

### Error: AWS CLI no encontrado

```bash
# macOS
brew install awscli

# Ubuntu/Debian
sudo apt-get install awscli

# O usar pip
pip install awscli
```

### Error: Permisos de S3/R2

Verificar que las credenciales tienen permisos:
- `s3:PutObject` - Para subir backups
- `s3:GetObject` - Para descargar backups
- `s3:ListBucket` - Para listar backups
- `s3:DeleteObject` - Para limpiar backups antiguos

### Error: Backup muy grande

Si el backup es muy grande (>10GB), considerar:
- Usar `--format=custom` (ya implementado)
- Aumentar timeout en S3 upload
- Usar multipart upload para archivos grandes

## 📈 Métricas Recomendadas

Monitorear:
- Tamaño de backups (alertar si crece >50% en una semana)
- Tiempo de backup (alertar si >30 minutos)
- Tasa de éxito de backups (alertar si falla 2 días seguidos)
- Espacio usado en S3/R2 (alertar si >80% del bucket)

## 🎯 Estado Actual

1. ✅ Script de backup creado (`backup-db.sh`)
2. ✅ Script de verificación creado (`verify-backup.sh`)
3. ✅ Rotación automática de 30 días implementada
4. ✅ Documentación completa en README.md
5. ⏳ Configurar GitHub Actions workflow (opcional)
6. ⏳ Configurar alertas de monitoreo (opcional)
7. ⏳ Implementar backup incremental (futuro)

