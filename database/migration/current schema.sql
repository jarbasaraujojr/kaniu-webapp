-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public._prisma_migrations (
  id character varying NOT NULL,
  checksum character varying NOT NULL,
  finished_at timestamp with time zone,
  migration_name character varying NOT NULL,
  logs text,
  rolled_back_at timestamp with time zone,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  applied_steps_count integer NOT NULL DEFAULT 0,
  CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.adoption_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL,
  adopter_id uuid NOT NULL,
  status character varying NOT NULL,
  information text,
  triggered_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT adoption_events_pkey PRIMARY KEY (id),
  CONSTRAINT adoption_events_animal_id_fkey FOREIGN KEY (animal_id) REFERENCES public.animals(id),
  CONSTRAINT adoption_events_adopter_id_fkey FOREIGN KEY (adopter_id) REFERENCES public.users(id),
  CONSTRAINT adoption_events_triggered_by_fkey FOREIGN KEY (triggered_by) REFERENCES public.users(id)
);
CREATE TABLE public.animal_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL,
  event_type character varying NOT NULL,
  description text NOT NULL,
  details jsonb,
  triggered_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT animal_events_pkey PRIMARY KEY (id),
  CONSTRAINT animal_events_animal_id_fkey FOREIGN KEY (animal_id) REFERENCES public.animals(id),
  CONSTRAINT animal_events_triggered_by_fkey FOREIGN KEY (triggered_by) REFERENCES public.users(id)
);
CREATE TABLE public.animal_medical_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL,
  record_type character varying NOT NULL,
  description text NOT NULL,
  veterinarian character varying,
  record_date date NOT NULL,
  next_due_date date,
  details jsonb,
  document_id uuid,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT animal_medical_records_pkey PRIMARY KEY (id),
  CONSTRAINT animal_medical_records_animal_id_fkey FOREIGN KEY (animal_id) REFERENCES public.animals(id),
  CONSTRAINT animal_medical_records_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
  CONSTRAINT animal_medical_records_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.animal_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL,
  image_url text NOT NULL,
  is_profile_pic boolean NOT NULL DEFAULT false,
  photo_order integer NOT NULL DEFAULT 0,
  uploaded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT animal_photos_pkey PRIMARY KEY (id),
  CONSTRAINT animal_photos_animal_id_fkey FOREIGN KEY (animal_id) REFERENCES public.animals(id),
  CONSTRAINT animal_photos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id)
);
CREATE TABLE public.animal_weights (
  id bigint NOT NULL DEFAULT nextval('animal_weights_id_seq'::regclass),
  animal_id uuid NOT NULL,
  value numeric NOT NULL,
  unit character varying NOT NULL DEFAULT 'kg'::character varying,
  recorded_by uuid NOT NULL,
  date_time timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes text,
  CONSTRAINT animal_weights_pkey PRIMARY KEY (id),
  CONSTRAINT animal_weights_animal_id_fkey FOREIGN KEY (animal_id) REFERENCES public.animals(id),
  CONSTRAINT animal_weights_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(id)
);
CREATE TABLE public.animals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  shelter_id uuid NOT NULL,
  species_id integer,
  breed_id integer,
  gender character varying,
  size character varying,
  birth_date date,
  microchip_id character varying,
  castrated boolean,
  health_status jsonb,
  behavior jsonb,
  appearance jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  updated_by uuid,
  status_id integer,
  deleted_at timestamp with time zone,
  CONSTRAINT animals_pkey PRIMARY KEY (id),
  CONSTRAINT animals_shelter_id_fkey FOREIGN KEY (shelter_id) REFERENCES public.shelters(id),
  CONSTRAINT animals_species_id_fkey FOREIGN KEY (species_id) REFERENCES public.catalogs(id),
  CONSTRAINT animals_breed_id_fkey FOREIGN KEY (breed_id) REFERENCES public.catalogs(id),
  CONSTRAINT animals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT animals_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id),
  CONSTRAINT animals_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.catalogs(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action character varying NOT NULL,
  table_name character varying NOT NULL,
  record_id uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.catalogs (
  id integer NOT NULL DEFAULT nextval('catalogs_id_seq'::regclass),
  category character varying NOT NULL,
  name character varying NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT catalogs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL,
  document_type character varying NOT NULL,
  file_url text NOT NULL,
  file_name character varying,
  mime_type character varying,
  description text,
  issued_date date,
  data jsonb,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_animal_id_fkey FOREIGN KEY (animal_id) REFERENCES public.animals(id),
  CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id)
);
CREATE TABLE public.favorites (
  user_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT favorites_pkey PRIMARY KEY (user_id, animal_id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT favorites_animal_id_fkey FOREIGN KEY (animal_id) REFERENCES public.animals(id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  animal_id uuid,
  reporter_id uuid NOT NULL,
  report_type character varying NOT NULL,
  location jsonb NOT NULL,
  description text NOT NULL,
  matched_report_id uuid,
  matched_by uuid,
  matched_at timestamp with time zone,
  resolved boolean NOT NULL DEFAULT false,
  resolved_date timestamp with time zone,
  resolution_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_animal_id_fkey FOREIGN KEY (animal_id) REFERENCES public.animals(id),
  CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id),
  CONSTRAINT reports_matched_report_id_fkey FOREIGN KEY (matched_report_id) REFERENCES public.reports(id),
  CONSTRAINT reports_matched_by_fkey FOREIGN KEY (matched_by) REFERENCES public.users(id)
);
CREATE TABLE public.roles (
  id integer NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.shelters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  owner_id uuid NOT NULL,
  location jsonb,
  phone character varying,
  email character varying,
  website character varying,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  CONSTRAINT shelters_pkey PRIMARY KEY (id),
  CONSTRAINT shelters_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  email character varying NOT NULL,
  password character varying NOT NULL,
  phone character varying,
  address jsonb,
  document_id character varying,
  role_id integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);