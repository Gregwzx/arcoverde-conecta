-- ============================================================
-- Arcoverde Conecta — Dados de Demonstração
-- Execute APÓS o schema.sql no SQL Editor do Supabase.
--
-- ⚠️  TODOS os registros possuem is_demo = true.
--     NÃO representam estatísticas oficiais de Arcoverde.
-- ============================================================

-- Setores municipais
INSERT INTO setores (id, nome, descricao) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Secretaria de Infraestrutura', 'Obras, pavimentação e manutenção viária'),
  ('a1000000-0000-0000-0000-000000000002', 'Secretaria de Serviços Públicos', 'Limpeza urbana, iluminação e coleta'),
  ('a1000000-0000-0000-0000-000000000003', 'Secretaria de Meio Ambiente', 'Áreas verdes, drenagem e sustentabilidade'),
  ('a1000000-0000-0000-0000-000000000004', 'Secretaria de Obras', 'Projetos e execução de obras públicas'),
  ('a1000000-0000-0000-0000-000000000005', 'Defesa Civil', 'Prevenção e resposta a emergências');

-- Demandas demonstrativas (bairros reais de Arcoverde)
INSERT INTO demandas (
  protocolo, titulo, descricao, categoria, status,
  prioridade_pontuacao, prioridade_faixa,
  endereco, bairro, latitude, longitude,
  setor_id, risco_seguranca, impacto_populacao, agravamento,
  is_demo, publica, created_at
) VALUES
-- 1. Iluminação - Centro
(
  'ARC-2026-00001',
  'Postes apagados na Rua da Aurora',
  'Três postes consecutivos sem iluminação na Rua da Aurora, próximo à Praça da Bandeira. Área de grande circulação de pedestres à noite, representando risco à segurança dos transeuntes.',
  'iluminacao_publica', 'em_andamento', 72, 'alta',
  'Rua da Aurora, 150', 'Centro', -8.4182, -37.0533,
  'a1000000-0000-0000-0000-000000000002', 7, 8, 5,
  true, true, now() - interval '12 days'
),
-- 2. Pavimentação - São Cristóvão
(
  'ARC-2026-00002',
  'Buraco na Avenida Presidente Kennedy',
  'Buraco de aproximadamente 1,5m de diâmetro na pista principal da Avenida Presidente Kennedy, sentido Centro. Já causou danos a veículos e representa risco de acidentes.',
  'pavimentacao', 'encaminhada', 85, 'critica',
  'Av. Presidente Kennedy, próximo ao nº 300', 'São Cristóvão', -8.4215, -37.0568,
  'a1000000-0000-0000-0000-000000000001', 9, 9, 8,
  true, true, now() - interval '8 days'
),
-- 3. Limpeza - Boa Vista
(
  'ARC-2026-00003',
  'Acúmulo de lixo no Beco do Coelho',
  'Moradores relatam acúmulo de resíduos sólidos no Beco do Coelho há mais de uma semana. O lixo atrai animais e gera mau cheiro, afetando a qualidade de vida dos residentes.',
  'limpeza_urbana', 'em_analise', 55, 'alta',
  'Beco do Coelho, s/n', 'Boa Vista', -8.4145, -37.0490,
  'a1000000-0000-0000-0000-000000000002', 4, 6, 7,
  true, true, now() - interval '15 days'
),
-- 4. Drenagem - São Geraldo
(
  'ARC-2026-00004',
  'Bueiro entupido causa alagamento',
  'Bueiro na esquina da Rua São José com a Travessa do Comércio encontra-se totalmente entupido. Em dias de chuva, a água invade as casas vizinhas, causando prejuízos materiais.',
  'drenagem', 'nova', 78, 'critica',
  'Rua São José, esquina Tv. do Comércio', 'São Geraldo', -8.4198, -37.0512,
  'a1000000-0000-0000-0000-000000000003', 8, 7, 9,
  true, true, now() - interval '3 days'
),
-- 5. Conservação - Centro
(
  'ARC-2026-00005',
  'Praça da Bandeira com bancos quebrados',
  'Diversos bancos e equipamentos da Praça da Bandeira estão danificados. Crianças brincam no local e podem se machucar com as estruturas comprometidas.',
  'conservacao_espacos', 'em_andamento', 45, 'media',
  'Praça da Bandeira', 'Centro', -8.4178, -37.0540,
  'a1000000-0000-0000-0000-000000000004', 5, 6, 4,
  true, true, now() - interval '20 days'
),
-- 6. Iluminação - Codé
(
  'ARC-2026-00006',
  'Lâmpada queimada na Rua Projetada',
  'Uma lâmpada de poste queimada na Rua Projetada, em frente ao ponto de ônibus. Passageiros ficam no escuro aguardando transporte.',
  'iluminacao_publica', 'concluida', 35, 'media',
  'Rua Projetada, próximo ao ponto de ônibus', 'Codé', -8.4230, -37.0480,
  'a1000000-0000-0000-0000-000000000002', 4, 4, 3,
  true, true, now() - interval '30 days'
),
-- 7. Pavimentação - São Cristóvão
(
  'ARC-2026-00007',
  'Calçada irregular prejudica acessibilidade',
  'Trecho de calçada na Rua Capitão Arlindo Pacheco apresenta desníveis e obstáculos que impedem a passagem de cadeirantes e idosos com dificuldade de locomoção.',
  'pavimentacao', 'nova', 52, 'alta',
  'Rua Cap. Arlindo Pacheco, 200-300', 'São Cristóvão', -8.4205, -37.0555,
  'a1000000-0000-0000-0000-000000000001', 5, 7, 5,
  true, true, now() - interval '5 days'
),
-- 8. Limpeza - Centro
(
  'ARC-2026-00008',
  'Terreno baldio com entulho e mato alto',
  'Terreno na Rua 13 de Maio acumula entulho de construção e mato alto, servindo de criadouro de mosquitos e abrigo para animais peçonhentos.',
  'limpeza_urbana', 'encaminhada', 60, 'alta',
  'Rua 13 de Maio, lote 45', 'Centro', -8.4170, -37.0525,
  'a1000000-0000-0000-0000-000000000003', 6, 5, 7,
  true, true, now() - interval '18 days'
),
-- 9. Drenagem - Boa Vista
(
  'ARC-2026-00009',
  'Erosão na encosta próxima a residências',
  'Erosão avançada na encosta da Rua Alto da Boa Vista ameaça três residências. A situação se agrava a cada chuva, com risco de deslizamento.',
  'drenagem', 'em_andamento', 92, 'critica',
  'Rua Alto da Boa Vista, fundos', 'Boa Vista', -8.4130, -37.0500,
  'a1000000-0000-0000-0000-000000000005', 10, 8, 10,
  true, true, now() - interval '7 days'
),
-- 10. Conservação - São Geraldo
(
  'ARC-2026-00010',
  'Quadra poliesportiva com piso danificado',
  'A quadra poliesportiva do bairro São Geraldo apresenta trincas profundas no piso, representando risco de lesões para os praticantes de esportes.',
  'conservacao_espacos', 'em_analise', 38, 'media',
  'Quadra Poliesportiva de São Geraldo', 'São Geraldo', -8.4190, -37.0505,
  'a1000000-0000-0000-0000-000000000004', 4, 5, 3,
  true, true, now() - interval '25 days'
),
-- 11. Iluminação - Novo Arcoverde
(
  'ARC-2026-00011',
  'Trecho sem iluminação na Estrada do Cruzeiro',
  'Aproximadamente 200 metros da Estrada do Cruzeiro sem iluminação pública. Moradores relatam assaltos e sentem-se inseguros ao transitar à noite.',
  'iluminacao_publica', 'nova', 68, 'alta',
  'Estrada do Cruzeiro, Km 2', 'Novo Arcoverde', -8.4250, -37.0600,
  'a1000000-0000-0000-0000-000000000002', 8, 7, 5,
  true, true, now() - interval '2 days'
),
-- 12. Limpeza - Codé
(
  'ARC-2026-00012',
  'Coleta de lixo irregular no bairro',
  'O caminhão de coleta não passa na Rua Nova do Codé há mais de 10 dias. Lixo acumulado nas calçadas está gerando reclamações de toda a comunidade.',
  'limpeza_urbana', 'em_andamento', 48, 'media',
  'Rua Nova do Codé', 'Codé', -8.4240, -37.0475,
  'a1000000-0000-0000-0000-000000000002', 3, 7, 5,
  true, true, now() - interval '11 days'
),
-- 13. Pavimentação concluída
(
  'ARC-2026-00013',
  'Recapeamento da Rua do Comércio',
  'Trecho de 150m da Rua do Comércio necessitava de recapeamento urgente. O serviço foi realizado pela equipe de infraestrutura em 3 dias úteis.',
  'pavimentacao', 'concluida', 40, 'media',
  'Rua do Comércio, 100-250', 'Centro', -8.4175, -37.0535,
  'a1000000-0000-0000-0000-000000000001', 5, 6, 3,
  true, true, now() - interval '45 days'
),
-- 14. Cancelada
(
  'ARC-2026-00014',
  'Poda de árvore na Rua das Flores',
  'Solicitação de poda de árvore que estaria obstruindo fiação. Após vistoria, constatou-se que a árvore já havia sido podada pela equipe da concessionária de energia.',
  'conservacao_espacos', 'cancelada', 20, 'baixa',
  'Rua das Flores, 80', 'Centro', -8.4168, -37.0528,
  'a1000000-0000-0000-0000-000000000003', 2, 2, 1,
  true, true, now() - interval '35 days'
),
-- 15. Drenagem nova
(
  'ARC-2026-00015',
  'Vazamento de água na Rua do Sol',
  'Vazamento de água constante na calçada da Rua do Sol. A água escorre pela rua formando poças e dificultando a passagem de pedestres e veículos.',
  'drenagem', 'nova', 42, 'media',
  'Rua do Sol, próximo ao nº 55', 'São Cristóvão', -8.4210, -37.0560,
  'a1000000-0000-0000-0000-000000000001', 3, 5, 5,
  true, true, now() - interval '1 day'
);

-- Histórico de alterações para algumas demandas
INSERT INTO historico_alteracoes (demanda_id, tipo, descricao, valor_anterior, valor_novo, interno) VALUES
-- Demanda 1
((SELECT id FROM demandas WHERE protocolo = 'ARC-2026-00001'), 'status', 'Demanda recebida e registrada no sistema.', NULL, 'nova', false),
((SELECT id FROM demandas WHERE protocolo = 'ARC-2026-00001'), 'status', 'Demanda em análise pela equipe técnica.', 'nova', 'em_analise', false),
((SELECT id FROM demandas WHERE protocolo = 'ARC-2026-00001'), 'atribuicao', 'Encaminhada para a Secretaria de Serviços Públicos.', NULL, 'Sec. Serviços Públicos', false),
((SELECT id FROM demandas WHERE protocolo = 'ARC-2026-00001'), 'status', 'Equipe técnica iniciou os reparos.', 'em_analise', 'em_andamento', false),
((SELECT id FROM demandas WHERE protocolo = 'ARC-2026-00001'), 'comentario', 'Equipe identificou que o problema é no cabeamento subterrâneo. Prazo estimado: 5 dias.', NULL, NULL, true),

-- Demanda 2
((SELECT id FROM demandas WHERE protocolo = 'ARC-2026-00002'), 'status', 'Demanda registrada com prioridade crítica.', NULL, 'nova', false),
((SELECT id FROM demandas WHERE protocolo = 'ARC-2026-00002'), 'status', 'Encaminhada à Secretaria de Infraestrutura para reparo emergencial.', 'nova', 'encaminhada', false),
((SELECT id FROM demandas WHERE protocolo = 'ARC-2026-00002'), 'comentario', 'Sinalização provisória instalada no local. Operação tapa-buraco programada para a próxima semana.', NULL, NULL, false),

-- Demanda 6 (concluída)
((SELECT id FROM demandas WHERE protocolo = 'ARC-2026-00006'), 'status', 'Demanda recebida.', NULL, 'nova', false),
((SELECT id FROM demandas WHERE protocolo = 'ARC-2026-00006'), 'status', 'Equipe de manutenção realizou a troca da lâmpada.', 'nova', 'em_andamento', false),
((SELECT id FROM demandas WHERE protocolo = 'ARC-2026-00006'), 'status', 'Serviço concluído. Iluminação restabelecida.', 'em_andamento', 'concluida', false),

-- Demanda 9 (crítica)
((SELECT id FROM demandas WHERE protocolo = 'ARC-2026-00009'), 'status', 'Demanda registrada como emergência.', NULL, 'nova', false),
((SELECT id FROM demandas WHERE protocolo = 'ARC-2026-00009'), 'prioridade', 'Prioridade recalculada após vistoria in loco.', '78', '92', false),
((SELECT id FROM demandas WHERE protocolo = 'ARC-2026-00009'), 'status', 'Defesa Civil acionada. Obras de contenção iniciadas.', 'nova', 'em_andamento', false),
((SELECT id FROM demandas WHERE protocolo = 'ARC-2026-00009'), 'comentario', 'Monitoramento geotécnico em andamento. Famílias notificadas sobre plano de evacuação preventiva.', NULL, NULL, true);
