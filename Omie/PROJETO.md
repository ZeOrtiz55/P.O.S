# Projeto: Integração Omie ↔ Supabase

## Objetivo
Criar um script TypeScript que lê Ordens de Serviço do Supabase e as importa automaticamente para o Omie via API REST.

---

## Status Atual: PLANEJAMENTO CONCLUÍDO — aguardando dados de conexão

### Próximos passos pendentes (respostas do usuário)
- [ ] URL do projeto Supabase + chave de acesso (anon ou service_role)
- [ ] Nome da tabela no Supabase
- [ ] Confirmar: é importação única ou sincronização contínua?
- [ ] Confirmar: gravar `nCodOS` retornado de volta no Supabase?
- [ ] Ambiente de execução: Node.js standalone, dentro de projeto existente, ou Edge Function do Supabase?

---

## Arquivos de Referência neste Projeto

| Arquivo | Conteúdo |
|---|---|
| `OMIE_API.md` | Documentação completa da API Omie (padrão RPC, endpoints, campos) |
| `OMIE_SERVICOS.md` | Lista completa dos 210 serviços cadastrados na Omie (extraída via API) |
| `MAPEAMENTO.md` | Mapeamento campo a campo: CSV/Supabase → Omie OS |
| `PROJETO.md` | Este arquivo — status e próximos passos |

---

## Estrutura de Pastas Estudadas

```
Omie/
├── OS/                          ← Scripts Google Apps Script de referência
│   ├── Criar OS.txt             ← Exemplo funcional de IncluirOS
│   ├── Criar Tarefa Na OS.txt   ← Versão modular
│   ├── Descobrir Servicos.txt   ← ListarCadastroServico
│   ├── Listar CC.txt            ← ListarContasCorrentes
│   ├── Listar Servicos.txt      ← Debug de estrutura
│   ├── OrdemServicoCodigo.html  ← Doc oficial: /servicos/servico/
│   └── OrdemServicoEtapa.html   ← Doc oficial: /servicos/os/
├── omie-sdk-main/               ← SDK TypeScript oficial (base para novo módulo)
├── ApiOmieSDK-main/             ← SDK Python de referência
└── api-examples-master-by-omie/ ← Exemplos Node.js, PHP, cURL
```

---

## Decisões Tomadas

| Decisão | Valor |
|---|---|
| Linguagem | TypeScript |
| Fonte dos dados | Supabase (não CSV local) |
| Etapa Omie para todas as OS | `"30"` (Executada) |
| Serviço de horas | `nCodServico: 1979758762` (Hora Trabalhada, R$193/h) |
| Serviço de KM | `nCodServico: 1975974257` (KM Deslocamento, R$2,80/km) |
| KM zero | Não incluir item de KM na OS |
| OS já com Ordem_Omie preenchido | Pular (deduplicação) |
| Credenciais | Variáveis de ambiente (não hardcoded) |
