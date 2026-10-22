-- Seed idempotente de setores iniciais de Arcoverde (fonte: site oficial da Prefeitura)
-- Executar manualmente no SQL Editor do Supabase. Não sobrescreve registros existentes.
INSERT INTO setores (nome, descricao, ativo)
SELECT v.nome, v.descricao, true
FROM (VALUES
  ('Receita Municipal', 'Secretaria de Receita Municipal'),
  ('Finanças', 'Secretaria de Finanças'),
  ('Chefia de Gabinete', 'Chefia de Gabinete'),
  ('Governo', 'Secretaria de Governo'),
  ('Administração', 'Secretaria de Administração'),
  ('Procuradoria', 'Procuradoria Municipal'),
  ('Planejamento e Projetos', 'Secretaria de Planejamento e Projetos'),
  ('Serviços Públicos', 'Secretaria de Serviços Públicos'),
  ('Saúde', 'Secretaria de Saúde'),
  ('Educação', 'Secretaria de Educação'),
  ('Assistência Social', 'Secretaria de Assistência Social'),
  ('Turismo, Esportes e Eventos', 'Secretaria de Turismo, Esportes e Eventos'),
  ('Desenvolvimento Econômico', 'Secretaria de Desenvolvimento Econômico'),
  ('Agricultura', 'Secretaria de Agricultura'),
  ('Cultura', 'Secretaria de Cultura'),
  ('Mulher', 'Secretaria da Mulher'),
  ('ARCOPREV', 'Instituto de Previdência - ARCOPREV')
) AS v(nome, descricao)
WHERE NOT EXISTS (SELECT 1 FROM setores s WHERE s.nome = v.nome);
