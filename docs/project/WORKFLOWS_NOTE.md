# GitHub Workflows Note

Los workflows de GitHub Actions no pudieron ser pusheados debido a permisos de GitHub App.

**Workflows creados (disponibles en `/tmp/wallie-workflows/`):**
1. `backup.yml` - Backups automáticos diarios
2. `post-deploy-monitor.yml` - Monitoring post-deploy

**Para agregarlos manualmente:**
1. Ve a GitHub → Settings → Actions → General
2. Habilita "Read and write permissions" para workflows
3. Copia los archivos desde `/tmp/wallie-workflows/` a `.github/workflows/`
4. Commit y push

O alternativamente, créalos directamente en GitHub UI.
