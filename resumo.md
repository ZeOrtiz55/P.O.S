# Nova Tratores POS — Resumo do Sistema

## Stack
- **Next.js 16.1.6** (App Router, React 19, TypeScript)
- **Supabase** (PostgreSQL)
- **CSS puro** com variáveis CSS (sem Tailwind)
- **Fonte:** Poppins (Google Fonts)
- **Ícones:** Font Awesome 6.4

---

## Estrutura de Pastas

```
pos/
├── app/
│   ├── page.tsx                    ← Página principal (orquestra tudo)
│   ├── globals.css                 ← Todos os estilos
│   ├── layout.tsx                  ← Layout raiz
│   ├── print/[id]/page.tsx         ← Página de impressão da OS
│   └── api/
│       ├── ordens/
│       │   ├── route.ts            ← GET (lista kanban) + POST (criar OS)
│       │   └── [id]/
│       │       ├── route.ts        ← GET (detalhes) + PATCH (editar OS)
│       │       ├── fase/route.ts   ← PATCH (mudança rápida de fase do card)
│       │       └── omie/route.ts   ← POST (enviar OS para Omie manualmente)
│       ├── clientes/
│       │   ├── route.ts            ← GET (listar/buscar clientes)
│       │   └── manual/route.ts     ← POST (criar cliente manual)
│       ├── tecnicos/route.ts       ← GET (listar técnicos)
│       ├── financeiro/route.ts     ← GET (produtos do PPV)
│       ├── logs/route.ts           ← GET (logs de uma OS)
│       ├── relatorio/route.ts      ← GET (relatório geral HTML)
│       └── buscas/
│           ├── projetos/route.ts   ← GET (busca equipamentos/chassis)
│           └── revisoes/route.ts   ← GET (busca revisões prontas)
├── components/
│   ├── Header.tsx                  ← Barra superior (busca, botões)
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
│   └── sync-ppv.ts                ← Sincronização de status POS → PPV
├── Omie/                           ← Documentação e exemplos da API Omie
└── .env.local                      ← Credenciais (Supabase + Omie)
```

---

## Tabelas Supabase

| Constante | Tabela | Descrição |
|---|---|---|
| `TBL_OS` | `Ordem_Servico` | Ordens de serviço |
| `TBL_CLIENTES` | `Clientes` | Clientes importados |
| `TBL_CLIENTES_MANUAIS` | `Clientes_Manuais` | Clientes cadastrados manualmente |
| `TBL_TECNICOS` | `Tecnicos_Appsheet` | Técnicos |
| `TBL_ITENS` | `movimentacoes` | Itens do PPV (peças/materiais) |
| `TBL_PROJETOS_DB` | `Projeto` | Equipamentos/chassis |
| `TBL_LOGS_PPO` | `logs_ppo` | Logs de ações nas OS |
| `TBL_LOGS_PPV` | `logs_ppv` | Logs de ações nos PPVs |
| `TBL_PEDIDOS` | `pedidos` | Pedidos de venda (PPV) |
| `TBL_REQ_SOL` | `Solicitacao_Requisicao` | Solicitações de requisição |
| `TBL_REQ_ATT` | `Atualizar_Req` | Requisições atualizadas |
| `TBL_REV_PRONTAS` | `Revisoes_Pronta` | Planos de revisão prontos |

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
- `id_pedido` formato `PPV-0001`
- `pedido_omie` — numero do Pedido de Venda gerado no Omie
- `Id_Os` — vinculo com a OS

### Colunas da `logs_ppv`
```
id_ppv, data_hora, acao, usuario_email
```

### Colunas da `Revisoes_Pronta`
```
IdRevisoes, DescricaoCompleta
```

---

## 10 Fases do Kanban

1. Orçamento
2. Orçamento enviado para o cliente e aguardando
3. Execução
4. Execução Procurando peças
5. Execução aguardando peças (em transporte)
6. Executada
7. Executada aguardando cliente
8. Executada aguardando comercial
9. Concluída
10. Cancelada

---

## Valores Fixos

| Constante | Valor |
|---|---|
| `VALOR_HORA` | R$ 193,00 |
| `VALOR_KM` | R$ 2,80 |

---

## Funcionalidades Implementadas

### Kanban com Tabs + Grid
- Tabs coloridas com contagem por fase
- Vista "Todas" agrupa cards por fase com separadores visuais
- Cards mostram: ID, cliente, valor, serviço, técnico, dias na fase, badges (PPV/Req/Rel)
- Badges de data: previsão de execução (âmbar) e faturamento (verde)
- **Dropdown de fase no card** — muda fase direto sem abrir o drawer

### OSDrawer (Criar/Editar OS)
- **Modo criar:** busca de cliente com multi-termo, seleção de técnico, tipo (Manutenção/Revisão)
- **Modo editar:** summary card, status, materiais, requisições, financeiro
- Busca de projeto/equipamento via SearchModal (debounced, 300ms)
- Busca de revisão pronta via SearchModal
- **Auto-geração de PPV** — toggle quando tipo = Revisão no modo criar
- Alerta de bomba injetora para revisões de 600/1200/1800/2400/3000h
- Cálculo financeiro: horas + KM + peças - desconto
- Campo de desconto geral sincronizado (% ↔ R$)
- **Campos de desconto separados:** "Desc. Hora R$" e "Desc. KM R$" (alinhados com Omie)
- Previsão de execução e faturamento (campos date)
- **Botão "Enviar para Omie"** — envia manualmente a OS para o Omie
- **Salvar sem fechar** — ao salvar, o drawer permanece aberto e recarrega os dados

### PhaseAccordion — Grupos Colapsáveis
- Grupos "Concluída" e "Cancelada" iniciam colapsados por padrão
- Chevron com animação de rotação no header do grupo
- Clique no header expande/colapsa

### Estilo do Drawer
- Fonte base: 15px (antes padrão do navegador)
- Labels: 13px
- Inputs/selects/textareas: 15px

### Auto-Move por Data
- Executado no GET `/api/ordens` antes de retornar dados
- `Previsao_Execucao <= hoje` → move de Orçamento para Execução
- `Previsao_Faturamento <= hoje` → move de Executada para Executada aguardando cliente

### PPV Automático (Revisão)
- Ao criar OS de revisão, toggle "Gerar PPV automaticamente"
- Gera ID no formato `PPV-XXXX` (incrementa do maior existente)
- Vincula ao campo `ID_PPV` da OS
- Registra log "PPV gerado automaticamente"
- Itens são adicionados depois na tabela `movimentacoes`

### Integração Omie — Ordem de Serviço
- **Arquivo:** `lib/omie.ts`
- **Rota:** `POST /api/ordens/[id]/omie`
- **Botão manual** no drawer (não automático)
- Busca `nCodCli` pelo CNPJ (cache → Supabase → API Omie)
- Busca `nCodProj` pelo nome do projeto (paginado na API Omie)
- Busca `nCodVend` pelo nome do(s) técnico(s) — match normalizado sem acentos
- Monta payload `IncluirOS` com:
  - `cEtapa: "30"` (Executada)
  - `cCodCateg: "1.01.02"` (Receita de Serviços)
  - `nCodCC: 1969919780` (Banco do Brasil)
  - `nCodVend` — vendedor (técnico) em Cabecalho
  - `nCodProj` — projeto em InformacoesAdicionais
  - Serviço sol.aber.os: `nCodServico: 2209673817` — sempre incluso, `cDescServ` recebe `Serv_Solicitado`
  - Serviço revisão: mapa `REVISAO_OMIE` com 110+ códigos por modelo/horas (só quando Tipo_Servico = "Revisão")
  - Item horas: `nCodServico: 1979758762` — com `nValorDesconto` se houver desconto de hora
  - Item KM: `nCodServico: 1975974257` — com `nValorDesconto` se houver desconto de KM
- Grava `nCodOS` no campo `Ordem_Omie` após sucesso
- Registra log "OS enviada para Omie"
- Badge verde quando já enviada

### Integração Omie — Pedido de Venda (ao enviar OS)
- **Função:** `criarPedidoVendaNoOmie()` em `lib/omie.ts`
- Executado automaticamente ao enviar OS quando existem PPVs vinculados
- Fluxo:
  1. Busca produtos dos PPVs na tabela `movimentacoes`, agrega por `CodProduto` (desconta devoluções)
  2. Consulta `codigo_produto` interno do Omie via `ConsultarProduto` (campo `codigo` = `CodProduto`)
  3. Monta payload `IncluirPedido`:
     - `codigo_pedido_integracao: "PV-{Id_Ordem}"`
     - `etapa: "10"` (Aprovado)
     - `codigo_categoria: "1.01.03"`
     - `numero_contrato: Id_Ordem` (cross-reference OS ↔ Pedido)
     - `det[]`: produtos com `codigo_produto`, `quantidade`, `valor_unitario`
  4. Salva número do pedido gerado em `pedido_omie` nos PPVs
- Se não houver produtos (ou todos devolvidos), pula a criação
- Erro no PV não impede criação da OS

### Fechamento de PPVs ao enviar OS
- **Função:** `fecharPPVsVinculados()` em `lib/omie.ts`
- Executado após criação do Pedido de Venda
- Para cada PPV: atualiza status para "Fechado" e registra log em `logs_ppv`
- Pula PPVs já Fechados ou Cancelados

### Sincronização de Status POS → PPV
- **Arquivo:** `lib/sync-ppv.ts` (novo)
- **Mapeamento** (`POS_TO_PPV_STATUS` em `lib/constants.ts`):
  - Execução / Exec. Procurando peças / Exec. aguardando peças → PPV "Em Andamento"
  - Executada / Exec. aguardando cliente / Exec. aguardando comercial → PPV "Aguardando Para Faturar"
- **3 pontos de disparo:**
  1. `PATCH /api/ordens/[id]` — edição da OS
  2. `PATCH /api/ordens/[id]/fase` — mudança rápida de fase (drag/dropdown)
  3. `GET /api/ordens` — auto-move por data de previsão
- Lógica: busca `ID_PPV` da OS, separa por vírgula, atualiza status de cada PPV, registra log em `logs_ppv`
- Pula PPVs Fechados ou Cancelados

### Mudança Rápida de Fase
- **Rota:** `PATCH /api/ordens/[id]/fase`
- Dropdown `<select>` no topo de cada card
- Atualização otimista no frontend
- Registra log "Mudança rápida para [fase]"

### Busca
- **Clientes:** multi-termo no OSDrawer (filtra por nome, razão social, CNPJ/CPF)
- **Projetos:** SearchModal com multi-termo (cada palavra vira wildcard separado)
- **Revisões:** SearchModal com busca ilike
- **Header:** busca global por cliente ou ID da OS

### Impressão
- `GET /print/[id]` — página HTML formatada para impressão A4
- Dados do cliente, técnico, serviço, peças, financeiro
- Auto-print via `window.onload`

### Logs
- Cada ação gera entrada em `logs_ppo`
- LogPanel mostra histórico no drawer (botão "Log")
- Calcula dias na fase e dias total aberto

---

## Credenciais (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://yvwwqxunabvmmqzznrxl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
OMIE_APP_KEY=2729522270475
OMIE_APP_SECRET=113d785bb86c48d064889d4d73348131
```

---

## Constantes Omie (lib/omie.ts)

| Constante | Valor | Descrição |
|---|---|---|
| Etapa OS | `"30"` | Executada |
| Categoria OS | `"1.01.02"` | Receita de Serviços |
| Categoria PV | `"1.01.03"` | Pedido de Venda |
| Conta Corrente | `1969919780` | Banco do Brasil |
| Serv. sol.aber.os | `2209673817` | Solicitação de Serviço (descrição do serviço) |
| Serv. Hora | `1979758762` | Hora Trabalhada (R$193/h) |
| Serv. KM | `1975974257` | KM Deslocamento (R$2,80/km) |
| Revisões | `REVISAO_OMIE` | 110+ códigos por modelo/horas |

### Modelos de Revisão
2025, 5050, 6060, 6065, 6075, 8000, 9200, 9500, 86-110
Faixas de horas: 50, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700, 3000
Chave no mapa: `rev{modelo}.{horas}` → `nCodServ`

---

## Estilo Visual
- Background: `#F1F5F9`
- Cards: branco com `border-radius: 12px`
- Drawer: fundo `#F8FAFC`, cards brancos
- Footer: botão salvar escuro `#1E293B`
- Botão Omie: azul `#1E40AF`
- Sem emojis, sem cores chamativas, limpo e neutro

---

## SQL Executados

```sql
-- Campos de desconto por serviço
ALTER TABLE "Ordem_Servico"
  ADD COLUMN "Desconto_Hora" double precision DEFAULT 0,
  ADD COLUMN "Desconto_KM" double precision DEFAULT 0;
```
