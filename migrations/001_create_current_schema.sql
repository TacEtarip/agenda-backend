-- Migration: create current Agenda Pro schema.
-- Target: PostgreSQL 16
--
-- This migration mirrors the current TypeORM/PostgreSQL schema and adds
-- practical indexes for the query patterns used by the backend services.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

DO $$
BEGIN
  CREATE TYPE public.client_stage_enum AS ENUM (
    'FIRST_CONTACT',
    'FOLLOW_UP',
    'CLOSED_SALE',
    'MAINTENANCE',
    'POST_SALE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.appointments_status_enum AS ENUM (
    'scheduled',
    'pending_payment',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.client_products_status_enum AS ENUM (
    'OFFERED',
    'INTERESTED',
    'SOLD',
    'REJECTED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  name varchar NOT NULL,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stages (
  code public.client_stage_enum PRIMARY KEY,
  name varchar NOT NULL,
  sort_order integer NOT NULL,
  CONSTRAINT uq_stages_name UNIQUE (name),
  CONSTRAINT uq_stages_sort_order UNIQUE (sort_order)
);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  company_id uuid,
  email varchar NOT NULL,
  password_hash varchar,
  google_id varchar,
  microsoft_id varchar,
  first_name varchar NOT NULL,
  last_name varchar NOT NULL,
  integration_provider varchar NOT NULL DEFAULT 'none',
  sync_calendar boolean NOT NULL DEFAULT true,
  sync_contacts boolean NOT NULL DEFAULT false,
  send_daily_digest boolean NOT NULL DEFAULT true,
  payment_enabled boolean NOT NULL DEFAULT false,
  payment_gateway_key varchar,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_google_id UNIQUE (google_id),
  CONSTRAINT uq_users_microsoft_id UNIQUE (microsoft_id),
  CONSTRAINT fk_users_company
    FOREIGN KEY (company_id) REFERENCES public.companies(id)
);

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  company_id uuid,
  first_name varchar NOT NULL,
  last_name varchar NOT NULL,
  email varchar,
  phone_number varchar NOT NULL,
  stage public.client_stage_enum NOT NULL DEFAULT 'FIRST_CONTACT',
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  CONSTRAINT fk_clients_company
    FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT fk_clients_user
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_clients_stage
    FOREIGN KEY (stage) REFERENCES public.stages(code)
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  company_id uuid,
  name varchar NOT NULL,
  description text,
  price numeric,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  CONSTRAINT fk_products_company
    FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT fk_products_user
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  company_id uuid,
  content text NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  client_id uuid NOT NULL,
  CONSTRAINT fk_notes_company
    FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT fk_notes_client
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  company_id uuid,
  title varchar NOT NULL,
  description text,
  start_time timestamp without time zone NOT NULL,
  end_time timestamp without time zone NOT NULL,
  external_event_id varchar,
  meeting_url varchar,
  status public.appointments_status_enum NOT NULL DEFAULT 'scheduled',
  payment_id varchar,
  payment_url varchar,
  client_id uuid NOT NULL,
  user_id uuid NOT NULL,
  CONSTRAINT fk_appointments_company
    FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT fk_appointments_client
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_user
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT chk_appointments_time_range CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS public.message_templates (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  company_id uuid,
  user_id uuid NOT NULL,
  stage public.client_stage_enum NOT NULL,
  message_body text NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT fk_message_templates_company
    FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT fk_message_templates_stage
    FOREIGN KEY (stage) REFERENCES public.stages(code)
);

CREATE TABLE IF NOT EXISTS public.client_products (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  status public.client_products_status_enum NOT NULL DEFAULT 'OFFERED',
  notes text,
  offered_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  client_id uuid NOT NULL,
  product_id uuid NOT NULL,
  CONSTRAINT fk_client_products_client
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_client_products_product
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  company_id uuid,
  file_name varchar NOT NULL,
  file_type varchar,
  file_url varchar NOT NULL,
  uploaded_at timestamp without time zone NOT NULL DEFAULT now(),
  client_id uuid NOT NULL,
  note_id uuid,
  CONSTRAINT fk_attachments_company
    FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT fk_attachments_client
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_attachments_note
    FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_users_company_id
  ON public.users(company_id);

CREATE INDEX IF NOT EXISTS idx_clients_company_stage
  ON public.clients(company_id, stage);

CREATE INDEX IF NOT EXISTS idx_clients_user_id
  ON public.clients(user_id);

CREATE INDEX IF NOT EXISTS idx_products_company_id
  ON public.products(company_id);

CREATE INDEX IF NOT EXISTS idx_products_user_id
  ON public.products(user_id);

CREATE INDEX IF NOT EXISTS idx_notes_client_created_at
  ON public.notes(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notes_company_id
  ON public.notes(company_id);

CREATE INDEX IF NOT EXISTS idx_appointments_company_start_time
  ON public.appointments(company_id, start_time);

CREATE INDEX IF NOT EXISTS idx_appointments_client_start_time
  ON public.appointments(client_id, start_time);

CREATE INDEX IF NOT EXISTS idx_appointments_user_start_time
  ON public.appointments(user_id, start_time);

CREATE INDEX IF NOT EXISTS idx_message_templates_company_stage
  ON public.message_templates(company_id, stage);

CREATE INDEX IF NOT EXISTS idx_message_templates_user_id
  ON public.message_templates(user_id);

CREATE INDEX IF NOT EXISTS idx_client_products_client_id
  ON public.client_products(client_id);

CREATE INDEX IF NOT EXISTS idx_client_products_product_id
  ON public.client_products(product_id);

CREATE INDEX IF NOT EXISTS idx_attachments_client_uploaded_at
  ON public.attachments(client_id, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_attachments_note_id
  ON public.attachments(note_id);

INSERT INTO public.stages (code, name, sort_order)
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

COMMIT;
