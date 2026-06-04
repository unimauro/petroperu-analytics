# Manual de despliegue

## Requisitos
- Node.js 20+ y npm
- Python 3.12+ (para regenerar datos)
- Cuenta de GitHub (para Pages) — opcional Cloudflare para dominio propio

## 1. Desarrollo local

```bash
# 1) Regenerar los datos estáticos (con macro BCRP si hay red, o --offline)
python etl/etl_pipeline.py            # o: python etl/etl_pipeline.py --offline

# 2) Frontend
cd frontend
npm install
npm run dev                           # http://localhost:5173
```

El frontend lee los JSON de `frontend/public/data/`. Si cambias el seed CSV, vuelve a
correr el ETL y refresca.

## 2. Build de producción

```bash
cd frontend
npm run build       # genera frontend/dist (incluye los JSON de public/data)
npm run preview     # previsualiza el build
```

## 3. Despliegue automático en GitHub Pages (recomendado)

1. Crea el repo en GitHub (ej. `unimauro/petroperu-analytics`) y haz push de `main`.
2. En **Settings → Pages**, *Build and deployment* → **Source: GitHub Actions**.
3. El workflow `.github/workflows/deploy.yml` corre el ETL, hace build y publica.
4. URL resultante: `https://<usuario>.github.io/petroperu-analytics/`.

> El `base` de Vite por defecto es `/petroperu-analytics/`. Si el repo tiene otro nombre,
> ajusta `VITE_BASE` en el workflow y/o `vite.config.ts`.

## 4. Despliegue manual (alternativo)

```bash
cd frontend && npm run build
npx gh-pages -d dist        # requiere el paquete gh-pages
```

## 5. Dominio propio / Cloudflare (opcional)

- Build con `VITE_BASE="/"` si sirves desde la raíz de un dominio.
- Sube `frontend/dist` a Cloudflare Pages (framework preset: *None/Vite*, build dir `dist`).
- Configura el dominio y deja el CDN/SSL de Cloudflare por delante.

## 6. Regenerar datos en CI con macro en vivo

En `deploy.yml`, quita la bandera `--offline` del paso *Run ETL* para que el BCRP se consulte
en cada despliegue. El ETL es tolerante a fallos: si no hay red, continúa sin el macro.

## 7. Pronóstico (opcional)

```bash
# Fallback sin dependencias (siempre funciona):
python analytics/forecasting.py --metric revenue --horizon 3 --out frontend/public/data/forecast.json

# Con modelos avanzados:
pip install prophet xgboost pandas scikit-learn
python analytics/forecasting.py --metric total_debt --horizon 5 --out frontend/public/data/forecast.json
```

## Solución de problemas
- **Página en blanco en Pages**: revisa que `base` coincida con el nombre del repo.
- **Datos no cargan**: confirma que `frontend/public/data/*.json` existen (corre el ETL).
- **Grafo vacío**: revisa `governance_seed.csv` y vuelve a correr el ETL.
