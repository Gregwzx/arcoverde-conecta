-- ============================================================
-- Arcoverde Conecta — Schema do Banco de Dados (Supabase)
-- Execute este script no SQL Editor do Supabase.
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

-- FK: setor.responsavel → profiles
ALTER TABLE setores
  ADD CONSTRAINT fk_setores_responsavel
  FOREIGN KEY (responsavel_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

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
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Gerar protocolo único: ARC-ANO-SEQUENCIAL
CREATE OR REPLACE FUNCTION gerar_protocolo()
RETURNS TEXT AS $$
DECLARE
  seq INTEGER;
  ano TEXT;
BEGIN
  ano := EXTRACT(YEAR FROM now())::TEXT;
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(protocolo, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO seq
  FROM demandas
  WHERE protocolo LIKE 'ARC-' || ano || '-%';
  
  RETURN 'ARC-' || ano || '-' || LPAD(seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_demandas_updated_at
  BEFORE UPDATE ON demandas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_setores_updated_at
  BEFORE UPDATE ON setores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-criar profile quando um usuário se registra
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, nome, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'servidor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
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

-- DEMANDAS: Leitura pública e inserção pública pelo cidadão
CREATE POLICY "demandas_public_read" ON demandas
  FOR SELECT USING (publica = true);

CREATE POLICY "demandas_public_insert" ON demandas
  FOR INSERT WITH CHECK (publica = true);

CREATE POLICY "demandas_auth_all" ON demandas
  FOR ALL USING (auth.role() = 'authenticated');

-- FUNÇÃO SEGURA PARA VERIFICAR ADMIN (Sem recursão infinita)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- PROFILES: Apenas autenticados
CREATE POLICY "profiles_auth_read" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (public.is_admin());

-- SETORES: Leitura pública, escrita autenticada
CREATE POLICY "setores_public_read" ON setores
  FOR SELECT USING (true);

CREATE POLICY "setores_auth_write" ON setores
  FOR ALL USING (auth.role() = 'authenticated');

-- HISTÓRICO:
-- Inserção pelo cidadão (somente registros públicos de criação)
CREATE POLICY "historico_public_insert" ON historico_alteracoes
  FOR INSERT WITH CHECK (interno = false);

-- Apenas autenticados (comentários internos e despachos)
CREATE POLICY "historico_auth_all" ON historico_alteracoes
  FOR ALL USING (auth.role() = 'authenticated');

-- Histórico público (apenas não-internos de demandas públicas)
CREATE POLICY "historico_public_read" ON historico_alteracoes
  FOR SELECT USING (
    interno = false AND EXISTS (
      SELECT 1 FROM demandas WHERE id = demanda_id AND publica = true
    )
  );

-- ANEXOS
CREATE POLICY "anexos_auth_all" ON anexos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "anexos_public_read" ON anexos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM demandas WHERE id = demanda_id AND publica = true
    )
  );
