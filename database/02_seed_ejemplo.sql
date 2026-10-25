-- =====================================================================
-- DATOS DE EJEMPLO (es_ejemplo = true)
-- Sirven para probar la plataforma. NO son cifras oficiales del DANE.
-- Reemplácelos con el importador: backend/scripts/importar_dane.py
-- =====================================================================

insert into indicadores_dane (periodo, territorio, grupo, indicador, valor) values
  ('2026-06-01','Nacional','Total','TD', 9.5),
  ('2026-06-01','Nacional','Jóvenes 15-28','TD', 15.8),
  ('2026-06-01','Nacional','Mujeres jóvenes','TD', 19.9),
  ('2026-06-01','Nacional','Jóvenes 15-28','Informalidad', 58.0),
  ('2026-06-01','Nacional','Jóvenes 15-28','NiNi', 24.0),
  ('2026-06-01','Huila','Jóvenes 15-28','TD', 16.9),
  ('2026-06-01','Huila','Jóvenes 15-28','Informalidad', 66.0),
  ('2026-06-01','Neiva','Total','TD', 11.2),
  ('2026-06-01','Neiva','Jóvenes 15-28','TD', 18.1),
  ('2026-03-01','Neiva','Jóvenes 15-28','TD', 19.0),
  ('2025-12-01','Neiva','Jóvenes 15-28','TD', 18.6),
  ('2025-09-01','Neiva','Jóvenes 15-28','TD', 19.4)
on conflict do nothing;

insert into competencias_demandadas (competencia, sector, territorio, demanda, tendencia) values
  ('Programación Python','Tecnología','Nacional',92, 14),
  ('JavaScript / React','Tecnología','Nacional',88, 11),
  ('Análisis de datos','Tecnología','Nacional',90, 18),
  ('Ciberseguridad','Tecnología','Nacional',86, 21),
  ('Inteligencia artificial','Tecnología','Nacional',89, 35),
  ('IoT y electrónica','Industria 4.0','Nacional',70, 12),
  ('Inglés B1+','Transversal','Nacional',84, 6),
  ('Servicio al cliente','Comercio','Huila',80, 3),
  ('Marketing digital','Comercio','Huila',76, 9),
  ('Agroindustria del café','Agro','Huila',74, 5),
  ('Turismo y hotelería','Turismo','Huila',72, 8),
  ('Seguridad industrial (HSE)','Hidrocarburos','Huila',71, 2),
  ('Análisis de datos','Tecnología','Neiva',78, 15),
  ('Programación Python','Tecnología','Neiva',75, 13),
  ('Comunicación asertiva','Transversal','Nacional',82, 4),
  ('Trabajo en equipo','Transversal','Nacional',81, 3),
  ('Excel avanzado','Administración','Neiva',79, 2),
  ('Contabilidad básica','Administración','Neiva',65, 1)
on conflict do nothing;

insert into cursos (titulo, competencia, nivel, horas, modalidad, proveedor, url, gratuito) values
  ('Python desde cero','Programación Python','básico',40,'virtual','SENA Sofia Plus','https://oferta.senasofiaplus.edu.co',true),
  ('React para principiantes','JavaScript / React','básico',30,'virtual','Orion Nova Academy','https://academy.orionnovatechnologies.com',true),
  ('Análisis de datos con Python','Análisis de datos','intermedio',48,'virtual','Orion Nova Academy','https://academy.orionnovatechnologies.com',false),
  ('Fundamentos de ciberseguridad con ORI','Ciberseguridad','básico',24,'mixta','Orion Nova Academy','https://academy.orionnovatechnologies.com',true),
  ('IA aplicada a negocios','Inteligencia artificial','intermedio',36,'virtual','Orion Nova Academy','https://academy.orionnovatechnologies.com',false),
  ('Laboratorio IoT con sensores','IoT y electrónica','básico',30,'vr','Orion Nova Academy','https://academy.orionnovatechnologies.com',true),
  ('Inglés para el trabajo','Inglés B1+','intermedio',120,'virtual','SENA Sofia Plus','https://oferta.senasofiaplus.edu.co',true),
  ('Atención al cliente en VR','Servicio al cliente','básico',12,'vr','Orion Nova Academy','https://academy.orionnovatechnologies.com',true),
  ('Marketing digital práctico','Marketing digital','básico',40,'virtual','SENA Sofia Plus','https://oferta.senasofiaplus.edu.co',true),
  ('Excel avanzado','Excel avanzado','intermedio',30,'virtual','SENA Sofia Plus','https://oferta.senasofiaplus.edu.co',true),
  ('Comunicación asertiva','Comunicación asertiva','básico',10,'vr','Orion Nova Academy','https://academy.orionnovatechnologies.com',true),
  ('Seguridad industrial en VR','Seguridad industrial (HSE)','básico',20,'vr','Orion Nova Academy','https://academy.orionnovatechnologies.com',true)
on conflict do nothing;

insert into vacantes (titulo, empresa, territorio, sector, competencias, salario_min, salario_max, modalidad) values
  ('Desarrollador junior Python','Empresa ejemplo TIC','Neiva','Tecnología','{"Programación Python","Trabajo en equipo"}',2200000,3000000,'híbrido'),
  ('Auxiliar de análisis de datos','Empresa ejemplo Servicios','Neiva','Tecnología','{"Análisis de datos","Excel avanzado"}',1900000,2500000,'presencial'),
  ('Analista SOC nivel 1','Empresa ejemplo Seguridad','Remoto','Tecnología','{"Ciberseguridad","Inglés B1+"}',2800000,3800000,'remoto'),
  ('Asesor comercial digital','Empresa ejemplo Comercio','Huila','Comercio','{"Servicio al cliente","Marketing digital","Comunicación asertiva"}',1500000,2000000,'presencial'),
  ('Técnico IoT agroindustrial','Empresa ejemplo Agro','Huila','Agro','{"IoT y electrónica","Agroindustria del café"}',2000000,2700000,'presencial'),
  ('Recepcionista bilingüe','Hotel ejemplo','Neiva','Turismo','{"Turismo y hotelería","Inglés B1+","Servicio al cliente"}',1600000,2100000,'presencial')
on conflict do nothing;
