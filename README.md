# Arcoverde Conecta

> **Plataforma Integrada de Gestão, Triagem e Priorização Inteligente de Serviços Públicos Municipais**  
> Projeto desenvolvido no contexto do programa **Desafios PE** para a **Prefeitura Municipal de Arcoverde - PE**.

[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-emerald?logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-cyan?logo=tailwindcss)](https://tailwindcss.com/)

---

## 📌 1. Contexto & Problema Público

Nos municípios do interior de Pernambuco, a zeladoria urbana (iluminação pública, recuperação asfáltica, saneamento, coleta de resíduos e contenção de encostas) historicamente enfrenta quatro gargalos crônicos:

1. **Descentralização e Desarticulação:** Demandas chegam por canais informais (redes sociais, mensagens pessoais, ofícios em papel), resultando em perda de dados e ausência de rastreabilidade.
2. **Critérios Subjetivos de Atendimento:** Falta de um método analítico para priorizar ordens de serviço. Frequentemente atende-se quem reclama com mais frequência e não quem está sob maior risco.
3. **Falta de Previsibilidade para o Cidadão:** O munícipe não tem previsão sobre o atendimento de sua solicitação e desconhece o fluxo interno da prefeitura.
4. **Ausência de Georreferenciamento:** Secretarias municipais atuam sem visão espacial das ocorrências por bairro e sem controle automatizado de prazos operacionais (SLA).

---

## 💡 2. A Solução Arcoverde Conecta

O **Arcoverde Conecta** é uma plataforma institucional GovTech de transparência ativa e gestão pública operacional, desenhada para modernizar o atendimento ao munícipe de Arcoverde e otimizar a alocação de recursos públicos através de:

- **Canal Cidadão Simplificado:** Registro ágil de ocorrências com protocolo sequencial único anual (`ARC-ANO-SEQUENCIAL`), georreferenciamento em bairros de Arcoverde e upload de fotos comprobatórias.
- **Consulta Pública de Protocolos:** Acompanhamento em tempo real da linha do tempo da solicitação (*Registrado ➔ Em Análise ➔ Em Execução ➔ Concluído*), com histórico de despachos públicos e fotos anexadas.
- **Mapa Interativo Urbano:** Visualização georreferenciada das ocorrências por bairro e severidade em Arcoverde (Centro, São Cristóvão, Boa Vista, Sucupira, etc.).
- **Matriz Multicritério de Priorização (MCDA):** Algoritmo paramétrico (0 a 100 pontos) que calcula a prioridade operacional considerando 4 pilares:
  $$\text{Score} = w_1 \times \text{Risco à Vida} + w_2 \times \text{Impacto Social} + w_3 \times \text{Tempo de Espera} + w_4 \times \text{Potencial de Degradação}$$
- **Painel Administrativo Municipal:** Gestão setorial por secretaria (Obras, Serviços Públicos, Meio Ambiente, Defesa Civil, Arcotrans), controle estrito de permissões por perfil (`admin`, `gestor`, `servidor`), relatórios oficiais prontos para impressão em formato A4/PDF e exportação de dados em CSV.

---

## 🔍 3. Matriz de Conformidade das Funcionalidades

Abaixo detalhamos a validação técnica de cada funcionalidade prometida na plataforma:

| Funcionalidade Prometida | O que foi validado tecnicamente | Garantia de Funcionamento e Arquitetura |
| :--- | :--- | :--- |
| **1. Cadastro de demandas e protocolo único** | Se o cadastro salva e o protocolo não colide em concorrência | ✅ Função RPC `gerar_protocolo()` com tabela de controle atômico (`protocolos_controle`), operando via `INSERT ... ON CONFLICT DO UPDATE RETURNING` no PostgreSQL. Restrição `UNIQUE` na coluna `protocolo`. Fallback automático de resiliência implementado. |
| **2. Mapa e localização das ocorrências** | Se os marcadores correspondem exatamente aos dados salvos | ✅ Componente Leaflet georreferenciado (SSR-safe) centrado em Arcoverde-PE (`[-8.4182, -37.0533]`). Filtra e plota coordenadas reais de latitude e longitude persistidas no banco, com popups interativos contendo protocolo, categoria e status. |
| **3. Priorização inteligente de 0 a 100** | Se os pesos configuráveis alteram o resultado de verdade | ✅ Os cálculos são dinâmicos e utilizam os pesos persistidos na tabela `configuracoes` do Supabase via `obterConfiguracoes()`. Ao salvar novos pesos na tela administrativa, as novas demandas e recálculos utilizam imediatamente a nova matriz calibrada. |
| **4. Painel administrativo** | Se os indicadores usam dados reais do banco | ✅ Função `obterEstatisticas()` executa queries de agregação em tempo real diretamente na tabela `demandas` do Supabase (total, concluídas, críticas, taxa de resolução e agrupamentos por categoria, status e bairro). |
| **5. Gestão de setores e usuários** | Se as permissões funcionam estritamente por perfil | ✅ Perfis `admin`, `gestor` e `servidor`. A API Route segura `/api/usuarios/criar` e triggers de banco (`prevent_role_escalation`) impedem que usuários comuns alterem seu próprio papel ou acessem parâmetros municipais restritos. |
| **6. Relatórios PDF e CSV** | Se os arquivos são gerados corretamente | ✅ **CSV:** Gerado em UTF-8 com BOM (`\uFEFF`) e delimitador ponto-e-vírgula (`;`), garantindo abertura perfeita no Microsoft Excel sem corromper acentos. **PDF:** Layout estruturado para impressão oficial com cabeçalho municipal, filtros ativos e resumo de KPIs via `@media print`. |
| **7. Fotos e histórico de alterações** | Se os registros e anexos ficam associados à demanda certa | ✅ Tabelas relacionais `historico_alteracoes` e `anexos` vinculadas via chave estrangeira `demanda_id` com `ON DELETE CASCADE`. Visualização de linha do tempo e anexos tanto na área administrativa quanto na consulta cidadã por protocolo. |

---

## 👥 4. Perfis de Acesso & Hierarquia de Permissões

O sistema possui controle de acesso em camadas (*Role-Based Access Control* + *Row Level Security*):

| Perfil | Nível | Permissões no Sistema |
| :--- | :--- | :--- |
| **Administrador Geral** (`admin`) | Irrestrito | Gestão total de usuários, secretarias municipais, relatórios, alteração dos pesos da matriz multicritério e criação de servidores. |
| **Gestor Setorial** (`gestor`) | Intermediário | Triagem, despacho, alteração de status e designação de equipes para as demandas da sua secretaria vinculada. |
| **Atendente / Operacional** (`servidor`) | Operacional | Atendimento em campo, registro de notas de execução, anexação de fotos de conclusão e atualização de andamento. |
| **Cidadão** (`público`) | Consulta / Abertura | Cadastro público de demandas, consulta de linha do tempo por protocolo e visualização do mapa municipal de ocorrências. |

---

## 🛠️ 5. Tecnologias & Arquitetura

- **Framework Web:** [Next.js](https://nextjs.org/) (App Router, React 19, Turbopack, Server & Client Components)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Tipagem estrita ponta a ponta)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) v4 com tokens de design institucional GovTech
- **Banco de Dados:** [Supabase](https://supabase.com/) (PostgreSQL 15+ com Row Level Security, Triggers e Procedures)
- **Mapas:** [Leaflet](https://leafletjs.com/) e React Leaflet com OpenStreetMap
- **Gráficos & Analytics:** [Recharts](https://recharts.org/)
- **Ícones:** [Lucide React](https://lucide.dev/)

---

## 🚀 6. Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js versão 18.17 ou superior
- npm, yarn ou pnpm

### 1. Clonar o repositório
```bash
git clone https://github.com/Gregwzx/arcoverde-conecta.git
cd arcoverde-conecta
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto com as credenciais do seu projeto Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_publica
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_secreta
```
> **Nota de Segurança:** A chave `SUPABASE_SERVICE_ROLE_KEY` é utilizada **exclusivamente no servidor** (na API Route `/api/usuarios/criar`) para a criação administrativa de contas de servidores no Supabase Auth e nunca é exposta no frontend.

### 4. Aplicar o Banco de Dados no Supabase
1. Acesse o **SQL Editor** no painel do Supabase.
2. Execute o conteúdo de [`supabase/migrations/20261021_corrigir_schema.sql`](./supabase/migrations/20261021_corrigir_schema.sql) (ou [`supabase/schema.sql`](./supabase/schema.sql)).
3. O script é **100% idempotente** e seguro contra bancos já existentes, sem perdas de dados.

### 5. Iniciar o ambiente de desenvolvimento
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### 6. Validar o build de produção
```bash
npm run build
```

---

## 🧪 7. Guia Rápido de Validação para Avaliadores

Para validar as funcionalidades prometidas durante a avaliação:

1. **Acesso Imediato (Banca):** Na tela de login (`/login`), clique em **"Acessar como Banca Avaliadora"** para entrar instantaneamente no painel com privilégios completos.
2. **Povoamento Inicial:** No painel principal (`/admin`), clique no botão **"Povoar Banco com Dados de Demonstração"** caso o banco esteja vazio.
3. **Testar Cadastro & Protocolo:** Acesse a página inicial pública (`/`), registre uma demanda em qualquer categoria e copie o número de protocolo gerado.
4. **Testar Consulta Pública:** Cole o protocolo na aba **"Consultar Protocolo"** para ver a linha do tempo, endereço e fotos associadas.
5. **Testar Matriz de Priorização:** Em `/admin/configuracoes`, ajuste os pesos dos critérios (ex: aumente o peso de *Risco à Vida* para 60%) e clique em salvar. Abra qualquer demanda em `/admin/demandas` e veja a decomposição da nota em *Cálculo da Prioridade*.
6. **Testar Exportação de Relatórios:** Em `/admin/relatorios`, teste a exportação em **CSV** e o botão **Imprimir / Salvar em PDF**.
7. **Testar Fotos e Despachos:** Em `/admin/demandas`, clique em uma ocorrência, abra a aba **Fotos & Anexos** para registrar um comprovante e a aba **Tramitação & Histórico** para emitir um despacho.

---

## 🏛️ 8. Estrutura de Diretórios

```text
arcoverde-conecta/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Portal do Cidadão (Registro, Mapa, Consulta de Protocolo)
│   │   ├── login/page.tsx            # Login de servidores e auto-cadastro
│   │   ├── api/
│   │   │   └── usuarios/criar/       # API Route segura com service_role para criação de servidores
│   │   ├── admin/                    # Módulo administrativo protegido
│   │   │   ├── page.tsx              # Dashboard executivo com KPIs reais
│   │   │   ├── demandas/             # Triagem, despacho, histórico e fotos
│   │   │   ├── setores/              # Cadastro e gestão de secretarias municipais
│   │   │   ├── usuarios/             # Gestão de servidores e perfis de acesso
│   │   │   ├── relatorios/           # Exportação analítica em CSV e impressão em PDF
│   │   │   └── configuracoes/        # Calibração dos pesos multicritério (MCDA)
│   │   └── globals.css               # Design system GovTech
│   ├── components/                   # Componentes reutilizáveis (Sidebar, Modal, Shared, Layout)
│   ├── lib/
│   │   ├── priorizacao.ts            # Algoritmo de priorização multicritério (0 a 100)
│   │   └── supabase/                 # Clientes Supabase SSR e Service Role
│   ├── services/
│   │   ├── demandas.ts               # Camada de integração com o Supabase e regras de negócio
│   │   └── mockData.ts               # Dados realistas de Arcoverde para demonstração
│   └── types/                        # Definições estritas de tipos TypeScript
├── supabase/
│   ├── schema.sql                    # Schema completo consolidado do banco de dados
│   └── migrations/                   # Scripts de migração incremental idempotente
├── CONTINUIDADE_AUDITORIA.md         # Registro de auditoria técnica e status de entrega
└── README.md                         # Documentação oficial do projeto
```

---

## 📜 9. Licença e Propósito Acadêmico

Projeto desenvolvido como protótipo funcional de inovação pública para o programa **Desafios PE**.  
Distribuído sob licença aberta para fins educacionais e de modernização da gestão pública municipal.
