# Nova Tratores POS — Resumo do Sistema

Sistema de gestão de pós-venda para a Nova Tratores, integrado com **Omie ERP** e **Supabase**.

**Stack:** Next.js 16 (App Router, React 19, TypeScript) · Supabase (PostgreSQL) · Omie API · Railway (deploy)
**Tema:** Azul marinho (`#1E3A5F`), vermelho (`#C41E2A`), bege (`#F5F0E8`)
**Fonte:** Poppins (app) · Montserrat (PDF impressão)
**Ícones:** Font Awesome 6.4

---

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave anônima do Supabase |
| `OMIE_APP_KEY` | Sim | Chave da aplicação Omie |
| `OMIE_APP_SECRET` | Sim | Secret da aplicação Omie |
| `CRON_SECRET` | Não | Secret para autorizar chamadas cron ao /api/sync |

---

## Estrutura de Pastas

```
pos/
├── app/
│   ├── page.tsx                    ← Página principal (orquestra tudo)
│   ├── globals.css                 ← Todos os estilos (CSS vars: --primary, --accent, --bg)
│   ├── layout.tsx                  ← Layout raiz
│   ├── print/[id]/page.tsx         ← Template PDF da OS (Montserrat, tema preto c/ detalhes azuis)
│   └── api/
│       ├── ordens/
│       │   ├── route.ts            ← GET (lista kanban + auto-move) + POST (criar OS)
│       │   └── [id]/
│       │       ├── route.ts        ← GET (detalhes) + PATCH (editar OS)
│       │       ├── fase/route.ts   ← PATCH (mudança rápida de fase)
│       │       └── omie/route.ts   ← POST (enviar OS para Omie)
│       ├── clientes/
│       │   ├── route.ts            ← GET (listar/buscar clientes)
│       │   └── manual/route.ts     ← POST (criar cliente manual)
│       ├── tecnicos/route.ts       ← GET (listar técnicos)
│       ├── financeiro/route.ts     ← GET (produtos do PPV)
│       ├── logs/route.ts           ← GET (logs de uma OS)
│       ├── relatorio/route.ts      ← GET (relatório geral HTML)
│       ├── sync/route.ts           ← GET/POST (sync Omie → Supabase)
│       └── buscas/
│           ├── projetos/route.ts   ← GET (busca equipamentos/chassis)
│           └── revisoes/route.ts   ← GET (busca revisões prontas)
├── components/
│   ├── Header.tsx                  ← Barra superior (busca, sync, relatório, criar)
│   ├── PhaseAccordion.tsx          ← Tabs de fase + grid de cards + dropdown de fase
│   ├── OSDrawer.tsx                ← Drawer principal (criar/editar OS)
│   ├── ClientDrawer.tsx            ← Drawer para criar cliente
│   ├── SearchModal.tsx             ← Modal de busca (projetos, revisões)
│   ├── LogPanel.tsx                ← Painel de histórico de logs
│   └── LoadingIndicator.tsx        ← Spinner global
├── lib/
│   ├── supabase.ts                 ← Cliente Supabase
│   ├── constants.ts                ← Tabelas, fases, valores (VALOR_HORA, VALOR_KM)
│   ├── types.ts                    ← Interfaces TypeScript
│   ├── utils.ts                    ← Helpers (formatarDataBR, safeGet, diasEntre)
│   ├── omie.ts                     ← Client Omie API (criarOSNoOmie, pedido de venda, fechamento PPV)
│   ├── sync-omie.ts                ← Sync automático Omie → Supabase (clientes e projetos)
│   └── sync-ppv.ts                 ← Sincronização de status POS → PPV
└── .env.local                      ← Credenciais (Supabase + Omie)
```

---

## Tabelas Supabase

| Constante | Tabela | Descrição |
|---|---|---|
| `TBL_OS` | `Ordem_Servico` | Ordens de serviço (entidade principal) |
| `TBL_CLIENTES` | `Clientes` | Clientes importados do Omie |
| `TBL_CLIENTES_MANUAIS` | `Clientes_Manuais` | Clientes cadastrados manualmente |
| `TBL_TECNICOS` | `Tecnicos_Appsheet` | Técnicos |
| `TBL_ITENS` | `movimentacoes` | Itens do PPV (peças/materiais) |
| `TBL_PROJETOS_DB` | `Projeto` | Equipamentos/chassis |
| `TBL_LOGS_PPO` | `logs_ppo` | Logs de ações nas OS |
| `TBL_LOGS_PPV` | `logs_ppv` | Logs de ações nos PPVs |
| `TBL_PEDIDOS` | `pedidos` | Pedidos de peças (PPV) |
| `TBL_REQ_SOL` | `Solicitacao_Requisicao` | Solicitações de requisição |
| `TBL_REQ_ATT` | `Atualizar_Req` | Requisições atualizadas |
| `TBL_REV_PRONTAS` | `Revisoes_Pronta` | Planos de revisão prontos |
| `TBL_METRICAS` | `tecnico_metricas` | Métricas de desempenho dos técnicos |

### Colunas da `Ordem_Servico`
```
Id_Ordem, Status, Data, Os_Cliente, Cnpj_Cliente, Endereco_Cliente,
Os_Tecnico, Os_Tecnico2, Tipo_Servico, Revisao, Projeto,
Serv_Solicitado, Serv_Realizado, Qtd_HR, Valor_HR, Qtd_KM, Valor_KM,
Valor_Total, ID_PPV, Id_Req, ID_Relatorio_Final, Ordem_Omie,
Motivo_Cancelamento, Desconto, Desconto_Hora, Desconto_KM,
Previsao_Execucao, Previsao_Faturamento
```

### Colunas da `movimentacoes`
```
Id_PPV, Data_Hora, Tecnico, TipoMovimento, CodProduto, Descricao, Qtde, Preco, Id
```
- PPV IDs seguem formato `PPV-0001`
- `TipoMovimento` com "devolu" inverte quantidade

### Colunas da `logs_ppo`
```
Id_ppo, Data_Acao, Hora_Acao, UsuEmail, acao, Status_Anterior, Status_Atual,
Dias_Na_Fase, Total_Dias_Aberto
```

### Colunas da `pedidos` (PPV)
```
id_pedido, cliente, tecnico, status, data, valor_total, observacao,
motivo_cancelamento, Motivo_Saida_Pedido, pedido_omie, email_usuario,
Id_Os, Tipo_Pedido
```

### Colunas da `Clientes` (importados do Omie)
```
id_omie, id_cliente, cnpj_cpf, razao_social, nome_fantasia,
email, telefone, endereco, cidade, estado, cep
```

---

## API Routes

### `GET /api/ordens`
Retorna todas as OS para o Kanban. Executa **auto-move** antes:
1. `Previsao_Execucao <= hoje` → move "Orçamento" para "Execução"
2. +1 dia em Execução → "Aguardando ordem Técnico" + métrica de atraso
3. `Previsao_Faturamento <= hoje` → move "Executada aguardando comercial" para "Executada aguardando cliente"

**Retorno:** `KanbanCard[]`

### `POST /api/ordens`
Cria nova OS. Gera ID sequencial (`OS-0001`), calcula totais (horas + km + peças + requisições - descontos).

**Body:**
```json
{
  "nomeCliente": "string", "cpfCliente": "string", "enderecoCliente": "string",
  "tecnicoResponsavel": "string", "tecnico2": "string",
  "tipoServico": "string", "revisao": "string", "projeto": "string",
  "servicoSolicitado": "string", "qtdHoras": 0, "qtdKm": 0,
  "ppv": "PPV-0001,PPV-0002", "gerarPPV": false,
  "descontoValor": 0, "descontoHora": 0, "descontoKm": 0,
  "previsaoExecucao": "2026-03-15", "previsaoFaturamento": "2026-03-20"
}
```
**Retorno:** `{ success, ordensAtualizadas, novaOsId, ppvGerado }`

### `GET /api/ordens/[id]`
Detalhes completos de uma OS com requisições e relatório.

### `PATCH /api/ordens/[id]`
Atualiza campos da OS. Recalcula totais, registra logs, sincroniza status com PPV.

### `PATCH /api/ordens/[id]/fase`
Mudança rápida de status. Bloqueia "Concluída" se não enviou ao Omie.
**Body:** `{ "status": "Execução" }`

### `POST /api/ordens/[id]/omie`
Envia OS para o Omie. Cria OS + Pedido de Venda (se tiver PPVs) + fecha PPVs.
**Retorno:** `{ sucesso, nCodOS, cNumOS, pedidoVenda?, pedidoVendaErro? }`

### `GET /api/clientes`
Lista clientes (Omie + Manuais). Com `?id=OMIE:123` retorna dados específicos.
**Retorno:** `{ chave: "OMIE:123", display: "Nome [CNPJ: xxx] (OMIE)" }[]`

### `POST /api/clientes/manual`
Cria cliente manual. **Body:** `{ nome, cpf, email, telefone, endereco, cidade }`

### `GET /api/tecnicos`
Lista técnicos. **Retorno:** `string[]`

### `GET /api/financeiro?ppv=PPV-0001,PPV-0002`
Resumo financeiro dos produtos nas PPVs.
**Retorno:** `{ descricao, qtde, valor }[]`

### `GET /api/logs?osId=OS-0001`
Histórico de ações de uma OS.
**Retorno:** `{ data, acao, usuario, extra }[]`

### `GET /api/buscas/projetos?termo=texto`
Busca projetos por nome (top 50, multi-termo).

### `GET /api/buscas/revisoes?termo=texto`
Busca revisões prontas.

### `GET /api/relatorio`
Relatório HTML de ordens abertas por fase (auto-print A4 landscape).

### `POST /api/sync` — Sync Manual
Chamado pelo botão "SINCRONIZAR" no header.
**Header:** `x-sync-manual: true`
**Retorno:** `{ sucesso, resultados: { clientes: { total, novos, atualizados }, projetos: { total, novos } }, erros?, timestamp }`

### `GET /api/sync` — Sync Automático (Cron)
Para cron job do Railway.
**Header:** `Authorization: Bearer {CRON_SECRET}` ou `x-railway-cron: true`

---

## Sync Omie → Supabase

- **Clientes:** Pagina `ListarClientes` do Omie, upsert na tabela `Clientes` por `id_omie`. Campos: nome_fantasia, razao_social, cnpj_cpf, email, telefone, endereco, cidade, estado, cep.
- **Projetos:** Pagina `ListarProjetos` do Omie, insere novos na tabela `Projeto` por `Nome_Projeto`.
- **Rate limit:** 400ms entre páginas, retry 60s se HTTP 429.
- **Manual:** Botão "SINCRONIZAR" no header → `POST /api/sync` com `x-sync-manual: true`.
- **Automático:** Configurar cron no Railway para chamar `GET /api/sync` a cada 6h.

---

## Sincronização de Status POS → PPV

Quando o status de uma OS muda, PPVs vinculados são atualizados:

| Status POS | → Status PPV |
|---|---|
| Execução | Em Andamento |
| Execução Procurando peças | Em Andamento |
| Execução aguardando peças | Em Andamento |
| Executada aguardando comercial | Aguardando Para Faturar |
| Executada aguardando cliente | Aguardando Para Faturar |

**3 pontos de disparo:**
1. `PATCH /api/ordens/[id]` — edição da OS
2. `PATCH /api/ordens/[id]/fase` — mudança rápida de fase
3. `GET /api/ordens` — auto-move por data de previsão

Pula PPVs Fechados ou Cancelados.

---

## Fases do Kanban (em ordem)

1. Orçamento
2. Orçamento enviado para o cliente e aguardando
3. Execução
4. Execução Procurando peças
5. Execução aguardando peças (em transporte)
6. Executada aguardando comercial
7. Aguardando outros
8. Aguardando ordem Técnico
9. Executada aguardando cliente
10. Concluída
11. Cancelada

---

## Valores Fixos

| Constante | Valor | Descrição |
|---|---|---|
| `VALOR_HORA` | R$ 193,00 | Valor por hora de serviço |
| `VALOR_KM` | R$ 2,80 | Valor por km rodado |

---

## Constantes Omie (lib/omie.ts)

| Constante | Valor | Descrição |
|---|---|---|
| Etapa OS | `"30"` | Executada |
| Categoria OS | `"1.01.02"` | Receita de Serviços |
| Categoria PV | `"1.01.03"` | Pedido de Venda |
| Conta Corrente | `1969919780` | Banco do Brasil |
| Serv. sol.aber.os | `2209673817` | Solicitação de Serviço |
| Serv. Hora | `1979758762` | Hora Trabalhada |
| Serv. KM | `1975974257` | KM Deslocamento |
| Revisões | `REVISAO_OMIE` | 110+ códigos por modelo/horas |

### Modelos de Revisão
2025, 5050, 6060, 6065, 6075, 8000, 9200, 9500, 86-110
Faixas: 50, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700, 3000h

---

## Funcionalidades

### Kanban com Tabs + Grid
- Tabs coloridas com contagem por fase
- Vista "Todas" agrupa cards por fase
- Cards: ID, cliente, valor, serviço, técnico, dias na fase, badges (PPV/Req/Rel)
- Badges de previsão: execução (âmbar) e faturamento (verde)
- Dropdown de fase no card

### OSDrawer (Criar/Editar OS)
- Busca de cliente multi-termo, seleção de técnico
- Busca de projeto/revisão via SearchModal (debounced 300ms)
- Auto-geração de PPV quando tipo = Revisão
- Alerta bomba injetora (600/1200/1800/2400/3000h)
- Previsão de execução e faturamento
- Botão "Enviar para Omie"
- Criação inicia com `qtdHoras = 1` por padrão
- **Seção Financeiro:** grid 2 colunas (Qtd. Horas + Qtd. KM) com hints de subtotal
- **Seção Descontos (colapsável):** toggle "Aplicar Descontos" com chevron
  - Desconto Horas (R$) — feedback: "de X p/ Y"
  - Desconto KM (R$) — feedback: "de X p/ Y"
  - Desconto Geral — campos % e R$ sincronizados bidirecionalmente (`syncDiscount`)
  - Rows com fundo `#F5F5F5`, borda preta `#333`, labels `#222`
  - Badge vermelho com total de descontos quando seção fechada
  - Auto-expande ao editar OS que já tem descontos
- **Otimizações do componente:**
  - Subtotais (`subtotalHoras`, `subtotalKm`, `subtotalBruto`) pré-calculados
  - `total` via `useMemo` (não `useCallback`)
  - `bombaAlerta` memoizado com `useMemo`
  - Handlers (`salvar`, `enviarParaOmie`, `syncDiscount`, `selectCliente`) em `useCallback`
  - ~30 objetos de estilo inline extraídos para constantes fora do componente
  - Tratamento de erro (`catch`) em todos os fetches (evita `loadingData` travado)
  - `descPorc` restaurado ao carregar OS no modo edição

### Template PDF (print/[id])
- Fonte Montserrat, tema preto/branco com detalhes em azul marinho (#1E3A5F)
- Dados completos do cliente (nome, razão social, CNPJ, email, telefone, endereço, cidade, estado, CEP)
- Sem assinaturas, email em 7pt cinza

### Sync Omie (lib/sync-omie.ts)
- Botão "SINCRONIZAR" no header com ícone giratório
- Sync de clientes e projetos do Omie → Supabase
- Paginação automática, rate limit 400ms

### Auto-Move por Data
- `Previsao_Execucao <= hoje` → Orçamento → Execução
- +1 dia em Execução → Aguardando ordem Técnico (+ métrica atraso)
- `Previsao_Faturamento <= hoje` → Executada aguardando comercial → Executada aguardando cliente

### Integração Omie
- Envio manual de OS para Omie (botão no drawer)
- Criação automática de Pedido de Venda se tiver PPVs
- Fechamento automático de PPVs após envio
- Sincronização de status POS → PPV

---

## Tipos Principais

### KanbanCard
```typescript
{
  id: string;           // "OS-0001"
  cliente: string;
  tecnico: string;
  data: string;         // "12/03/2026"
  dataFase: string;
  valor: string;        // "1.500,00"
  status: string;
  temPPV: boolean;
  temReq: boolean;
  temRel: boolean;
  servSolicitado: string;
  previsaoExecucao: string;
  previsaoFaturamento: string;
  diasAtraso: number;
}
```

### OrdemServico (DB)
```typescript
{
  Id_Ordem: string;     Status: string;           Data: string;
  Os_Cliente: string;   Cnpj_Cliente: string;     Endereco_Cliente: string;
  Os_Tecnico: string;   Os_Tecnico2: string;      Tipo_Servico: string;
  Revisao: string;      Projeto: string;          Serv_Solicitado: string;
  Serv_Realizado: string | null;
  Qtd_HR: number;       Valor_HR: number;         Qtd_KM: number;
  Valor_KM: number;     Valor_Total: number;      ID_PPV: string;
  Id_Req: string;       ID_Relatorio_Final: string;
  Ordem_Omie: string;   Motivo_Cancelamento: string;
  Desconto: number;     Desconto_Hora: number;    Desconto_KM: number;
  Previsao_Execucao: string | null;
  Previsao_Faturamento: string | null;
}
```

---

## SQL Necessários

```sql
-- Campos adicionais (já executados)
ALTER TABLE "Ordem_Servico"
  ADD COLUMN IF NOT EXISTS "Previsao_Execucao" DATE,
  ADD COLUMN IF NOT EXISTS "Previsao_Faturamento" DATE,
  ADD COLUMN IF NOT EXISTS "Desconto_Hora" NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "Desconto_KM" NUMERIC DEFAULT 0;
```

---

## Deploy (Railway)

- **Plataforma:** Railway
- **Build:** `npm run build`
- **Start:** `npm start`
- **Variáveis:** Configurar no painel do Railway (mesmas do .env.local)
- **Cron automático:** Configurar no Railway para chamar `GET /api/sync` com header `x-railway-cron: true` a cada 6h
