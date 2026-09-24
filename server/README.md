# API de registros · ApartaTuEspacio

Servidor Express que recibe los registros del formulario y los guarda en PostgreSQL (Railway).

```
Landing (GitHub Pages) ──POST /api/leads──▶ API (Railway) ──▶ PostgreSQL (Railway)
```

La landing nunca se conecta directo a la base de datos: las credenciales solo viven en Railway.
**Nunca pongas la URL de la base de datos (con su contraseña) en el código ni en el repositorio.**

## Endpoints

| Método | Ruta         | Descripción                                             |
|--------|--------------|---------------------------------------------------------|
| POST   | `/api/leads` | Guarda un registro `{ name, phone, email, consent }`    |
| GET    | `/health`    | Verifica que la API y la base de datos respondan        |

- La tabla `leads` se crea sola al arrancar.
- Si un correo ya existe, se actualizan sus datos (no se duplica).
- Máximo 10 registros por IP cada 15 minutos.

## Variables de entorno (en Railway)

| Variable          | Valor                                                                        |
|-------------------|------------------------------------------------------------------------------|
| `DATABASE_URL`    | `${{Postgres.DATABASE_URL}}` (referencia al servicio Postgres del proyecto)   |
| `ALLOWED_ORIGINS` | `https://santiagoangel04.github.io` (opcional; ese es el valor por defecto)  |
| `PGSSL`           | Solo `true` si usas la URL pública de Postgres en vez de la interna          |

`PORT` lo asigna Railway automáticamente.

## Despliegue en Railway

1. En el proyecto de Railway donde está Postgres: **+ Create → GitHub Repo** → `ApartaTuEspacio`.
2. En el nuevo servicio → **Settings → Source → Root Directory**: `/server`.
3. **Variables** → agrega `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`.
4. **Settings → Networking → Generate Domain**.
5. Abre `https://<tu-dominio>.up.railway.app/health`: debe responder `{"ok":true,"db":"up"}`.

## Ver los registros

En Railway abre el servicio **Postgres → Data → leads**, o desde la terminal:

```bash
railway connect Postgres
```

```sql
SELECT name, phone, email, created_at FROM leads ORDER BY created_at DESC;
```
