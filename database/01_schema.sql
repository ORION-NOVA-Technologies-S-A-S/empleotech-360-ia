-- =====================================================================
-- EmpleoTech 360 IA · Orion Nova Technologies
-- Esquema PostgreSQL (compatible con Supabase y PostgREST)
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- Usuarios y perfiles ----------
create table if not exists usuarios (
  id               uuid primary key default gen_random_uuid(),
  email            text not null unique,
  nombre           text not null,
  password_hash    text not null,
  rol              text not null default 'joven' check (rol in ('joven','empresa','admin')),
  municipio        text,
  departamento     text,
  intentos_fallidos int not null default 0,
  bloqueado_hasta  timestamptz,
  creado_en        timestamptz not null default now()
);

create table if not exists perfiles (
  usuario_id        uuid primary key references usuarios(id) on delete cascade,
  nivel_educativo   text,
  area_interes      text,
  experiencia_meses int default 0,
  competencias      text[] not null default '{}',
  resumen           text,
  actualizado_en    timestamptz not null default now()
);

-- ---------- Datos del mercado laboral (DANE / GEIH) ----------
create table if not exists indicadores_dane (
  id          serial primary key,
  periodo     date not null,
  territorio  text not null,              -- 'Nacional', 'Huila', 'Neiva', ...
  grupo       text not null,              -- 'Total', 'Jóvenes 15-28', 'Mujeres jóvenes', ...
  indicador   text not null,              -- 'TD' (desempleo), 'TO' (ocupación), 'TGP', 'Informalidad', 'NiNi'
  valor       numeric not null,
  unidad      text not null default '%',
  fuente      text not null default 'DANE - GEIH',
  es_ejemplo  boolean not null default true,
  unique (periodo, territorio, grupo, indicador)
);

create table if not exists competencias_demandadas (
  id          serial primary key,
  competencia text not null,
  sector      text not null,
  territorio  text not null default 'Nacional',
  demanda     numeric not null check (demanda between 0 and 100),  -- índice relativo
  tendencia   numeric not null default 0,                          -- variación % vs periodo anterior
  fuente      text not null default 'Ejemplo',
  es_ejemplo  boolean not null default true,
  unique (competencia, sector, territorio)
);

create table if not exists cursos (
  id          serial primary key,
  titulo      text not null,
  competencia text not null,
  nivel       text not null default 'básico' check (nivel in ('básico','intermedio','avanzado')),
  horas       int  not null default 20,
  modalidad   text not null default 'virtual' check (modalidad in ('virtual','presencial','vr','mixta')),
  proveedor   text not null,
  url         text,
  gratuito    boolean not null default true
);

create table if not exists vacantes (
  id           serial primary key,
  titulo       text not null,
  empresa      text not null,
  territorio   text not null,
  sector       text not null,
  competencias text[] not null default '{}',
  salario_min  numeric,
  salario_max  numeric,
  modalidad    text default 'presencial',
  url          text,
  publicada_en date default current_date,
  activa       boolean not null default true,
  es_ejemplo   boolean not null default true
);

-- ---------- Progreso del joven ----------
create table if not exists evaluaciones (
  id          bigserial primary key,
  usuario_id  uuid references usuarios(id) on delete cascade,
  competencia text not null,
  puntaje     numeric not null check (puntaje between 0 and 100),
  creado_en   timestamptz not null default now()
);

create table if not exists rutas_aprendizaje (
  id          bigserial primary key,
  usuario_id  uuid references usuarios(id) on delete cascade,
  competencia text not null,
  curso_id    int references cursos(id),
  estado      text not null default 'pendiente' check (estado in ('pendiente','en_curso','completado')),
  progreso    int  not null default 0 check (progreso between 0 and 100),
  creado_en   timestamptz not null default now()
);

create table if not exists conversaciones (
  id          bigserial primary key,
  usuario_id  uuid references usuarios(id) on delete cascade,
  agente      text not null,
  rol         text not null check (rol in ('usuario','agente')),
  contenido   text not null,
  creado_en   timestamptz not null default now()
);

-- ---------- Realidad virtual ----------
create table if not exists vr_sesiones (
  id           bigserial primary key,
  usuario_id   uuid references usuarios(id) on delete cascade,
  escenario    text not null,
  puntaje      numeric not null default 0,
  duracion_seg int not null default 0,
  creado_en    timestamptz not null default now()
);

-- ---------- IoT (laboratorios, kioscos, asistencia) ----------
create table if not exists iot_dispositivos (
  id           text primary key,
  nombre       text not null,
  tipo         text not null,          -- 'kiosco', 'sensor_aula', 'lector_asistencia', 'kit_robotica'
  sede         text not null,
  api_key_hash text not null,
  activo       boolean not null default true,
  creado_en    timestamptz not null default now()
);

create table if not exists iot_lecturas (
  id             bigserial primary key,
  dispositivo_id text not null references iot_dispositivos(id) on delete cascade,
  metrica        text not null,
  valor          numeric not null,
  registrado_en  timestamptz not null default now()
);
create index if not exists idx_iot_lecturas_disp on iot_lecturas (dispositivo_id, registrado_en desc);

-- ---------- ORI SECURITY: auditoría ----------
create table if not exists auditoria_seguridad (
  id          bigserial primary key,
  usuario_id  uuid,
  evento      text not null,
  severidad   text not null default 'info' check (severidad in ('info','baja','media','alta','critica')),
  detalle     jsonb not null default '{}',
  ip          text,
  creado_en   timestamptz not null default now()
);
create index if not exists idx_auditoria_fecha on auditoria_seguridad (creado_en desc);

-- ---------- Vistas de analítica ----------
create or replace view v_brechas_territorio as
select territorio, sector, competencia, demanda, tendencia,
       rank() over (partition by territorio order by demanda desc) as posicion
from competencias_demandadas;

-- ---------- Rol de solo lectura para PostgREST (catálogos públicos) ----------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'web_anon') then
    create role web_anon nologin;
  end if;
end $$;
grant usage on schema public to web_anon;
grant select on indicadores_dane, competencias_demandadas, cursos, vacantes, v_brechas_territorio to web_anon;
