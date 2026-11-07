# Deuda Clara

App móvil para documentar ingresos, gastos y deudas, entender la situación financiera y seguir un plan de pago realista. Pensada para Colombia: pesos colombianos (COP), español y cálculos con tasas efectivas anuales.

**Versión actual:** MVP local-first para Android con acceso obligatorio por código enviado al correo. No requiere banco conectado ni conexión permanente después del primer inicio de sesión.

## Funcionalidades del MVP

- Registro e inicio de sesión con Gmail, Outlook o cualquier correo mediante un código de 6 dígitos enviado por Supabase.
- Onboarding con perfil, ingreso mensual y primera deuda.
- Registro de gastos, ingresos y pagos de deuda.
- Historial por mes, filtros y eliminación de movimientos.
- CRUD de deudas con saldo, tasa EA, cuota mínima, día de pago y notas.
- Registro de pagos que reduce el saldo y conserva el historial.
- Diagnóstico mensual: ingresos, gastos, pagos, balance y disponible diario.
- Simulación de estrategias **avalancha** y **bola de nieve**.
- Comparación de escenarios con abono extra.
- Exportación de respaldo JSON y movimientos CSV.
- Modo claro/oscuro automático.
- Datos financieros guardados localmente con SQLite.
- Sesión persistente que permite seguir usando la app sin conexión después del primer acceso.
- Aislamiento por cuenta: si otra persona inicia sesión en el mismo teléfono, los datos locales anteriores se eliminan.

## Stack

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/)
- React Native 0.88 + React 19
- TypeScript estricto
- Expo Router con tabs en JavaScript y rutas protegidas
- `expo-sqlite` con migraciones SQL directas y repositorio propio
- `expo-sqlite/kv-store` para persistir la sesión de Supabase
- [Supabase](https://supabase.com/) Free para autenticación por correo
- `date-fns` para fechas en español
- Vitest para pruebas de dominio

No hay servidor propio ni se usa Drizzle: la base SQLite local es la fuente de verdad de los datos financieros. Supabase solo gestiona el correo y la sesión de acceso.

## Arquitectura

```text
src/
  app/                 Rutas de Expo Router
    auth.tsx           Acceso por código de correo
    (tabs)/            Inicio, Movimientos, Deudas, Plan, Ajustes
    deuda/[id].tsx     Detalle de deuda y registro de pagos
    nueva-deuda.tsx
    editar-deuda/[id].tsx
    nuevo-movimiento.tsx
    onboarding.tsx
    editar-perfil.tsx
    privacidad.tsx
  components/          Formularios y componentes reutilizables
  constants/           Tema, colores, tipografía y etiquetas
  db/                  Esquema, migraciones y repositorio SQLite
  domain/              Lógica pura: dinero, fechas, finanzas y payoff
  hooks/               Tema
  lib/                 Supabase, validación de correo, sesión y exportación JSON/CSV
  providers/           Sesión, estado global y acciones de la app
  __tests__/           Pruebas de dominio con Vitest
```

### Capas

1. **Dominio** (`src/domain`): funciones puras, sin React ni SQLite. Aquí viven los cálculos de saldo, resumen mensual, próximos pagos y simulación de estrategias. Es la capa cubierta por pruebas.
2. **Datos** (`src/db`): esquema versionado con `PRAGMA user_version`, semillas de categorías, consultas y transacciones. Los montos se guardan como enteros COP.
3. **Autenticación** (`src/providers/auth-provider.tsx`): restaura la sesión de Supabase, envía y verifica códigos, renueva tokens al volver a la app y permite recuperar el acceso sin conexión con la última identidad verificada.
4. **Estado** (`src/providers`): `AppProvider` vincula la base local a la cuenta activa, carga perfil, categorías, movimientos y deudas, y expone mutaciones que refrescan la información.
5. **UI** (`src/app`, `src/components`): pantallas y componentes. No contienen fórmulas financieras complejas.

### Modelo de datos

- `profile`: perfil único, `auth_user_id` de Supabase, ingreso mensual, abono extra, estrategia y estado de onboarding.
- `categories`: categorías de gasto e ingreso (semilla incluida).
- `debts`: saldo original, saldo actual, tasa EA en puntos básicos, cuota mínima, día de pago y borrado lógico.
- `transactions`: libro unificado de `expense`, `income` y `debt_payment`, con borrado lógico.

Los pagos a deuda son transacciones. Al eliminar un pago, el saldo de la deuda se restaura automáticamente.

`profile.auth_user_id` ata la base local a una única cuenta. La primera cuenta que inicia sesión reclama un perfil local anterior; si luego entra otra cuenta, se borran los datos financieros locales de la cuenta anterior. El correo y la sesión viven en Supabase; los datos financieros nunca se envían a la nube en esta versión.

## Requisitos

- Node.js 20 o superior.
- npm.
- Un teléfono Android con [Expo Go](https://expo.dev/go) instalado.
- Una cuenta gratuita de [Supabase](https://supabase.com/).
- No se necesita Android Studio para desarrollar el MVP.

## Configurar autenticación con Supabase

### 1. Crear el proyecto

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com/).
2. En **Project Settings → API**, copia la **Project URL** y la **anon public key**.

### 2. Variables de entorno

```bash
cp .env.example .env
```

Completa `.env`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-publica
```

`.env` está en `.gitignore`. La clave `anon` es pública y está diseñada para apps móviles; nunca uses la clave `service_role` en el teléfono.

### 3. Plantillas de correo con código

Por defecto Supabase envía un enlace mágico. Para que la app reciba un código de 6 dígitos, edita las plantillas en **Authentication → Emails** e incluye `{{ .Token }}`:

- **Confirm signup**
- **Magic Link**

Ejemplo de contenido:

```html
<h2>Tu código de Deuda Clara</h2>
<p>Escribe este código en la app para confirmar tu correo:</p>
<p style="font-size: 28px; letter-spacing: 8px; font-weight: bold;">{{ .Token }}</p>
<p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
```

La app llama a `signInWithOtp({ email, options: { shouldCreateUser: true } })` y luego a `verifyOtp({ email, token, type: 'email' })`. Funciona con Gmail, Outlook o cualquier correo válido.

### 4. Límites de correo

El servicio de correo incluido en Supabase Free tiene límites estrictos por hora. Para pruebas personales suele ser suficiente. Si vas a abrir la app a más usuarios, configura un proveedor SMTP propio en **Authentication → SMTP** (por ejemplo, el plan gratuito de Resend o Brevo).

## Instalación y uso

```bash
cd AppDeudas
npm install
npx expo start
```

Escanea el código QR con Expo Go (Android). El teléfono y el computador deben estar en la misma red Wi-Fi. Si la red bloquea la conexión, usa:

```bash
npx expo start --tunnel
```

Si cambias las variables de entorno, reinicia con `npx expo start --clear`. Cuando faltan las claves, la app muestra una pantalla de configuración en lugar del formulario de acceso.

### Comandos

```bash
npm start             # Servidor de desarrollo
npm run android       # Abrir en emulador/dispositivo Android
npm run lint          # ESLint
npm run typecheck     # TypeScript estricto
npm test              # Pruebas de dominio
npm run test:watch    # Pruebas en modo watch
npx expo-doctor       # Diagnóstico de dependencias y configuración
```

## Pruebas

Las pruebas cubren:

- Formato y parseo de pesos colombianos.
- Tasas efectivas anuales a mensuales.
- Fechas de vencimiento, días restantes y comparaciones.
- Resumen mensual, totales de deuda, próximos pagos y gasto por categoría.
- Simulación avalancha/bola de nieve, orden de pago, planes inviables e intereses.
- Normalización de correos, validación de direcciones y mensajes de error de autenticación.

```bash
npm test
```

## Construir un APK sin Google Play

La app puede distribuirse como APK interno sin pagar la cuota de Google Play.

1. Crear una cuenta gratuita en [expo.dev](https://expo.dev).
2. Instalar y autenticar EAS CLI:

   ```bash
   npx eas-cli@latest login
   ```

3. Generar el APK:

   ```bash
   npx eas-cli@latest build --platform android --profile preview
   ```

El perfil `preview` de `eas.json` genera un APK instalable directamente en Android. Para desarrollo diario con Expo Go no hace falta compilar nada.

Las variables `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` también deben existir en EAS. Configúralas en **Expo Dashboard → Project → Environment variables** para los entornos `preview` y `production`, o con:

```bash
npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://tu-proyecto.supabase.co" --environment preview --visibility plaintext
npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "tu-clave-anon" --environment preview --visibility sensitive
```

> EAS tiene un plan gratuito con límite de builds. Revisa las condiciones vigentes antes de usarlo.

## Privacidad

- El acceso es obligatorio y se verifica con un código enviado al correo mediante Supabase.
- En Supabase solo se guarda el correo y la información técnica de la sesión.
- Los datos financieros se guardan en la base SQLite del teléfono y no se sincronizan con la nube en esta versión.
- El respaldo JSON y el CSV solo se comparten cuando el usuario lo decide.
- Si otra cuenta inicia sesión en el mismo teléfono, los datos locales de la cuenta anterior se eliminan.
- No se solicitan credenciales bancarias ni números completos de tarjetas.
- La app es una herramienta educativa; no es asesoría financiera regulada.

## Limitaciones actuales

- Solo Android está validado como objetivo principal; iOS requiere revisión.
- No existe todavía importación de respaldos, sincronización, espacios compartidos ni widgets.
- La base local no está cifrada y la sesión se guarda en el almacenamiento de la app. Se recomienda proteger el teléfono con PIN o biometría.
- La app trabaja con una sola cuenta por teléfono. Cambiar de cuenta borra los datos locales anteriores; todavía no hay migración entre cuentas.
- La primera vez se necesita internet para recibir el código. Después, la sesión persistida permite abrir la app sin conexión.
- Los proyectos gratuitos de Supabase pueden pausarse tras un periodo de inactividad; si el acceso deja de funcionar, reactiva el proyecto desde el panel de Supabase.
- La simulación usa tasas constantes y pagos puntuales; no modela comisiones, seguros, moras ni cambios de tasa.
- El borrado de deudas es lógico y las transacciones históricas se conservan.

## Próximos pasos

1. Validación en dispositivo y corrección de detalles de UX.
2. Importación de respaldos JSON.
3. Espacio **Hogar** con Supabase Free, invitación por WhatsApp y RLS.
4. Widgets de pantalla de inicio.
5. Bloqueo biométrico y cifrado de la base local.
6. Notificaciones de cuotas y presupuestos.
7. Publicación en tiendas alternativas o Google Play si se decide asumir el costo.

## Licencia

Ver `LICENSE`.
