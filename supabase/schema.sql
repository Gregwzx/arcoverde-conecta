-- ============================================================
-- Arcoverde Conecta — Schema do Banco de Dados (Supabase)
-- Execute este script no SQL Editor do Supabase.
-- Idempotente: pode ser executado em bancos novos ou já existentes.
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: setores
-- ============================================================
CREATE TABLE IF NOT EXISTS setores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  responsavel_id UUID,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABELA: profiles (vinculada a auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'servidor' CHECK (role IN ('admin', 'gestor', 'servidor')),
  setor_id UUID REFERENCES setores(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- FK: setor.responsavel → profiles (Criada com verificação idempotente para evitar erro 42710)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_setores_responsavel'
  ) THEN
    ALTER TABLE setores
      ADD CONSTRAINT fk_setores_responsavel
      FOREIGN KEY (responsavel_id)
      REFERENCES profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- TABELA: demandas
-- ============================================================
CREATE TABLE IF NOT EXISTS demandas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocolo TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN (
    'iluminacao_publica', 'pavimentacao', 'limpeza_urbana',
    'drenagem', 'conservacao_espacos'
  )),
  status TEXT NOT NULL DEFAULT 'nova' CHECK (status IN (
    'nova', 'em_analise', 'encaminhada', 'em_andamento', 'concluida', 'cancelada'
  )),
  prioridade_pontuacao INTEGER DEFAULT 0 CHECK (prioridade_pontuacao BETWEEN 0 AND 100),
  prioridade_faixa TEXT DEFAULT 'baixa' CHECK (prioridade_faixa IN (
    'critica', 'alta', 'media', 'baixa'
  )),
  endereco TEXT NOT NULL,
  bairro TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  nome_solicitante TEXT,
  telefone_solicitante TEXT,
  email_solicitante TEXT,
  setor_id UUID REFERENCES setores(id) ON DELETE SET NULL,
  responsavel_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  prazo DATE,
  risco_seguranca INTEGER DEFAULT 0 CHECK (risco_seguranca BETWEEN 0 AND 10),
  impacto_populacao INTEGER DEFAULT 0 CHECK (impacto_populacao BETWEEN 0 AND 10),
  agravamento INTEGER DEFAULT 0 CHECK (agravamento BETWEEN 0 AND 10),
  is_demo BOOLEAN DEFAULT false,
  publica BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_demandas_protocolo ON demandas(protocolo);
CREATE INDEX IF NOT EXISTS idx_demandas_status ON demandas(status);
CREATE INDEX IF NOT EXISTS idx_demandas_categoria ON demandas(categoria);
CREATE INDEX IF NOT EXISTS idx_demandas_bairro ON demandas(bairro);
CREATE INDEX IF NOT EXISTS idx_demandas_setor ON demandas(setor_id);
CREATE INDEX IF NOT EXISTS idx_demandas_prioridade ON demandas(prioridade_pontuacao DESC);
CREATE INDEX IF NOT EXISTS idx_demandas_created ON demandas(created_at DESC);

-- ============================================================
-- TABELA: historico_alteracoes
-- ============================================================
CREATE TABLE IF NOT EXISTS historico_alteracoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demanda_id UUID NOT NULL REFERENCES demandas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'status', 'comentario', 'atribuicao', 'edicao', 'prioridade'
  )),
  descricao TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  interno BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_historico_demanda ON historico_alteracoes(demanda_id, created_at DESC);

-- ============================================================
-- TABELA: anexos
-- ============================================================
CREATE TABLE IF NOT EXISTS anexos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demanda_id UUID NOT NULL REFERENCES demandas(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tamanho INTEGER DEFAULT 0,
  usuario_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABELA: configuracoes (registro único com pesos de priorização)
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracoes (
  id TEXT PRIMARY KEY DEFAULT 'default',
  dados JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABELA: protocolos_controle (controle atômico de sequencial por ano)
-- ============================================================
CREATE TABLE IF NOT EXISTS protocolos_controle (
  ano TEXT PRIMARY KEY,
  ultimo_seq INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- FUNÇÕES AUXILIARES E DE SEGURANÇA
-- ============================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função segura para verificar Admin (Sem recursão infinita)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM profiles WHERE id = auth.uid() AND ativo = true),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Gerar protocolo único atômico e concorrente: ARC-ANO-SEQUENCIAL
CREATE OR REPLACE FUNCTION gerar_protocolo()
RETURNS TEXT AS $$
DECLARE
  v_ano TEXT;
  v_seq INTEGER;
BEGIN
  v_ano := EXTRACT(YEAR FROM now())::TEXT;

  INSERT INTO protocolos_controle (ano, ultimo_seq)
  VALUES (
    v_ano,
    COALESCE((
      SELECT MAX(CAST(SPLIT_PART(protocolo, '-', 3) AS INTEGER))
      FROM demandas
      WHERE protocolo LIKE 'ARC-' || v_ano || '-%'
    ), 0) + 1
  )
  ON CONFLICT (ano) DO UPDATE
    SET ultimo_seq = protocolos_controle.ultimo_seq + 1
  RETURNING ultimo_seq INTO v_seq;

  RETURN 'ARC-' || v_ano || '-' || LPAD(v_seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION gerar_protocolo() TO anon, authenticated;

-- Auto-criar profile quando um usuário se registra (ROLE FIXA EM 'servidor')
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, nome, role, ativo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    'servidor', -- SEGURANÇA: Previne escalonamento via metadados do cliente
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Previne que usuários comuns alterem seu próprio role ou status ativo
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role OR NEW.ativo IS DISTINCT FROM OLD.ativo) THEN
    IF NOT (public.is_admin() OR auth.role() = 'service_role' OR current_user = 'postgres') THEN
      RAISE EXCEPTION 'Acesso negado: apenas administradores podem alterar permissões (role) ou ativação de usuários.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS trg_demandas_updated_at ON demandas;
CREATE TRIGGER trg_demandas_updated_at
  BEFORE UPDATE ON demandas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_setores_updated_at ON setores;
CREATE TRIGGER trg_setores_updated_at
  BEFORE UPDATE ON setores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_configuracoes_updated_at ON configuracoes;
CREATE TRIGGER trg_configuracoes_updated_at
  BEFORE UPDATE ON configuracoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================

ALTER TABLE demandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_alteracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocolos_controle ENABLE ROW LEVEL SECURITY;

-- DEMANDAS: Leitura pública e inserção pública pelo cidadão
DROP POLICY IF EXISTS "demandas_public_read" ON demandas;
CREATE POLICY "demandas_public_read" ON demandas
  FOR SELECT USING (publica = true);

DROP POLICY IF EXISTS "demandas_public_insert" ON demandas;
CREATE POLICY "demandas_public_insert" ON demandas
  FOR INSERT WITH CHECK (publica = true);

DROP POLICY IF EXISTS "demandas_auth_all" ON demandas;
CREATE POLICY "demandas_auth_all" ON demandas
  FOR ALL USING (auth.role() = 'authenticated');

-- PROFILES: Leitura autenticada, auto-atualização restrita, total para admin
DROP POLICY IF EXISTS "profiles_auth_read" ON profiles;
CREATE POLICY "profiles_auth_read" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "profiles_own_update" ON profiles;
CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (public.is_admin());

-- SETORES: Leitura pública, alteração administrativa
DROP POLICY IF EXISTS "setores_public_read" ON setores;
CREATE POLICY "setores_public_read" ON setores
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "setores_admin_write" ON setores;
DROP POLICY IF EXISTS "setores_auth_write" ON setores;
CREATE POLICY "setores_admin_write" ON setores
  FOR ALL USING (public.is_admin());

-- HISTÓRICO: Inserção cidadão, leitura pública restrita a não-internos
DROP POLICY IF EXISTS "historico_public_insert" ON historico_alteracoes;
CREATE POLICY "historico_public_insert" ON historico_alteracoes
  FOR INSERT WITH CHECK (interno = false);

DROP POLICY IF EXISTS "historico_public_read" ON historico_alteracoes;
CREATE POLICY "historico_public_read" ON historico_alteracoes
  FOR SELECT USING (
    interno = false AND EXISTS (
      SELECT 1 FROM demandas WHERE id = demanda_id AND publica = true
    )
  );

DROP POLICY IF EXISTS "historico_auth_all" ON historico_alteracoes;
CREATE POLICY "historico_auth_all" ON historico_alteracoes
  FOR ALL USING (auth.role() = 'authenticated');

-- ANEXOS
DROP POLICY IF EXISTS "anexos_public_read" ON anexos;
CREATE POLICY "anexos_public_read" ON anexos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM demandas WHERE id = demanda_id AND publica = true
    )
  );

DROP POLICY IF EXISTS "anexos_public_insert" ON anexos;
CREATE POLICY "anexos_public_insert" ON anexos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM demandas WHERE id = demanda_id AND publica = true
    )
  );

DROP POLICY IF EXISTS "anexos_auth_all" ON anexos;
CREATE POLICY "anexos_auth_all" ON anexos
  FOR ALL USING (auth.role() = 'authenticated');

-- CONFIGURAÇÕES: Leitura pública (pesos transparentes), escrita restrita a Admin
DROP POLICY IF EXISTS "configuracoes_public_read" ON configuracoes;
CREATE POLICY "configuracoes_public_read" ON configuracoes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "configuracoes_admin_write" ON configuracoes;
DROP POLICY IF EXISTS "configuracoes_auth_write" ON configuracoes;
CREATE POLICY "configuracoes_admin_write" ON configuracoes
  FOR ALL USING (public.is_admin());

-- PROTOCOLOS_CONTROLE
DROP POLICY IF EXISTS "protocolos_admin_all" ON protocolos_controle;
CREATE POLICY "protocolos_admin_all" ON protocolos_controle
  FOR ALL USING (public.is_admin());
