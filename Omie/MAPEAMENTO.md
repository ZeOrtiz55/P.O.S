# Mapeamento: Supabase → Omie OS

## Fonte dos dados
- **Origem:** Tabela no Supabase (nome a confirmar)
- **Destino:** `POST https://app.omie.com.br/api/v1/servicos/os/` → call `IncluirOS`

---

## Colunas do CSV (estrutura da tabela Supabase)

```
Id_Ordem, Os_Cliente, Cnpj_Cliente, Endereco_Cliente, Os_Tecnico, Data,
Serv_Solicitado, Causa, Serv_Realizado, Qtd_HR, Valor_HR, Qtd_KM, Valor_KM,
Valor_Total, Codigo_Servico, Status, ID_PPV, Id_Req, Projeto,
ID_Relatorio_Final, Ordem_Omie, Motivo_Cancelamento, Os_Tecnico2,
Revisao, Tipo_Servico, Desconto
```

---

## Mapeamento Campo a Campo

### Cabecalho

| Campo Supabase | Campo Omie | Transformação |
|---|---|---|
| `Id_Ordem` | `cCodIntOS` | direto (ex: "OS-0001") |
| `Cnpj_Cliente` | `nCodCli` | **lookup via API** — buscar cliente pelo CNPJ/CPF |
| `Data` | `dDtPrevisao` | converter `YYYY-MM-DD` → `DD/MM/YYYY` |
| *(fixo)* | `cEtapa` | sempre `"30"` (Executada) |
| *(fixo)* | `nQtdeParc` | sempre `1` |

### InformacoesAdicionais

| Campo Supabase | Campo Omie | Transformação |
|---|---|---|
| `Serv_Solicitado` | `cDadosAdicNF` | direto (texto livre) |
| `Os_Tecnico` | `cContato` | direto (nome do técnico) |
| *(fixo)* | `cCodCateg` | `"1.01.02"` (Receita de Serviços) |
| *(fixo)* | `nCodCC` | `1969919780` (Banco do Brasil) |

### Observacoes

| Campo Supabase | Campo Omie | Transformação |
|---|---|---|
| `Serv_Realizado` | `cObsOS` | direto (texto livre) |

### ServicosPrestados

#### Item 1 — Horas (sempre presente se Qtd_HR > 0)

| Campo Supabase | Campo Omie | Valor |
|---|---|---|
| *(fixo)* | `nCodServico` | `1979758762` (Hora Trabalhada) |
| `Qtd_HR` | `nQtde` | número de horas |
| `Valor_HR` | `nValUnit` | valor por hora (ex: 193) |
| `Desconto` | `nValorDesconto` | valor do desconto em R$ |

#### Item 2 — KM (somente se Qtd_KM > 0)

| Campo Supabase | Campo Omie | Valor |
|---|---|---|
| *(fixo)* | `nCodServico` | `1975974257` (KM Deslocamento) |
| `Qtd_KM` | `nQtde` | quantidade de KM |
| `Valor_KM` | `nValUnit` | valor por KM (ex: 2.80) |

### Email

```json
{ "cEnvBoleto": "N", "cEnvLink": "N", "cEnviarPara": "" }
```

---

## Campos Supabase sem mapeamento direto (informativos)

| Campo | Destino sugerido |
|---|---|
| `Projeto` (chassis/modelo) | concatenar em `cDadosAdicNF` |
| `ID_PPV` | concatenar em `cDadosAdicNF` |
| `Id_Req` | concatenar em `cDadosAdicNF` |
| `Causa` | concatenar em `cObsOS` |
| `Os_Tecnico2` | concatenar em `cContato` |
| `Revisao` | concatenar em `cObsOS` |
| `Tipo_Servico` | informativo — não enviado |
| `Motivo_Cancelamento` | informativo — OS canceladas são puladas |
| `Status` | informativo — todas vão para `cEtapa = "30"` |
| `Valor_Total` | não enviar — Omie recalcula |
| `Codigo_Servico` | coluna vazia no CSV — ignorar |
| `ID_Relatorio_Final` | informativo — não enviado |

---

## Regras de Negócio

### Deduplicação
- Se `Ordem_Omie` já estiver preenchido → **pular** a OS (já foi sincronizada)

### OS Canceladas
- `Status = "Cancelada"` → **pular** (não enviar para Omie)

### OS sem horas E sem KM
- `Qtd_HR = 0` E `Qtd_KM = 0` → enviar mesmo assim (OS com valor zero)

### Desconto
- `Desconto = 0` → não enviar campo `nValorDesconto`
- `Desconto > 0` → enviar em `ServicosPrestados[0].nValorDesconto`

---

## Fluxo de Execução

```
1. Buscar OS do Supabase onde Ordem_Omie IS NULL e Status != 'Cancelada'
2. Para cada OS:
   a. Buscar nCodCli pelo Cnpj_Cliente (cache local para evitar chamadas repetidas)
   b. Montar payload do IncluirOS
   c. POST /api/v1/servicos/os/ → IncluirOS
   d. Se sucesso → gravar nCodOS no campo Ordem_Omie do Supabase
   e. Se erro → logar e continuar para próxima OS
3. Relatório final: X criadas, Y erros, Z puladas
```

---

## Payload de Exemplo Completo

```json
{
  "call": "IncluirOS",
  "app_key": "...",
  "app_secret": "...",
  "param": [{
    "Cabecalho": {
      "cCodIntOS": "OS-0002",
      "cEtapa": "30",
      "dDtPrevisao": "14/01/2026",
      "nCodCli": 2202193639,
      "nQtdeParc": 1
    },
    "InformacoesAdicionais": {
      "cCodCateg": "1.01.02",
      "cDadosAdicNF": "Revisão de 50 Horas | PPV: PPV-0002 | Chassis: MDI07513LS0006165",
      "nCodCC": 1969919780,
      "cContato": "NICOLAS DARIO"
    },
    "Observacoes": {
      "cObsOS": "Modelo: 6075\nChassis: MDI07513LS0006165\nHorimetro:120\n\nServiço Realizado: Técnico realizou a revisão de 50 Horas..."
    },
    "ServicosPrestados": [
      {
        "nCodServico": 1979758762,
        "nQtde": 1,
        "nValUnit": 193,
        "nValorDesconto": 193
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
