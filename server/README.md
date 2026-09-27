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
| POST   | `/api/nps`   | Guarda una respuesta NPS `{ score (0-10), comment?, email? }` |
| POST   | `/api/events` | Evento anónimo de la landing (visita, clic, pulso cada 30 s) |
| GET    | `/admin`     | Panel privado de métricas (pide contraseña)             |
| GET    | `/health`    | Verifica que la API y la base de datos respondan        |

- Las tablas `leads`, `nps_responses` y `events` se crean solas al arrancar.
- Si un correo ya existe, se actualizan sus datos (no se duplica).
- Máximo 10 registros por IP cada 15 minutos.

## Variables de entorno (en Railway)

| Variable          | Valor                                                                        |
|-------------------|------------------------------------------------------------------------------|
| `DATABASE_URL`    | `${{Postgres.DATABASE_URL}}` (referencia al servicio Postgres del proyecto)   |
| `ALLOWED_ORIGINS` | `https://santiagoangel04.github.io` (opcional; ese es el valor por defecto)  |
| `PGSSL`           | Solo `true` si usas la URL pública de Postgres en vez de la interna          |
| `ADMIN_PASSWORD_HASH` | Hash scrypt de la contraseña del panel `/admin` (ver abajo). Sin ella, el panel queda deshabilitado |

`PORT` lo asigna Railway automáticamente.

## Despliegue en Railway

1. En el proyecto de Railway donde está Postgres: **+ Create → GitHub Repo** → `ApartaTuEspacio`.
2. En el nuevo servicio → **Settings → Source → Root Directory**: `/server`.
3. **Variables** → agrega `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`.
4. **Settings → Networking → Generate Domain**.
5. Abre `https://<tu-dominio>.up.railway.app/health`: debe responder `{"ok":true,"db":"up"}`.

## Panel privado de métricas

`https://<tu-dominio>.up.railway.app/admin` · no está enlazado en ningún lado y no se indexa en buscadores.

- **En vivo** (se actualiza cada 10 s): personas en la landing ahora, visitantes/registros de hoy,
  actividad por minuto, quiénes están (dispositivo, origen, tiempo) y últimas acciones.
- **Resumen del periodo** (7, 30 o 90 días): visitantes únicos, páginas vistas, registros, conversión,
  tiempo promedio, visitas y registros por día, embudo, fuentes, dispositivos, clics por sección
  y últimos registros (descargables en CSV).

**Contraseña:** el repositorio no la contiene. Railway guarda solo su hash scrypt en `ADMIN_PASSWORD_HASH`.
Para crear o cambiar la contraseña:

```bash
node scripts/new-admin-password.mjs
```

Guarda la contraseña que imprime y pega el hash en la variable de Railway. Al entrar, la contraseña se
cambia por una sesión firmada que dura 12 horas; el navegador nunca la guarda.

**Medición en la landing:** es anónima (sin cookies, sin IP ni datos personales). Para que las visitas
del equipo no cuenten, abre una vez la landing con `?notrack=1` en cada navegador (`?notrack=0` lo revierte).
Para saber de dónde llega la gente, comparte enlaces con `utm_source`, por ejemplo
`…/ApartaTuEspacio/?utm_source=instagram`.

## Ver los registros

En Railway abre el servicio **Postgres → Data → leads**, o desde la terminal:

```bash
railway connect Postgres
```

```sql
SELECT name, phone, email, created_at FROM leads ORDER BY created_at DESC;
```

## Resultados de la encuesta NPS

La encuesta está en `https://santiagoangel04.github.io/ApartaTuEspacio/encuesta/` (no se enlaza desde la landing).

NPS = % promotores (9–10) − % detractores (0–6):

```sql
SELECT
  COUNT(*) AS respuestas,
  ROUND(100.0 * (COUNT(*) FILTER (WHERE score >= 9) - COUNT(*) FILTER (WHERE score <= 6)) / NULLIF(COUNT(*), 0)) AS nps
FROM nps_responses;
```

```sql
SELECT score, comment, email, created_at FROM nps_responses ORDER BY created_at DESC;
```
