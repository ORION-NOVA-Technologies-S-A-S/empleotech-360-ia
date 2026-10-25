-- =====================================================================
-- ORI SECURITY para Supabase: Row Level Security (RLS)
-- Ejecutar SOLO en Supabase, después de 01_schema.sql y 02_seed_ejemplo.sql.
--
-- Modelo: el backend Python se conecta con la cadena del pooler de Supabase
-- (usuario postgres), que no está sujeto a RLS. La API pública de Supabase
-- (anon / authenticated) solo puede LEER los catálogos públicos.
-- Todo lo personal (usuarios, perfiles, conversaciones, IoT, auditoría)
-- queda cerrado para la API pública: nadie lo lee sin pasar por el backend.
-- =====================================================================

alter table usuarios                enable row level security;
alter table perfiles                enable row level security;
alter table evaluaciones            enable row level security;
alter table rutas_aprendizaje       enable row level security;
alter table conversaciones          enable row level security;
alter table vr_sesiones             enable row level security;
alter table iot_dispositivos        enable row level security;
alter table iot_lecturas            enable row level security;
alter table auditoria_seguridad     enable row level security;
alter table indicadores_dane        enable row level security;
alter table competencias_demandadas enable row level security;
alter table cursos                  enable row level security;
alter table vacantes                enable row level security;

-- Catálogos públicos: solo lectura
create policy "lectura publica indicadores" on indicadores_dane        for select to anon, authenticated using (true);
create policy "lectura publica demanda"     on competencias_demandadas for select to anon, authenticated using (true);
create policy "lectura publica cursos"      on cursos                  for select to anon, authenticated using (true);
create policy "lectura publica vacantes"    on vacantes                for select to anon, authenticated using (activa);

-- Tablas privadas: sin políticas = acceso denegado desde la API pública.
revoke all on usuarios, perfiles, evaluaciones, rutas_aprendizaje, conversaciones,
              vr_sesiones, iot_dispositivos, iot_lecturas, auditoria_seguridad
  from anon, authenticated;

-- La vista hereda permisos del dueño; se ejecuta con los del que consulta:
alter view v_brechas_territorio set (security_invoker = true);
