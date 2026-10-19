# Arcoverde Conecta

> **Plataforma Integrada de Gestão, Triagem e Priorização Inteligente de Serviços Públicos Municipais**  
> Desenvolvido no contexto do programa **Desafios PE** para o município de **Arcoverde - PE**.

---

## 📌 Contexto & Problema

Nos municípios do interior de Pernambuco, como Arcoverde, a gestão de serviços públicos urbanos (tapa-buracos, iluminação pública, saneamento, coleta de lixo, poda de árvores e drenagem) frequentemente enfrenta:

1. **Descentralização e Desarticulação:** Demandas chegam por múltiplos canais informais (redes sociais, mensagens pessoais, ofícios de papel), gerando retrabalho e falta de rastreabilidade.
2. **Critérios Subjetivos de Atendimento:** Inexistência de um método técnico para definir qual buraco tapar ou qual lâmpada trocar primeiro, priorizando frequentemente quem reclama mais e não quem sofre o maior risco.
3. **Falta de Transparência para o Cidadão:** O munícipe não tem previsibilidade sobre o status de sua solicitação e desconhece o tempo de resposta da prefeitura.
4. **Ausência de Inteligência e Georreferenciamento:** Secretarias municipais operam no escuro, sem mapas de calor ou indicadores de tempo de atendimento (SLA).

---

## 💡 A Solução: Arcoverde Conecta

O **Arcoverde Conecta** é uma plataforma institucional GovTech de transparência ativa e gestão pública operacional, desenhada para modernizar o atendimento ao munícipe de Arcoverde e otimizar a alocação de recursos públicos através de:

- **Canal Cidadão Simplificado:** Registro ágil de ocorrências com protocolo único, categoria, endereço geolocalizado em bairros de Arcoverde e upload de fotos comprobatórias.
- **Consulta Pública de Protocolos:** Acompanhamento em tempo real da linha do tempo da solicitação (Recebido ➔ Em Análise ➔ Encaminhado ➔ Em Andamento ➔ Concluído).
- **Mapa Interativo Urbano:** Visualização georreferenciada das ocorrências por bairro e severidade (Centro, São Cristóvão, Boa Vista, Sucupira, etc.).
- **Matriz Multicritério de Priorização (MCDA):** Algoritmo paramétrico (0 a 100 pontos) que calcula a prioridade operacional considerando 4 pilares:
  $$\text{Score} = w_1 \times \text{Risco à Vida} + w_2 \times \text{Impacto Social} + w_3 \times \text{Tempo de Espera} + w_4 \times \text{Potencial de Degradação}$$
- **Painel Administrativo Municipal:** Gestão setorial por secretaria (Obras, Iluminação, Meio Ambiente, Trânsito), controle de permissões por alçada (Admin, Gestor, Servidor), relatórios oficiais prontos para impressão em formato A4/PDF e exportação de dados em CSV.

---

## 🛠️ Tecnologias Utilizadas

- **Framework Web:** [Next.js](https://nextjs.org/) (App Router, React 19, Server & Client Components)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Tipagem estrita)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) v4 com tokens de design institucional GovTech
- **Mapas & Georreferenciamento:** [Leaflet](https://leafletjs.com/) e React Leaflet com OpenStreetMap
- **Gráficos & Analytics:** [Recharts](https://recharts.org/) com tooltips customizadas e responsividade
- **Ícones & UI:** [Lucide React](https://lucide.dev/)
- **Persistência de Dados:** [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security) com fallback automático para modo demonstração offline/acadêmico.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js versão 18.17 ou superior
- npm, yarn ou pnpm instalado

### 1. Clonar o repositório
```bash
git clone https://github.com/Gregwzx/arcoverde-conecta.git
cd arcoverde-conecta
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente (Opcional)
Crie um arquivo `.env.local` na raiz caso deseje conectar a uma instância própria do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```
> **Nota Acadêmica:** Caso as credenciais do Supabase não estejam preenchidas, o sistema ativa automaticamente o modo de **Demonstração Integrada**, permitindo testes de fluxo completo com dados simulados realistas de Arcoverde-PE.

### 4. Executar em modo de desenvolvimento
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) em seu navegador.

### 5. Validar o build de produção
```bash
npm run build
```

---

## 👥 Perfis de Acesso de Demonstração

Para fins de avaliação do projeto, utilize os botões de acesso rápido na tela de login (`/login`):

| Perfil | Nível | Descrição de Uso |
| :--- | :--- | :--- |
| **Administrador Geral** | `admin` | Acesso completo a métricas, pesos do algoritmo, setores e usuários |
| **Gestor de Obras** | `gestor` | Triagem, despacho e ordens de serviço da Secretaria de Obras |
| **Atendente Municipal** | `servidor` | Operacional, atualização de andamento e fotos de conclusão |

---

## 🏛️ Estrutura do Projeto

```text
arcoverde-conecta/
├── src/
│   ├── app/                      # Rotas e páginas (App Router)
│   │   ├── page.tsx              # Portal Público do Cidadão (Registro, Mapa, Consulta)
│   │   ├── login/page.tsx        # Login institucional com atalhos de teste
│   │   ├── admin/                # Módulo administrativo protegido
│   │   │   ├── page.tsx          # Dashboard Executivo e KPIs
│   │   │   ├── demandas/         # Matriz de triagem e priorização
│   │   │   ├── setores/          # Secretarias municipais e equipes
│   │   │   ├── usuarios/         # Servidores e controle de acesso
│   │   │   ├── relatorios/       # Analytics e relatórios para impressão/PDF
│   │   │   └── configuracoes/    # Calibrador dos pesos multicritério
│   │   └── globals.css           # Design system institucional GovTech
│   ├── components/               # Componentes reutilizáveis (Shared, Modal, Sidebar, Map)
│   ├── lib/                      # Algoritmo de priorização e clientes Supabase
│   ├── services/                 # Camada de serviços e dados de demonstração
│   └── types/                    # Definições estritas de TypeScript
├── public/                       # Assets estáticos
└── README.md                     # Documentação oficial do projeto
```

---

## 📜 Licença e Propósito Acadêmico

Projeto desenvolvido como protótipo de inovação pública para o programa **Desafios PE**.  
Disponível para fins educacionais e acadêmicos.
