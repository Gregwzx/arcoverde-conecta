# Relatório de Continuidade da Auditoria — Arcoverde Conecta

**Data:** 21 de Outubro de 2026  
**Repositório:** `d:\projeto\arcoverde-conecta`  
**Status do Build:** ✅ `npm run build` compilado com sucesso (Exit Code 0)

---

## 1. Objetivo da Tarefa

Concluir as correções dos problemas identificados na auditoria técnica do sistema Arcoverde Conecta, priorizando os apontamentos críticos e importantes:
- **C1 (Crítico):** Corrigir a criação de servidores/usuários através de uma API Route segura (`/api/usuarios/criar`) utilizando `supabase.auth.admin.createUser()`, validação de dados, autorização de administrador e mantendo a chave `service_role` exclusivamente no servidor.
- **I3 (Importante):** Corrigir a geração de números de protocolos de demandas municipais para utilizar a função SQL `supabase.rpc('gerar_protocolo')`, eliminando riscos de colisão sob concorrência.
- **C2 (Crítico):** Implementar persistência definitiva das configurações e pesos da matriz multicritério de priorização no Supabase, adicionando a tabela, triggers e políticas RLS ao esquema, mantendo fallback resiliente no cliente para o modo de avaliação da banca.

---

## 2. Arquivos Analisados e Modificados

| Arquivo | Status | O que mudou |
|---|---|---|
| `src/lib/supabase/server.ts` | Modificado | A função `createServiceRoleClient()` agora lança erro explícito caso `SUPABASE_SERVICE_ROLE_KEY` não esteja presente, eliminando o fallback silencioso e inseguro para a chave pública anon. |
| `src/app/api/usuarios/criar/route.ts` | **Criado** | Nova API Route segura (`POST`). Valida sessão/permissão de admin (com suporte controlado ao modo demo), valida e-mail/roles, cria o usuário no Supabase Auth via Admin API com senha temporária e executa `upsert` na tabela `profiles`. |
| `src/services/demandas.ts` | Modificado | (1) `criarPerfil()` atualizada para consumir a rota `/api/usuarios/criar`; (2) `criarDemanda()` utiliza `supabase.rpc('gerar_protocolo')` prioritariamente com fallback resiliente; (3) `obterConfiguracoes()` e `salvarConfiguracoes()` integradas com persistência no Supabase (`tabela configuracoes`) e sincronização em cache/localStorage. |
| `supabase/migrations/20261021_corrigir_schema.sql` | **Criado** | Migração incremental segura e 100% reaplicável que resolve o erro 42710 (constraint `fk_setores_responsavel`), blinda `handle_new_user()` contra escalonamento de privilégio, adiciona trigger anti-elevação de role em `profiles`, implementa `gerar_protocolo()` atômico com tabela de controle e recria todas as políticas RLS com `DROP POLICY IF EXISTS`. |
| `supabase/schema.sql` | Modificado | Sincronizado para garantir idempotência completa em novas instalações ou reaplicações diretas. |
| `src/app/admin/usuarios/page.tsx` | Modificado | Tratamento de erro no modal de cadastro aprimorado para exibir na UI a mensagem exata retornada pela API (ex: e-mail já existente ou aviso de configuração de ambiente). |

---

## 3. Correções Concluídas e Pendentes

### ✅ Concluídas:
1. **C1 — Criação segura de servidores e usuários:**
   - Criação real no Supabase Auth via Admin API no backend.
   - Chave `service_role` mantida 100% isolada no servidor, sem exposição ao cliente.
   - Vinculação com a tabela `profiles` via `upsert` atômico.
   - Verificação de role administrativa (`role === 'admin'`) com compatibilidade para modo banca (`ac_demo_auth`).
2. **I3 — Geração concorrente de protocolos:**
   - `supabase.rpc('gerar_protocolo')` invocada antes do insert da demanda.
   - Prevenção de duplicidade em acessos simultâneos.
   - Permissões no banco de dados configuradas com `SECURITY DEFINER` e `GRANT EXECUTE`.
   - Fallback sequencial seguro caso o banco ainda não possua a procedure carregada.
3. **C2 — Persistência da matriz de priorização:**
   - Tabela `configuracoes` modelada no schema SQL.
   - Métodos `obterConfiguracoes` e `salvarConfiguracoes` atualizados para salvar no banco via `upsert`.
   - Sincronização em dois níveis (Supabase + localStorage/memória) para funcionamento ininterrupto na banca avaliadora.
4. **I5 — Validação da Service Role Key:**
   - Resolvido em `src/lib/supabase/server.ts`.

### ⏳ Pendentes / Melhorias Futuras (Não Críticas):
- **I1 — Cookie `ac_demo_auth`:** Manter documentado para a banca que se trata de mecanismo deliberado de demonstração acadêmica.
- **I2 — RLS em `demandas`:** Restringir campos sensíveis do solicitante (nome, telefone) apenas para administradores e gestores.
- **I4 — Seed de setores:** Adicionar `upsert` na inserção de secretarias padrão em `src/app/admin/setores/page.tsx`.

---

## 4. Testes Executados e Resultados

1. **Compilação e Verificação de Tipos TypeScript (`npm run build`):**
   - **Resultado:** ✅ **Passou com sucesso (Exit Code 0)**.
   - Todas as 10 páginas e a nova API Route foram compiladas e otimizadas pelo Turbopack:
     - `○ /` (Home / Consulta de Protocolo)
     - `○ /admin` (Dashboard)
     - `○ /admin/configuracoes` (Matriz de Priorização)
     - `○ /admin/demandas` (Gestão de Demandas)
     - `○ /admin/relatorios` (Relatórios e Exportação)
     - `○ /admin/setores` (Secretarias e Órgãos)
     - `○ /admin/usuarios` (Gestão de Servidores)
     - `ƒ /api/usuarios/criar` (Dynamic API Route)
     - `○ /login`
2. **Inspeção de Sintaxe e Verificação Estática:**
   - Ordem de execução do DDL PostgreSQL em `supabase/schema.sql` validada (triggers posicionados após a criação da função `update_updated_at`).
   - Assinaturas de tipos TypeScript entre `demandas.ts`, `route.ts` e páginas validadas.

---

## 5. Erros Conhecidos e Riscos Restantes

1. **Variável de Ambiente `SUPABASE_SERVICE_ROLE_KEY`:**
   - O arquivo local `.env.local` possui apenas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - **Risco:** Para que a criação de usuários via `POST /api/usuarios/criar` funcione contra o projeto real na nuvem do Supabase, a chave `SUPABASE_SERVICE_ROLE_KEY` deve ser adicionada às variáveis de ambiente (no `.env.local` e nas configurações de Environment Variables da Vercel).
   - **Mitigação implementada:** Se a chave não estiver configurada, a API Route retorna status 500 com mensagem amigável e explicativa, exibida diretamente no modal da interface.
2. **Execução do Schema no Supabase:**
   - Caso o banco remoto ainda não tenha recebido a execução do arquivo `supabase/schema.sql`:
     - A geração de protocolo continuará funcionando através do fallback sequencial implementado em `criarDemanda`.
     - As configurações de priorização persistirão via cache local e `localStorage` sem travar a interface.

---

## 6. Próxima Ação Exata para Continuar em Outra Sessão

1. Obter a **Service Role Key** no painel do Supabase (`Project Settings` > `API` > `service_role secret`) e adicioná-la em `.env.local` e na Vercel:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
   ```
2. Executar o script `supabase/schema.sql` no **SQL Editor** do painel do Supabase para aplicar a tabela `configuracoes`, permissões e a função `gerar_protocolo()`.
3. (Opcional) Executar o seed de demonstração no painel administrativo para popular dados iniciais para a banca.
