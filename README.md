# Deuda Clara

App móvil para documentar ingresos, gastos y deudas, entender la situación financiera y seguir un plan de pago realista. Pensada para Colombia: pesos colombianos (COP), español y cálculos con tasas efectivas anuales.

**Versión actual:** MVP local-first para Android. Funciona sin cuentas, sin banco conectado y sin internet.

## Funcionalidades del MVP

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
- Datos guardados localmente con SQLite.

## Stack

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/)
- React Native 0.88 + React 19
- TypeScript estricto
- Expo Router con tabs en JavaScript
- `expo-sqlite` con migraciones SQL directas y repositorio propio
- `date-fns` para fechas en español
- Vitest para pruebas de dominio

No se usa Drizzle ni un backend: la base SQLite local es la fuente de verdad.

## Arquitectura

```text
src/
  app/                 Rutas de Expo Router
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
  lib/                 Exportación JSON/CSV
  providers/           Estado global y acciones de la app
  __tests__/           Pruebas de dominio con Vitest
```

### Capas

1. **Dominio** (`src/domain`): funciones puras, sin React ni SQLite. Aquí viven los cálculos de saldo, resumen mensual, próximos pagos y simulación de estrategias. Es la capa cubierta por pruebas.
2. **Datos** (`src/db`): esquema versionado con `PRAGMA user_version`, semillas de categorías, consultas y transacciones. Los montos se guardan como enteros COP.
3. **Estado** (`src/providers`): `AppProvider` carga perfil, categorías, movimientos y deudas, y expone mutaciones que refrescan la información.
4. **UI** (`src/app`, `src/components`): pantallas y componentes. No contienen fórmulas financieras complejas.

### Modelo de datos

- `profile`: perfil único, ingreso mensual, abono extra, estrategia y estado de onboarding.
- `categories`: categorías de gasto e ingreso (semilla incluida).
- `debts`: saldo original, saldo actual, tasa EA en puntos básicos, cuota mínima, día de pago y borrado lógico.
- `transactions`: libro unificado de `expense`, `income` y `debt_payment`, con borrado lógico.

Los pagos a deuda son transacciones. Al eliminar un pago, el saldo de la deuda se restaura automáticamente.

## Requisitos

- Node.js 20 o superior.
- npm.
- Un teléfono Android con [Expo Go](https://expo.dev/go) instalado.
- No se necesita Android Studio para desarrollar el MVP.

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

> EAS tiene un plan gratuito con límite de builds. Revisa las condiciones vigentes antes de usarlo.

## Privacidad

- Esta versión no tiene cuentas, analítica, publicidad ni servidores propios.
- La información se guarda en la base SQLite del teléfono.
- El respaldo JSON y el CSV solo se comparten cuando el usuario lo decide.
- No se solicitan credenciales bancarias ni números completos de tarjetas.
- La app es una herramienta educativa; no es asesoría financiera regulada.

## Limitaciones actuales

- Solo Android está validado como objetivo principal; iOS requiere revisión.
- No existe todavía importación de respaldos, sincronización, espacios compartidos ni widgets.
- La simulación usa tasas constantes y pagos puntuales; no modela comisiones, seguros, moras ni cambios de tasa.
- La base local no está cifrada. Se recomienda proteger el teléfono con PIN o biometría.
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
