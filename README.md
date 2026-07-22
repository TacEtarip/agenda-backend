# TacEtarip Backend

API REST de TacEtarip para administrar empresas, usuarios, clientes, productos, ventas, citas, pagos e integraciones externas.

## Tecnologías

- NestJS 11 y TypeScript 5.7.
- TypeORM y PostgreSQL.
- Autenticación JWT con contraseñas protegidas mediante bcrypt.
- Jest y Supertest para pruebas unitarias y E2E.
- Integraciones con Google Calendar, WhatsApp Web y pagos directos por Yape.

## Arquitectura

El código se divide por responsabilidad:

```text
src/
├── domain/          Entidades, repositorios y reglas del negocio
├── application/     Casos de uso, servicios y DTO
└── infrastructure/  HTTP, persistencia, proveedores y configuración
```

Las operaciones se aíslan por empresa. Los controladores obtienen la empresa autenticada del JWT y los repositorios aplican ese alcance al consultar o modificar información.

## Puesta en marcha local

Requisitos: Node.js, npm, Docker y Docker Compose.

```bash
npm install
copy .env.example .env
```

Desde la raíz del workspace, inicia PostgreSQL:

```bash
docker compose up -d
```

Después aplica las migraciones e inicia NestJS:

```bash
npm run migration:run
npm run start:dev
```

La API queda disponible por defecto en `http://localhost:3000`. El origen del frontend local debe estar permitido en la configuración CORS.

## Variables de entorno

Parte de `.env.example` y completa, como mínimo, la conexión a PostgreSQL y los secretos de autenticación. Para preparar credenciales Culqi por negocio define `PAYMENT_CREDENTIAL_ENCRYPTION_KEY` con una clave base64 de 32 bytes. Para Google Calendar también se necesitan el cliente OAuth, el secreto OAuth, la URL de callback, el secreto de estado y la clave que cifra los tokens almacenados.

No guardes archivos `.env`, credenciales OAuth, tokens, sesiones de WhatsApp ni secretos de proveedores en Git. La preparación de Google Cloud, sus límites y consideraciones de costo están documentados en [Seguridad y costos de Google](../README-SEGURIDAD-COSTOS-GOOGLE.md).

## Migraciones

```bash
npm run migration:run
npm run migration:revert
npm run migration:show
```

En producción se debe mantener `synchronize: false` y desplegar las migraciones antes de iniciar nuevas versiones de la API.

La migración `1784400000000-EnforceUserCompany` hace obligatorio `users.company_id`. Si encuentra usuarios huérfanos se detiene sin borrarlos: antes del despliegue se debe asignar cada registro a una empresa válida o retirarlo mediante un proceso auditado.

## Módulos y rutas principales

| Área | Ruta base | Responsabilidad |
| --- | --- | --- |
| Autenticación | `/auth` | Registro, login y sesión |
| Clientes | `/clients` | Perfil e historial del cliente |
| Productos | `/products` | Catálogo de productos y servicios |
| Ventas | `/sales` | Venta, cantidades, precios y totales |
| Citas | `/appointments` | Agenda, disponibilidad y estados |
| Pagos | `/payments` | Pagos manuales, Yape y enlaces simulados |
| Google | `/integrations/google` | OAuth, Calendar y webhooks |
| WhatsApp | `/whatsapp` | Estado y sesión de WhatsApp Web |

## Pagos por Yape directo

Yape directo es la modalidad prioritaria y no requiere credenciales de una pasarela. Cada empresa mantiene su propio número, titular, estado de activación e imagen QR:

```text
GET   /payments/configuration/yape
PATCH /payments/configuration/yape
POST  /payments/yape-requests
POST  /payments/:id/confirm-yape
```

Una solicitud Yape se crea como `PENDING`. La API devuelve el importe y los datos configurados para que el frontend construya las instrucciones de pago. Como una cuenta personal de Yape no expone una confirmación automática a TacEtarip, el usuario debe verificar el abono en Yape y confirmarlo manualmente; solo entonces el pago cambia a `PAID`.

La imagen QR se almacena temporalmente como una URL de datos en PostgreSQL. El backend comprueba la firma real de PNG/JPEG/WebP, limita la entrada decodificada a 256 KiB y 2048 × 2048 píxeles, rechaza imágenes animadas y la reencodifica como PNG antes de persistirla. Debe migrarse a almacenamiento de objetos, como Amazon S3, antes de escalar el sistema.

## Límites locales de WhatsApp Web

Cada sesión de `whatsapp-web.js` abre un cliente Chromium. `WHATSAPP_MAX_CLIENTS` limita los clientes simultáneos por instancia; `WHATSAPP_QR_TIMEOUT_MS` libera sesiones que no escanean el QR y `WHATSAPP_IDLE_TIMEOUT_MS` destruye sesiones inactivas. Estos controles protegen el proceso local, pero al desplegar varias instancias en AWS deberán complementarse con enrutamiento estable de sesión, una cuota distribuida y protección perimetral en WAF/API Gateway.

`POST /payments/links` todavía genera un enlace simulado. No representa una transacción real ni debe habilitarse como Culqi en producción. La futura integración con Culqi deberá validar la firma y el estado de sus webhooks, ser idempotente y conservar la referencia del proveedor.

## Google Calendar

La integración implementa OAuth por empresa, sincronización de citas Agenda → Google y recepción de cambios Google → Agenda mediante webhooks. La aplicación conserva el horario local si un cambio externo provoca un conflicto y deja visible el error de sincronización para que el usuario lo resuelva.

Para que Google pueda llamar al webhook durante desarrollo se necesita una URL HTTPS pública. Consulta el [README principal](../README.md) para el flujo completo y las variables requeridas.

## Pruebas y compilación

```bash
npm run build
npm test -- --runInBand
npm run test:e2e
```

La referencia actual es de 65 pruebas unitarias y 2 pruebas E2E. El flujo comercial cubre registro → login → cliente → producto → venta con cantidad/precio → pago.

## Lista de control para producción

- Ejecutar migraciones con `synchronize: false`.
- Usar secretos largos, únicos y gestionados fuera del repositorio.
- Exponer la API únicamente mediante HTTPS y restringir CORS.
- Proteger los endpoints con JWT y mantener el aislamiento por empresa.
- Configurar logs, monitoreo, copias de seguridad y rotación de secretos.
- Mover QR y adjuntos a almacenamiento de objetos.
- Sustituir el proveedor de enlaces simulado por la integración oficial de Culqi antes de aceptar pagos automáticos.
