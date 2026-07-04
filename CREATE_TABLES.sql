-- Ejecutar en Neon Console (SQL Editor)
-- NO usar prisma db push — las tablas se crean manualmente para no tocar las tablas existentes

CREATE TABLE IF NOT EXISTS pedidos_produccion (
  id                SERIAL PRIMARY KEY,
  taller            VARCHAR(5)   NOT NULL,
  fecha_confirmacion VARCHAR(10) NOT NULL,
  nombre_cliente    VARCHAR(255) NOT NULL,
  titulo_pedido     VARCHAR(255) NOT NULL,
  descripcion_pieza TEXT,
  fecha_compromiso  VARCHAR(10),
  asesora           VARCHAR(100) NOT NULL,
  etapa             INTEGER      NOT NULL DEFAULT 1,
  comentarios       TEXT,
  activo            BOOLEAN      NOT NULL DEFAULT true,
  creado_en         TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revisiones_produccion (
  id           SERIAL PRIMARY KEY,
  pedido_id    INTEGER      NOT NULL REFERENCES pedidos_produccion(id),
  semana_lunes VARCHAR(10)  NOT NULL,
  asesora      VARCHAR(100) NOT NULL,
  etapa        INTEGER,
  comentarios  TEXT,
  creado_en    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_produccion_asesora ON pedidos_produccion(asesora);
CREATE INDEX IF NOT EXISTS idx_pedidos_produccion_activo  ON pedidos_produccion(activo);
CREATE INDEX IF NOT EXISTS idx_revisiones_semana          ON revisiones_produccion(semana_lunes);
CREATE INDEX IF NOT EXISTS idx_revisiones_pedido          ON revisiones_produccion(pedido_id);
