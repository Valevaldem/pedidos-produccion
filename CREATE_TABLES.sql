-- Ejecutar en Neon Console → SQL Editor
-- Tabla única para consultas semanales de producción

CREATE TABLE IF NOT EXISTS consultas_produccion (
  id                SERIAL PRIMARY KEY,
  semana_lunes      VARCHAR(10)  NOT NULL,
  taller            VARCHAR(5)   NOT NULL,
  fecha_confirmacion VARCHAR(10) NOT NULL,
  nombre_cliente    VARCHAR(255) NOT NULL,
  titulo_pedido     VARCHAR(255) NOT NULL,
  descripcion_pieza TEXT,
  fecha_compromiso  VARCHAR(10),
  asesora           VARCHAR(100) NOT NULL,
  etapa             INTEGER,
  comentarios       TEXT,
  creado_en         TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultas_semana  ON consultas_produccion(semana_lunes);
CREATE INDEX IF NOT EXISTS idx_consultas_asesora ON consultas_produccion(asesora);
