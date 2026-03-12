"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { VALOR_HORA, VALOR_KM, TEXT_TEMPLATE, PHASES } from "@/lib/constants";
import type { ClienteOption, ClienteDados, Produto } from "@/lib/types";
import SearchModal from "./SearchModal";
import LogPanel from "./LogPanel";

interface OSDrawerProps {
  visible: boolean;
  mode: "create" | "edit";
  osId: string | null;
  clientes: ClienteOption[];
  tecnicos: string[];
  onClose: () => void;
  onSaved: () => void;
}

export default function OSDrawer({ visible, mode, osId, clientes, tecnicos, onClose, onSaved }: OSDrawerProps) {
  const [clienteChave, setClienteChave] = useState("");
  const [clienteInfo, setClienteInfo] = useState<ClienteDados | null>(null);
  const [status, setStatus] = useState("Orçamento");
  const [tecnico1, setTecnico1] = useState("");
  const [tecnico2, setTecnico2] = useState("");
  const [tipoServico, setTipoServico] = useState("Manutenção");
  const [projeto, setProjeto] = useState("");
  const [revisao, setRevisao] = useState("");
  const [servSolicitado, setServSolicitado] = useState(TEXT_TEMPLATE);
  const [ppv, setPpv] = useState("");
  const [qtdHoras, setQtdHoras] = useState(0);
  const [qtdKm, setQtdKm] = useState(0);
  const [descPorc, setDescPorc] = useState(0);
  const [descValor, setDescValor] = useState(0);
  const [descHoraValor, setDescHoraValor] = useState(0);
  const [descKmValor, setDescKmValor] = useState(0);
  const [ordemOmie, setOrdemOmie] = useState("");
  const [motivoCancel, setMotivoCancel] = useState("");
  const [relatorioTecnico, setRelatorioTecnico] = useState("");
  const [previsaoExecucao, setPrevisaoExecucao] = useState("");
  const [previsaoFaturamento, setPrevisaoFaturamento] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [totalPecas, setTotalPecas] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [showProjModal, setShowProjModal] = useState(false);
  const [showRevModal, setShowRevModal] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [requisicoes, setRequisicoes] = useState<Array<{ id: string; atualizada: boolean; material: string }>>([]);
  const [clienteFilter, setClienteFilter] = useState("");
  const [gerarPPV, setGerarPPV] = useState(false);
  const [enviandoOmie, setEnviandoOmie] = useState(false);

  const calcTotal = useCallback(() => {
    const sub = (qtdHoras * VALOR_HORA - descHoraValor) + (qtdKm * VALOR_KM - descKmValor) + totalPecas;
    return Math.max(0, sub - descValor);
  }, [qtdHoras, qtdKm, totalPecas, descValor, descHoraValor, descKmValor]);

  const loadPPV = useCallback(async (ppvId: string) => {
    if (!ppvId) { setProdutos([]); setTotalPecas(0); return; }
    const res = await fetch(`/api/financeiro?ppv=${encodeURIComponent(ppvId)}`);
    const list: Produto[] = await res.json();
    setProdutos(list);
    let tp = 0;
    list.forEach((p) => { tp += p.valor * p.qtde; });
    setTotalPecas(tp);
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (mode === "create") {
      setClienteChave(""); setClienteInfo(null); setStatus("Orçamento");
      setTecnico1(""); setTecnico2(""); setTipoServico("Manutenção");
      setProjeto(""); setRevisao(""); setServSolicitado(TEXT_TEMPLATE);
      setPpv(""); setQtdHoras(0); setQtdKm(0); setDescPorc(0); setDescValor(0); setDescHoraValor(0); setDescKmValor(0);
      setOrdemOmie(""); setMotivoCancel(""); setRelatorioTecnico("");
      setPrevisaoExecucao(""); setPrevisaoFaturamento("");
      setProdutos([]); setTotalPecas(0); setShowLogs(false); setRequisicoes([]);
      setGerarPPV(false); setLoadingData(false);
    }
    if (mode === "edit" && osId) {
      setLoadingData(true);
      fetch(`/api/ordens/${osId}`).then((r) => r.json()).then((d) => {
        if (!d) return;
        setClienteInfo({ nome: d.nomeCliente, cpf: d.cpfCliente || "", email: "", telefone: "", endereco: d.enderecoCliente || "" });
        setStatus(d.status || "Orçamento");
        setTecnico1(d.tecnicoResponsavel || ""); setTecnico2(d.tecnico2 || "");
        setTipoServico(d.tipoServico || "Manutenção"); setRevisao(d.revisao || "");
        setProjeto(d.projeto || "");
        setServSolicitado(d.servicoSolicitado || TEXT_TEMPLATE);
        setPpv(d.ppv || ""); setQtdHoras(d.qtdHoras || 0); setQtdKm(d.qtdKm || 0);
        setDescValor(parseFloat(d.descontoSalvo || 0));
        setDescHoraValor(parseFloat(d.descontoHora || 0));
        setDescKmValor(parseFloat(d.descontoKm || 0));
        setOrdemOmie(d.ordemOmie || ""); setMotivoCancel(d.motivoCancelamento || "");
        setRelatorioTecnico(d.relatorioTecnico || "");
        setPrevisaoExecucao(d.previsaoExecucao || "");
        setPrevisaoFaturamento(d.previsaoFaturamento || "");
        setRequisicoes(d.infoRequisicoes || []);
        if (d.ppv) loadPPV(d.ppv);
        setLoadingData(false);
      });
    }
  }, [visible, mode, osId, loadPPV]);

  const selectCliente = async (chave: string) => {
    setClienteChave(chave);
    if (!chave) return;
    const res = await fetch(`/api/clientes?id=${encodeURIComponent(chave)}`);
    const c: ClienteDados = await res.json();
    setClienteInfo(c);
  };

  const enviarParaOmie = async () => {
    if (!osId) return;
    if (!confirm("Deseja enviar esta OS para o Omie?")) return;
    setEnviandoOmie(true);
    try {
      const res = await fetch(`/api/ordens/${osId}/omie`, { method: "POST" });
      const result = await res.json();
      if (result.sucesso) {
        let msg = `OS enviada para o Omie com sucesso!\nNº Omie: ${result.cNumOS}`;
        if (result.pedidoVenda) msg += `\nPedido de Venda nº ${result.pedidoVenda}`;
        if (result.pedidoVendaErro) msg += `\nErro no Pedido de Venda: ${result.pedidoVendaErro}`;
        alert(msg);
        setOrdemOmie(String(result.nCodOS));
        setStatus("Concluída");
        onSaved?.();
      } else {
        alert(`Erro ao enviar para o Omie:\n${result.erro}`);
      }
    } catch (err) {
      alert("Erro de conexão ao enviar para o Omie.");
      console.error(err);
    }
    setEnviandoOmie(false);
  };

  const syncDiscount = (type: "P" | "V", value: number) => {
    const sub = qtdHoras * VALOR_HORA + qtdKm * VALOR_KM + totalPecas;
    if (sub <= 0) return;
    if (type === "P") { setDescPorc(value); setDescValor(parseFloat(((value / 100) * sub).toFixed(2))); }
    else { setDescValor(value); setDescPorc(parseFloat(((value / sub) * 100).toFixed(2))); }
  };

  const salvar = async () => {
    if (mode === "create" && !clienteChave) { alert("Selecione o Cliente"); return; }
    setSaving(true);
    const dados = {
      id: osId, nomeCliente: clienteInfo?.nome, cpfCliente: clienteInfo?.cpf,
      enderecoCliente: clienteInfo?.endereco, tecnicoResponsavel: tecnico1, tecnico2,
      tipoServico, revisao, projeto, servicoSolicitado: servSolicitado,
      qtdHoras, qtdKm, ppv, status: mode === "create" ? "Orçamento" : status,
      ordemOmie, motivoCancelamento: motivoCancel, descontoValor: descValor, descontoHora: descHoraValor, descontoKm: descKmValor,
      relatorioTecnico, previsaoExecucao, previsaoFaturamento,
      gerarPPV: mode === "create" && tipoServico === "Revisão" && gerarPPV,
    };
    try {
      const url = mode === "create" ? "/api/ordens" : `/api/ordens/${osId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
      const result = await res.json();
      if (!res.ok || result.erro) {
        alert(result.erro || "Erro ao salvar a OS.");
        setSaving(false);
        return;
      }
      setSaving(false);
      onClose();
      onSaved();
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("Erro ao salvar a OS.");
      setSaving(false);
    }
  };

  const filteredClientes = useMemo(() => {
    if (!clienteFilter) return [];
    const terms = clienteFilter.toLowerCase().split(/\s+/).filter(Boolean);
    return clientes.filter((c) => {
      const d = c.display.toLowerCase();
      return terms.every((t) => d.includes(t));
    }).slice(0, 30);
  }, [clienteFilter, clientes]);

  const bombaAlerta = tipoServico === "Revisão" && revisao && ["600", "1200", "1800", "2400", "3000"].some((h) => revisao.includes(h));
  const total = calcTotal();

  if (!visible) return null;

  return (
    <>
      <div className="drawer-overlay active">
        <div className="modal-container">
          <div className="drawer os-drawer">
            {/* Header */}
            <div className="os-header">
              <div className="os-header-left">
                <span className="os-header-title">
                  {mode === "create" ? "Nova Ordem de Serviço" : `${osId}`}
                </span>
                {mode === "edit" && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
                    padding: "4px 12px", borderRadius: 6,
                    background: status.includes("Exec") ? "#FEF3C7" : status === "Concluída" ? "#D1FAE5" : status === "Cancelada" ? "#FEE2E2" : "#E8E0D0",
                    color: status.includes("Exec") ? "#92400E" : status === "Concluída" ? "#065F46" : status === "Cancelada" ? "#991B1B" : "#1E3A5F",
                  }}>
                    {status}
                  </span>
                )}
              </div>
              <div className="os-header-actions">
                {mode === "edit" && (
                  <>
                    <button className="os-btn-ghost" onClick={() => window.open(`/print/${osId}`, "_blank")}>
                      <i className="fas fa-print" /> Imprimir
                    </button>
                    <button className="os-btn-ghost" onClick={() => setShowLogs(!showLogs)}>
                      <i className="fas fa-history" /> Log
                    </button>
                  </>
                )}
                <button className="os-btn-close" onClick={onClose}>
                  <i className="fas fa-times" />
                </button>
              </div>
            </div>

            {loadingData ? (
              <div className="os-loading">
                <div className="spinner-inner" style={{ width: 28, height: 28, borderColor: "#E0D6C8", borderTopColor: "#7A6E5D" }} />
                <span>Carregando dados...</span>
              </div>
            ) : (
              <>
                <div className="os-body">

                  {/* ── Summary card (edit mode) ── */}
                  {mode === "edit" && clienteInfo && (
                    <div className="os-summary">
                      <div className="os-summary-main">
                        <div className="os-summary-client">
                          <i className="fas fa-user" />
                          <div>
                            <div className="os-summary-name">{clienteInfo.nome}</div>
                            {clienteInfo.cpf && <div className="os-summary-sub">{clienteInfo.cpf}</div>}
                          </div>
                        </div>
                        <div className="os-summary-total">
                          R$ {total.toFixed(2).replace(".", ",")}
                        </div>
                      </div>
                      <div className="os-summary-details">
                        {projeto && <span><i className="fas fa-cog" /> {projeto}</span>}
                        {tecnico1 && <span><i className="fas fa-user-cog" /> {tecnico1}</span>}
                        <span><i className="fas fa-tag" /> {tipoServico}</span>
                      </div>
                    </div>
                  )}

                  {/* ── Cliente (create) ── */}
                  {mode === "create" && (
                    <div className="os-card">
                      <div className="os-card-title"><i className="fas fa-user" /> Cliente</div>
                      <div style={{ position: "relative" }}>
                        <i className="fas fa-search" style={{ position: "absolute", left: 14, top: 13, color: "#7A6E5D" }} />
                        <input type="text" placeholder="Buscar por nome, razão social ou CNPJ/CPF..." value={clienteFilter} onChange={(e) => setClienteFilter(e.target.value)} style={{ paddingLeft: 40, marginBottom: 0 }} />
                      </div>
                      {clienteFilter && (
                        <div className="client-search-results">
                          {filteredClientes.length === 0 ? (
                            <div style={{ padding: 16, textAlign: "center", color: "#7A6E5D", fontSize: 13 }}>Nenhum cliente encontrado</div>
                          ) : filteredClientes.map((c) => (
                            <div key={c.chave} className="client-search-item" onClick={() => { selectCliente(c.chave); setClienteFilter(""); }}>
                              <i className="fas fa-user-circle" style={{ color: "#7A6E5D" }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.display.split("[")[0].trim()}</div>
                                <div style={{ fontSize: 11, color: "#7A6E5D" }}>{c.display.includes("[") ? c.display.substring(c.display.indexOf("[")) : ""}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {clienteInfo && (
                        <div className="os-client-badge">
                          <i className="fas fa-check-circle" /> {clienteInfo.nome}
                          {clienteInfo.cpf && <span style={{ color: "#7A6E5D", marginLeft: 8 }}>({clienteInfo.cpf})</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Status ── */}
                  {mode === "edit" && (
                    <div className="os-card">
                      <div className="os-card-title"><i className="fas fa-flag" /> Status</div>
                      <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ fontWeight: 600, marginBottom: 0 }}>
                        {PHASES.map((p) => <option key={p}>{p}</option>)}
                      </select>
                      {status === "Concluída" && (
                        <div style={{ marginTop: 12 }}>
                          <label>N Ordem Omie</label>
                          <input type="text" value={ordemOmie} onChange={(e) => setOrdemOmie(e.target.value)} style={{ marginBottom: 0 }} />
                        </div>
                      )}
                      {status === "Cancelada" && (
                        <div style={{ marginTop: 12 }}>
                          <label>Motivo do Cancelamento</label>
                          <textarea rows={2} value={motivoCancel} onChange={(e) => setMotivoCancel(e.target.value)} style={{ marginBottom: 0 }} />
                        </div>
                      )}
                      {/* Botão Enviar para Omie */}
                      {!ordemOmie && (
                        <button
                          className="os-btn-omie"
                          onClick={enviarParaOmie}
                          disabled={enviandoOmie}
                        >
                          {enviandoOmie ? (
                            <><div className="spinner-inner" style={{ width: 14, height: 14, borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff", display: "inline-block", verticalAlign: "middle", marginRight: 8 }} /> Enviando...</>
                          ) : (
                            <><i className="fas fa-cloud-upload-alt" /> Enviar para Omie</>
                          )}
                        </button>
                      )}
                      {ordemOmie && (
                        <div className="os-omie-badge">
                          <i className="fas fa-check-circle" /> Enviado para Omie (ID: {ordemOmie})
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Equipe & Atendimento ── */}
                  <div className="os-card">
                    <div className="os-card-title"><i className="fas fa-users" /> Equipe &amp; Atendimento</div>
                    <div className="os-row">
                      <div style={{ flex: 1 }}>
                        <label>Técnico Responsável</label>
                        <select value={tecnico1} onChange={(e) => setTecnico1(e.target.value)}>
                          <option value="">Selecione...</option>
                          {tecnicos.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label>Segundo Técnico</label>
                        <select value={tecnico2} onChange={(e) => setTecnico2(e.target.value)}>
                          <option value="">Nenhum</option>
                          {tecnicos.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="os-row">
                      <div style={{ flex: 1 }}>
                        <label>Tipo de Atendimento</label>
                        <select value={tipoServico} onChange={(e) => setTipoServico(e.target.value)}>
                          <option value="Manutenção">Manutenção</option>
                          <option value="Revisão">Revisão</option>
                        </select>
                      </div>
                      <div style={{ flex: 2 }}>
                        <label>Projeto / Equipamento</label>
                        <input type="text" value={projeto} readOnly placeholder="Clique para pesquisar..." onClick={() => setShowProjModal(true)} style={{ cursor: "pointer", fontWeight: 600 }} />
                      </div>
                    </div>
                    {tipoServico === "Revisão" && (
                      <>
                        <div>
                          <label>Plano de Revisão</label>
                          <input type="text" value={revisao} readOnly placeholder="Clique para pesquisar revisão..." onClick={() => setShowRevModal(true)} style={{ cursor: "pointer", fontWeight: 600, marginBottom: 0 }} />
                        </div>
                        {mode === "create" && (
                          <div className="os-ppv-toggle" onClick={() => setGerarPPV(!gerarPPV)}>
                            <div className={`os-toggle ${gerarPPV ? "active" : ""}`}>
                              <div className="os-toggle-knob" />
                            </div>
                            <div className="os-ppv-toggle-info">
                              <span className="os-ppv-toggle-label">
                                <i className="fas fa-boxes" /> Gerar PPV automaticamente
                              </span>
                              <span className="os-ppv-toggle-desc">
                                Cria um PPV vinculado à OS com mesmo técnico e cliente
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {bombaAlerta && (
                      <div className="os-alert">
                        <i className="fas fa-exclamation-triangle" /> Lembrete: Oferecer limpeza na bomba injetora.
                      </div>
                    )}
                  </div>

                  {/* ── Previsões ── */}
                  <div className="os-card">
                    <div className="os-card-title"><i className="fas fa-calendar-alt" /> Previsões</div>
                    <div className="os-row">
                      <div style={{ flex: 1 }}>
                        <label>Previsão de Execução</label>
                        <input type="date" value={previsaoExecucao} onChange={(e) => setPrevisaoExecucao(e.target.value)} style={{ marginBottom: 0 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label>Previsão de Faturamento</label>
                        <input type="date" value={previsaoFaturamento} onChange={(e) => setPrevisaoFaturamento(e.target.value)} style={{ marginBottom: 0 }} />
                      </div>
                    </div>
                  </div>

                  {/* ── Descrição ── */}
                  <div className="os-card">
                    <div className="os-card-title"><i className="fas fa-align-left" /> Descrição do Serviço</div>
                    <textarea rows={10} value={servSolicitado} onChange={(e) => setServSolicitado(e.target.value)} style={{ fontFamily: "monospace", marginBottom: 0 }} />
                  </div>

                  {/* ── PPV & Requisições (edit) ── */}
                  {mode === "edit" && (
                    <div className="os-card">
                      <div className="os-card-title"><i className="fas fa-boxes" /> Materiais &amp; Requisições</div>
                      <label>PPV (Separe por vírgula)</label>
                      <input type="text" value={ppv} onChange={(e) => setPpv(e.target.value)} onBlur={() => loadPPV(ppv)} />
                      {produtos.length > 0 && (
                        <div className="os-produtos-list">
                          {produtos.map((p, i) => (
                            <div key={i} className="os-produto-item">
                              <span>{p.descricao} <b>(x{p.qtde})</b></span>
                              <span style={{ fontWeight: 600 }}>R$ {(p.valor * p.qtde).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {requisicoes.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <label>Requisições Vinculadas</label>
                          <div className="os-req-list">
                            {requisicoes.map((r, i) => (
                              <div key={i} className="os-req-item">
                                <span style={{ fontWeight: 600 }}>{r.id}</span>
                                <span className={`os-req-badge ${r.atualizada ? "ok" : ""}`}>{r.atualizada ? "OK" : "Pendente"}</span>
                                <span style={{ color: "#7A6E5D", flex: 1, textAlign: "right", fontSize: 12 }}>{r.material}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Financeiro ── */}
                  <div className="os-card os-card-financial">
                    <div className="os-card-title"><i className="fas fa-calculator" /> Financeiro</div>
                    <div className="os-financial-grid">
                      <div>
                        <label>Horas</label>
                        <input type="number" value={qtdHoras} onChange={(e) => setQtdHoras(parseFloat(e.target.value || "0"))} style={{ marginBottom: 0 }} />
                        <div className="os-field-hint">x R$ {VALOR_HORA.toFixed(2)} = R$ {(qtdHoras * VALOR_HORA).toFixed(2)}</div>
                      </div>
                      <div>
                        <label>Desc. Hora R$</label>
                        <input type="number" value={descHoraValor} step={0.01} onChange={(e) => setDescHoraValor(parseFloat(e.target.value || "0"))} style={{ marginBottom: 0 }} />
                      </div>
                      <div>
                        <label>KM</label>
                        <input type="number" value={qtdKm} onChange={(e) => setQtdKm(parseFloat(e.target.value || "0"))} style={{ marginBottom: 0 }} />
                        <div className="os-field-hint">x R$ {VALOR_KM.toFixed(2)} = R$ {(qtdKm * VALOR_KM).toFixed(2)}</div>
                      </div>
                      <div>
                        <label>Desc. KM R$</label>
                        <input type="number" value={descKmValor} step={0.01} onChange={(e) => setDescKmValor(parseFloat(e.target.value || "0"))} style={{ marginBottom: 0 }} />
                      </div>
                      <div>
                        <label>Desconto Geral %</label>
                        <input type="number" value={descPorc} step={0.01} onChange={(e) => syncDiscount("P", parseFloat(e.target.value || "0"))} style={{ marginBottom: 0 }} />
                      </div>
                      <div>
                        <label>Desconto Geral R$</label>
                        <input type="number" value={descValor} step={0.01} onChange={(e) => syncDiscount("V", parseFloat(e.target.value || "0"))} style={{ marginBottom: 0 }} />
                      </div>
                    </div>
                    <div className="os-total-bar">
                      <div className="os-total-breakdown">
                        <span>Horas: R$ {(qtdHoras * VALOR_HORA - descHoraValor).toFixed(2)}</span>
                        <span>KM: R$ {(qtdKm * VALOR_KM - descKmValor).toFixed(2)}</span>
                        {totalPecas > 0 && <span>Peças: R$ {totalPecas.toFixed(2)}</span>}
                        {descValor > 0 && <span>Desc. Geral: -R$ {descValor.toFixed(2)}</span>}
                      </div>
                      <div className="os-total-value">
                        R$ {total.toFixed(2).replace(".", ",")}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="os-footer">
                  <button className="os-btn-cancel" onClick={onClose}>Cancelar</button>
                  <button className="os-btn-save" onClick={salvar} disabled={saving}>
                    {saving ? "Salvando..." : mode === "create" ? "Criar Ordem" : "Salvar Alterações"}
                  </button>
                </div>
              </>
            )}
          </div>

          {mode === "edit" && <LogPanel osId={osId} visible={showLogs} />}
        </div>
      </div>

      <SearchModal title="Pesquisar Equipamento / Chassis" placeholder="Digite chassis, modelo ou número..." apiUrl="/api/buscas/projetos" paramName="termo" visible={showProjModal} onClose={() => setShowProjModal(false)}
        onSelect={(item) => {
          const nome = item.nome || "";
          setProjeto(nome);
          if (!servSolicitado || servSolicitado.trim() === "" || servSolicitado === TEXT_TEMPLATE) {
            setServSolicitado(`Modelo: ${nome}\nChassis: ${nome}\nHorimetro: \n\nSolicitação do cliente: \nServiço Realizado: `);
          } else {
            const lines = servSolicitado.split("\n");
            if (lines[0]?.trim() === "Modelo:") lines[0] = "Modelo: " + nome;
            if (lines[1]?.trim() === "Chassis:") lines[1] = "Chassis: " + nome;
            setServSolicitado(lines.join("\n"));
          }
        }}
        renderItem={(item) => item.nome || ""}
      />

      <SearchModal title="Pesquisar Revisão Pronta" placeholder="Digite termos da revisão..." apiUrl="/api/buscas/revisoes" paramName="termo" visible={showRevModal} onClose={() => setShowRevModal(false)}
        onSelect={(item) => setRevisao(item.descricao || "")}
        renderItem={(item) => item.descricao || ""}
      />
    </>
  );
}
