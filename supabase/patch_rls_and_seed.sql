-- ============================================================
-- Arcoverde Conecta — Script de Correção de RLS e Atualização
-- Execute este script no SQL Editor do Supabase (ottvvnybvfqvcismvylp)
-- ============================================================

-- 1. FUNÇÃO SEGURA PARA VERIFICAÇÃO DE ADMIN (Elimina o erro de recursão 42P17)
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

-- 2. CORREÇÃO DAS POLÍTICAS DE PROFILES
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_auth_read" ON profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON profiles;

CREATE POLICY "profiles_auth_read" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (public.is_admin());

-- 3. CORREÇÃO DAS POLÍTICAS DE DEMANDAS (Permite cidadão registrar sem login)
DROP POLICY IF EXISTS "demandas_public_read" ON demandas;
DROP POLICY IF EXISTS "demandas_public_insert" ON demandas;
DROP POLICY IF EXISTS "demandas_auth_all" ON demandas;

CREATE POLICY "demandas_public_read" ON demandas
  FOR SELECT USING (publica = true);

CREATE POLICY "demandas_public_insert" ON demandas
  FOR INSERT WITH CHECK (publica = true);

CREATE POLICY "demandas_auth_all" ON demandas
  FOR ALL USING (auth.role() = 'authenticated');

-- 4. CORREÇÃO DAS POLÍTICAS DE HISTÓRICO
DROP POLICY IF EXISTS "historico_public_insert" ON historico_alteracoes;
DROP POLICY IF EXISTS "historico_public_read" ON historico_alteracoes;
DROP POLICY IF EXISTS "historico_auth_all" ON historico_alteracoes;

CREATE POLICY "historico_public_insert" ON historico_alteracoes
  FOR INSERT WITH CHECK (interno = false);

CREATE POLICY "historico_public_read" ON historico_alteracoes
  FOR SELECT USING (
    interno = false AND EXISTS (
      SELECT 1 FROM demandas WHERE id = demanda_id AND publica = true
    )
  );

CREATE POLICY "historico_auth_all" ON historico_alteracoes
  FOR ALL USING (auth.role() = 'authenticated');

-- 5. SETORES MUNICIPAIS BÁSICOS (Insere apenas se não existirem)
INSERT INTO setores (id, nome, descricao, ativo) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Secretaria de Obras e Infraestrutura', 'Obras viárias, pavimentação, tapa-buraco e drenagem pluvial', true),
  ('a1000000-0000-0000-0000-000000000002', 'Secretaria de Serviços Públicos', 'Iluminação pública, limpeza urbana, coleta e zeladoria', true),
  ('a1000000-0000-0000-0000-000000000003', 'Secretaria de Meio Ambiente', 'Praças, parques urbanos, arborização e preservação ecológica', true),
  ('a1000000-0000-0000-0000-000000000004', 'Defesa Civil Municipal', 'Vistorias preventivas, áreas de encosta e ocorrências emergenciais', true),
  ('a1000000-0000-0000-0000-000000000005', 'Autarquia de Trânsito (Arcotrans)', 'Sinalização de trânsito, semáforos e mobilidade urbana', true)
ON CONFLICT (id) DO NOTHING;
