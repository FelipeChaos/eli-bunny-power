# 🐰 Eli Bunny Power

Sistema web de gamificación para fomentar autonomía infantil mediante puntos semanales.

## Qué incluye

- Panel visual para Eli.
- Semana lunes–domingo.
- Puntos por deberes autónomos.
- Penalizaciones configurables.
- Niveles Cute, Power y Super Bunny.
- Premios con duración y frecuencia.
- Historial de movimientos.
- Configuración de rangos de puntos.
- CRUD de deberes, penalizaciones y premios.
- Botón de impresión para un tablero físico.
- Persistencia con Supabase.
- RLS para que cada cuenta solo vea sus propios datos.
- Modo local de respaldo si no se configuran variables de Supabase.
- Deploy automático a GitHub Pages.

## Puntos iniciales

### Ganan

- Actividades del colegio: +10 PA
- Revisar Trendi y cuadernos: +10 PA
- Alistar cuadernos y materiales: +10 PA
- Tender cama y ordenar cuarto: +5 PA
- Recoger cuarto y baño: +5 PA
- Sacar y lavar ropa interior de la ducha: +5 PA

### Pierden

- Usar YouTube: −50 PA
- Mala actitud o pataleta: −20 PA
- Incumplir tarea escolar: −20 PA
- Necesitar recordatorios continuos: −10 PA

Estos valores son los valores iniciales y pueden modificarse desde Configuración.

## Niveles iniciales

- 0–119 PA: sigue esforzándote / sin desbloqueo
- Cute: 120–169 PA
- Power: 170–219 PA
- Super Bunny: 220+ PA

## 1. Crear Supabase

1. Crea un proyecto gratuito en Supabase.
2. Abre SQL Editor.
3. Copia y ejecuta `supabase/schema.sql`.
4. En Authentication crea el usuario adulto o usa "Crear cuenta" desde la aplicación.
5. En Project Settings > API copia:
   - Project URL
   - anon public key

## 2. Configurar localmente

Copia `.env.example` a `.env.local`:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

Luego:

```bash
npm install
npm run dev
```

## 3. Publicar gratis en GitHub Pages

1. Crea un repositorio, por ejemplo `eli-bunny-power`.
2. Sube todo el proyecto.
3. Ve a Settings > Secrets and variables > Actions.
4. Crea estos Repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Ve a Settings > Pages.
6. En Build and deployment selecciona `GitHub Actions`.
7. Haz push a `main`.
8. El workflow desplegará la aplicación.

No necesitas comprar dominio. GitHub Pages entrega una dirección gratuita del tipo:

`https://TU-USUARIO.github.io/eli-bunny-power/`

## 4. Uso

### Para Eli

Registrar una actividad solo cuando esté terminada. El panel muestra el puntaje semanal y el siguiente nivel.

### Para el adulto

Entrar con la cuenta adulta y usar Configuración para:

- Cambiar los puntos.
- Crear, editar o eliminar deberes.
- Crear o cambiar penalizaciones.
- Cambiar rangos de niveles.
- Crear o cambiar premios.

## Regla semanal

Los eventos tienen fecha. El tablero calcula automáticamente la semana actual de lunes a domingo. El lunes el total vuelve a 0 para efectos de desbloqueo, pero el historial permanece en la base de datos.

## Situaciones especiales

La aplicación no genera penalización automática. Si hay enfermedad, evento familiar, viaje u otra circunstancia extraordinaria, simplemente no se registra el deber o el adulto puede corregir/eliminar un registro.

## Seguridad

La clave `anon public` de Supabase no es un secreto. La protección real está en las políticas RLS del archivo SQL. No publiques nunca una `service_role key` en GitHub.

## Importante sobre GitHub Pages

GitHub Pages solo sirve archivos estáticos. La base de datos vive en Supabase. Por eso la combinación es:

**GitHub → código y hosting web**

**Supabase → autenticación + base de datos**

Esto permite mantener la aplicación sin comprar dominio ni servidor propio.

## Diseño

La identidad visual se basa en el documento de referencia de Eli: estética pastel/cute tipo Bunny, fondo `#faf4ff`, púrpura `#701a75`, acentos rosa `#d946ef` / `#f472b6` y rojo suave para penalizaciones.
