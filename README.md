# ApartaTuEspacio · Landing de validación

Landing page para validar la idea **ApartaTuEspacio**: "Encuentra dónde parquear antes de llegar."

Hecha con React + Vite y CSS por componente, sin frameworks de estilos.

## Uso

```bash
npm install
npm run dev      # desarrollo en http://localhost:5173
npm run build    # compilación de producción en /dist
npm run preview  # previsualiza la compilación
```

## Estructura

```
src/
  components/   Navbar, Hero, HeroVisual, ProblemSection, HowItWorks, Audience,
                Benefits, JoinSection, LeadForm, Footer, MobileCta, CtaButton, Logo
  hooks/        useReveal (animaciones al hacer scroll), scrollTo (scroll suave)
  services/     leadService.js: envío de registros
  utils/        validation.js: validación de nombre, teléfono y correo
```

## Guardar los registros en MySQL (Railway)

La carpeta [`server/`](server/README.md) contiene la API que guarda los registros en MySQL.
Una vez desplegada en Railway, pon su URL (`https://<dominio>.up.railway.app/api/leads`) como
secreto `VITE_LEADS_ENDPOINT` del repositorio en GitHub y vuelve a ejecutar el deploy.

## Conectar el formulario a un servicio real

Por defecto el formulario **simula** el envío (modo demo). Para guardar los registros:

1. Copia `.env.example` como `.env`.
2. Define `VITE_LEADS_ENDPOINT` con la URL de tu servicio (Formspree, Google Apps Script,
   Supabase, una API propia…).
3. El endpoint recibirá un `POST` con JSON:
   `{ name, phone, email, consent, source, createdAt }` y debe responder con un estado 2xx.

Si el servicio falla, el usuario ve un mensaje de error y conserva los datos que escribió.
