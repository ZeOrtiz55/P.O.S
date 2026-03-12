# Omie API — Documentação de Referência

## Padrão Geral

- **Protocolo:** RPC via HTTP POST
- **Base URL:** `https://app.omie.com.br/api/v1/`
- **Content-Type:** `application/json`
- **Autenticação:** dentro do corpo JSON (`app_key` + `app_secret`)

### Estrutura de toda requisição

```json
{
  "call": "NomeDoMetodo",
  "app_key": "sua_app_key",
  "app_secret": "seu_app_secret",
  "param": [
    { "campo1": "valor1", "campo2": "valor2" }
  ]
}
```

> `param` é **sempre um array com um único objeto**.

---

## Credenciais do Projeto

> ⚠️ Mover para variáveis de ambiente antes de ir para produção.
> As credenciais estão expostas nos arquivos da pasta OS/ — revogar e gerar novas.

```
OMIE_APP_KEY=2729522270475
OMIE_APP_SECRET=113d785bb86c48d064889d4d73348131
```

---

## Endpoints Relevantes

### 1. Ordens de Serviço — `/api/v1/servicos/os/`

#### Métodos disponíveis
| Método | Descrição |
|---|---|
| `IncluirOS` | Cria nova OS |
| `AlterarOS` | Altera OS existente |
| `ConsultarOS` | Busca por `cCodIntOS`, `nCodOS` ou `cNumOS` |
| `ExcluirOS` | Remove OS |
| `ListarOS` | Lista com paginação |
| `StatusOS` | Retorna status da OS |
| `TrocarEtapaOS` | Move OS para outra etapa do kanban |

#### Etapas (cEtapa)
| Código | Nome no Omie |
|---|---|
| `"10"` | Orçamento |
| `"20"` | Execução |
| `"30"` | Executada ← **usaremos este** |
| `"40"` | Aguardando (observações) |
| `"50"` | Faturado |
| `"60"` | Garantia |

#### Estrutura completa do `IncluirOS`

```json
{
  "call": "IncluirOS",
  "app_key": "...",
  "app_secret": "...",
  "param": [{
    "Cabecalho": {
      "cCodIntOS": "OS-0001",
      "cEtapa": "30",
      "dDtPrevisao": "14/01/2026",
      "nCodCli": 2202193639,
      "nQtdeParc": 1
    },
    "InformacoesAdicionais": {
      "cCodCateg": "1.01.02",
      "cDadosAdicNF": "Serviço solicitado pelo cliente",
      "nCodCC": 1969919780,
      "cContato": "DANILO DE SOUZA"
    },
    "Observacoes": {
      "cObsOS": "Serviço realizado: ..."
    },
    "ServicosPrestados": [
      {
        "nCodServico": 1979758762,
        "nQtde": 2,
        "nValUnit": 193,
        "nValorDesconto": 0
      },
      {
        "nCodServico": 1975974257,
        "nQtde": 82,
        "nValUnit": 2.8
      }
    ],
    "Email": {
      "cEnvBoleto": "N",
      "cEnvLink": "N",
      "cEnviarPara": ""
    }
  }]
}
```

#### Resposta de sucesso do `IncluirOS`
```json
{
  "cNumOS": "4506",
  "nCodOS": 123456789,
  "cStatus": "OK"
}
```

#### Campos do `Cabecalho`
`cCodIntOS`, `nCodOS`, `cNumOS`, `cCodIntCli`, `nCodCli`, `dDtPrevisao`, `cEtapa`, `nCodVend`, `nQtdeParc`, `cCodParc`, `nValorTotal`, `cCancelada`, `cFaturada`

#### Campos do `InformacoesAdicionais`
`cCodCateg`, `nCodCC`, `cNumPedido`, `cNumContrato`, `cContato`, `cDadosAdicNF`, `cCodObra`, `nCodProj`

#### Campos do `ServicosPrestados` (por item)
`nCodServico`, `cCodIntServico`, `nQtde`, `nValUnit`, `cDescServ`, `cTpDesconto`, `nValorDesconto`, `nAliqDesconto`, `cDadosAdicItem`, `nSeqItem`, `nIdItem`, `cAcaoItem`

---

### 2. Serviços — `/api/v1/servicos/servico/`

> ⚠️ Paginação diferente dos outros endpoints: usa `nPagina`/`nRegPorPagina` em vez de `pagina`/`registros_por_pagina`.

#### Métodos disponíveis
| Método | Descrição |
|---|---|
| `ListarCadastroServico` | Lista serviços cadastrados |
| `ConsultarCadastroServico` | Busca serviço específico |
| `IncluirCadastroServico` | Cria serviço |
| `AlterarCadastroServico` | Altera serviço |
| `UpsertCadastroServico` | Cria ou atualiza |
| `ExcluirCadastroServico` | Remove serviço |

---

### 3. Clientes — `/api/v1/geral/clientes/`

#### Métodos relevantes
| Método | Descrição |
|---|---|
| `ListarClientes` | Lista com paginação |
| `ConsultarCliente` | Busca por `codigo_cliente_omie` ou `codigo_cliente_integracao` |
| `UpsertClienteCpfCnpj` | Cria ou atualiza cliente pelo CPF/CNPJ ← **útil para lookup** |

#### Campos principais
```json
{
  "razao_social": "NOME DO CLIENTE",
  "cnpj_cpf": "07.974.185/0006-99",
  "codigo_cliente_integracao": "ID_EXTERNO",
  "endereco": "Fazenda São Carlos"
}
```

---

### 4. Contas Correntes — `/api/v1/geral/contacorrente/`

| Método | Descrição |
|---|---|
| `ListarContasCorrentes` | Lista contas |
| `PesquisarContaCorrente` | Busca específica |

**IDs conhecidos:**
- `1969919780` → Banco do Brasil

---

## Tratamento de Erros

| HTTP | Situação | Ação |
|---|---|---|
| 200 | Sucesso | Processar resposta |
| 429 | Rate limit | Aguardar 60s e tentar novamente |
| 425 | Throttling | Parsear tempo de espera da resposta |
| 500 com `faultstring` | Erro de negócio Omie | Logar e pular registro |

```json
// Resposta de erro
{
  "faultstring": "Descrição do erro",
  "faultcode": "OMIE-ERR-001"
}
```

---

## Padrão do SDK TypeScript (omie-sdk-main)

```typescript
// Estrutura base — classe abstrata Api
export abstract class Api {
  constructor(credentials?: { key: string; secret: string })
  protected async call(endpoint: string, action: string, data?: unknown): Promise<any>
}

// Cada módulo estende Api
export class Clientes extends Api {
  listar(data: IClientesListRequest): Promise<IClientesListFullResponse>
  upsertPorCpfCnpj(data: IClientesCadastro): Promise<IClientesStatus>
  // ...
}
```

> O SDK **não possui módulo OS** — será criado do zero seguindo este padrão.
