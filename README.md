# Pedidos en Producción — MS

Control de pedidos en taller MX y EU para el equipo de asesoras.

## URLs

- Asesoras: `/`
- Admin (Vale): `/admin`

## Setup

### 1. Crear repo en GitHub y subir archivos

```bash
git init
git add .
git commit -m "init pedidos produccion"
git remote add origin https://github.com/Valevaldem/pedidos-produccion.git
git push -u origin main
```

### 2. Crear tablas en Neon Console

Abrir el SQL Editor en Neon y ejecutar todo el contenido de `CREATE_TABLES.sql`.
**No usar `prisma db push`** — las tablas se crean manualmente.

### 3. Crear proyecto en Vercel

1. Importar repo desde GitHub
2. Variables de entorno: `DATABASE_URL` (la misma connection string de Neon que usan los otros proyectos)
3. Deploy

## Desarrollo local

```bash
npm install
# Crear archivo .env con DATABASE_URL
npm run dev
```
