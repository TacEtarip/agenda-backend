-- Seed data for local testing.
-- Login user: demo@agendapro.test
-- Password: password123
--
-- Run with:
-- docker exec -i agenda_postgres psql -U postgres -d agenda_db < backend/seed-test-data.sql

BEGIN;

INSERT INTO stages (code, name, sort_order)
VALUES
  ('FIRST_CONTACT', 'Primer contacto', 1),
  ('FOLLOW_UP', 'Seguimiento', 2),
  ('POST_SALE', 'Postventa', 3),
  ('MAINTENANCE', 'Mantenimiento', 4),
  ('CLOSED_SALE', 'Venta cerrada', 5)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

INSERT INTO companies (id, name, "createdAt", "updatedAt")
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Agenda Pro Demo', now(), now())
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  "updatedAt" = now();

INSERT INTO users (
  id,
  company_id,
  email,
  password_hash,
  first_name,
  last_name,
  integration_provider,
  sync_calendar,
  sync_contacts,
  send_daily_digest,
  payment_enabled,
  payment_gateway_key
)
VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'demo@agendapro.test',
    '$2b$10$/.7f5cZDSl9ayCf01WbOBOc4rMPhLdDgHGe02bWYH/WzLH1ukkRie',
    'Demo',
    'Admin',
    'none',
    true,
    false,
    true,
    true,
    'test_gateway_key'
  )
ON CONFLICT (id) DO UPDATE
SET
  company_id = EXCLUDED.company_id,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  integration_provider = EXCLUDED.integration_provider,
  sync_calendar = EXCLUDED.sync_calendar,
  sync_contacts = EXCLUDED.sync_contacts,
  send_daily_digest = EXCLUDED.send_daily_digest,
  payment_enabled = EXCLUDED.payment_enabled,
  payment_gateway_key = EXCLUDED.payment_gateway_key;

INSERT INTO products (id, company_id, user_id, name, description, price)
VALUES
  (
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Consulta inicial',
    'Sesion de diagnostico y plan de trabajo.',
    120.00
  ),
  (
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Paquete mensual',
    'Cuatro sesiones de seguimiento durante el mes.',
    420.00
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Sesion express',
    'Atencion puntual de 30 minutos.',
    75.00
  )
ON CONFLICT (id) DO UPDATE
SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price;

INSERT INTO clients (
  id,
  company_id,
  user_id,
  first_name,
  last_name,
  email,
  phone_number,
  stage
)
VALUES
  (
    '44444444-4444-4444-4444-444444444441',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Lucia',
    'Torres',
    'lucia.torres@example.test',
    '+51999111222',
    'FIRST_CONTACT'
  ),
  (
    '44444444-4444-4444-4444-444444444442',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Carlos',
    'Mendoza',
    'carlos.mendoza@example.test',
    '+51999222333',
    'FOLLOW_UP'
  ),
  (
    '44444444-4444-4444-4444-444444444443',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Mariana',
    'Vega',
    'mariana.vega@example.test',
    '+51999333444',
    'CLOSED_SALE'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Jorge',
    'Salas',
    'jorge.salas@example.test',
    '+51999444555',
    'MAINTENANCE'
  )
ON CONFLICT (id) DO UPDATE
SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone_number = EXCLUDED.phone_number,
  stage = EXCLUDED.stage;

INSERT INTO message_templates (id, company_id, user_id, stage, message_body)
VALUES
  (
    '55555555-5555-5555-5555-555555555551',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'FIRST_CONTACT',
    'Hola {{name}}, gracias por contactarnos. Podemos coordinar una primera cita esta semana.'
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'FOLLOW_UP',
    'Hola {{name}}, te escribo para hacer seguimiento a tu consulta. Quedo atento a tus comentarios.'
  ),
  (
    '55555555-5555-5555-5555-555555555553',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'CLOSED_SALE',
    'Hola {{name}}, tu servicio quedo confirmado. Te compartiremos los siguientes pasos.'
  )
ON CONFLICT (id) DO UPDATE
SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  stage = EXCLUDED.stage,
  message_body = EXCLUDED.message_body,
  updated_at = now();

INSERT INTO notes (id, company_id, client_id, content)
VALUES
  (
    '66666666-6666-6666-6666-666666666661',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    'Cliente interesada en una primera evaluacion. Prefiere horarios por la tarde.'
  ),
  (
    '66666666-6666-6666-6666-666666666662',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444442',
    'Pidio informacion del paquete mensual. Enviar propuesta y enlace de pago.'
  ),
  (
    '66666666-6666-6666-6666-666666666663',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444443',
    'Servicio confirmado. Programar llamada de bienvenida.'
  )
ON CONFLICT (id) DO UPDATE
SET
  company_id = EXCLUDED.company_id,
  client_id = EXCLUDED.client_id,
  content = EXCLUDED.content,
  updated_at = now();

INSERT INTO appointments (
  id,
  company_id,
  user_id,
  client_id,
  title,
  description,
  start_time,
  end_time,
  status,
  payment_id,
  payment_url
)
VALUES
  (
    '77777777-7777-7777-7777-777777777771',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444441',
    'Consulta inicial - Lucia Torres',
    'Primera reunion para entender necesidades y explicar el servicio.',
    now() + interval '1 day',
    now() + interval '1 day 1 hour',
    'scheduled',
    null,
    null
  ),
  (
    '77777777-7777-7777-7777-777777777772',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444442',
    'Seguimiento propuesta - Carlos Mendoza',
    'Resolver dudas sobre el paquete mensual.',
    now() + interval '2 days',
    now() + interval '2 days 45 minutes',
    'pending_payment',
    'pay_test_seed_001',
    'https://checkout.sandbox.pasarela.pe/pay/pay_test_seed_001'
  ),
  (
    '77777777-7777-7777-7777-777777777773',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444443',
    'Onboarding - Mariana Vega',
    'Llamada de bienvenida y definicion de proximos hitos.',
    now() - interval '1 day',
    now() - interval '23 hours',
    'completed',
    'pay_test_seed_002',
    'https://checkout.sandbox.pasarela.pe/pay/pay_test_seed_002'
  )
ON CONFLICT (id) DO UPDATE
SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  client_id = EXCLUDED.client_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  status = EXCLUDED.status,
  payment_id = EXCLUDED.payment_id,
  payment_url = EXCLUDED.payment_url;

INSERT INTO client_products (id, client_id, product_id, status, notes)
VALUES
  (
    '88888888-8888-8888-8888-888888888881',
    '44444444-4444-4444-4444-444444444441',
    '33333333-3333-3333-3333-333333333331',
    'OFFERED',
    'Enviar recordatorio si no confirma en 24 horas.'
  ),
  (
    '88888888-8888-8888-8888-888888888882',
    '44444444-4444-4444-4444-444444444442',
    '33333333-3333-3333-3333-333333333332',
    'INTERESTED',
    'Interesado en pagar al cierre de la semana.'
  ),
  (
    '88888888-8888-8888-8888-888888888883',
    '44444444-4444-4444-4444-444444444443',
    '33333333-3333-3333-3333-333333333332',
    'SOLD',
    'Paquete vendido. Coordinar calendario mensual.'
  ),
  (
    '88888888-8888-8888-8888-888888888884',
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    'REJECTED',
    'No requiere el servicio express por ahora.'
  )
ON CONFLICT (id) DO UPDATE
SET
  client_id = EXCLUDED.client_id,
  product_id = EXCLUDED.product_id,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO attachments (
  id,
  company_id,
  client_id,
  note_id,
  file_name,
  file_type,
  file_url
)
VALUES
  (
    '99999999-9999-9999-9999-999999999991',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    '66666666-6666-6666-6666-666666666661',
    'brief-lucia.pdf',
    'PDF',
    'https://example.test/files/brief-lucia.pdf'
  ),
  (
    '99999999-9999-9999-9999-999999999992',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444442',
    null,
    'propuesta-carlos.pdf',
    'PDF',
    'https://example.test/files/propuesta-carlos.pdf'
  )
ON CONFLICT (id) DO UPDATE
SET
  company_id = EXCLUDED.company_id,
  client_id = EXCLUDED.client_id,
  note_id = EXCLUDED.note_id,
  file_name = EXCLUDED.file_name,
  file_type = EXCLUDED.file_type,
  file_url = EXCLUDED.file_url;

COMMIT;
