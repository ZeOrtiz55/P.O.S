import { supabase } from "@/lib/supabase";
import { TBL_OS, TBL_ITENS, TBL_REQ_ATT, TBL_CLIENTES, TBL_CLIENTES_MANUAIS, VALOR_HORA, VALOR_KM } from "@/lib/constants";
import { formatarDataBR, safeGet } from "@/lib/utils";

async function buscarDadosCliente(cnpj: string) {
  if (!cnpj) return null;
  const { data: omie } = await supabase.from(TBL_CLIENTES).select("*").eq("cnpj_cpf", cnpj).limit(1);
  if (omie && omie.length > 0) {
    const c = omie[0];
    return {
      nome: c.nome_fantasia || c.razao_social || "",
      razaoSocial: c.razao_social || "",
      cnpj: c.cnpj_cpf || "",
      email: c.email || "",
      telefone: c.telefone || "",
      endereco: c.endereco || "",
      cidade: c.cidade || "",
      estado: c.estado || "",
      cep: c.cep || "",
    };
  }
  const { data: manual } = await supabase.from(TBL_CLIENTES_MANUAIS).select("*").eq("Cli_Cpf_Cnpj", cnpj).limit(1);
  if (manual && manual.length > 0) {
    const c = manual[0];
    return {
      nome: c.Cli_Nome || "",
      razaoSocial: c.Cli_Nome || "",
      cnpj: c.Cli_Cpf_Cnpj || "",
      email: c.Cli_Email || "",
      telefone: c.Cli_Fone || "",
      endereco: c.Cli_Endereco || "",
      cidade: c.Cli_Cidade || "",
      estado: "",
      cep: c.Cli_CEP || "",
    };
  }
  return null;
}

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idOs } = await params;
  const { data: res } = await supabase.from(TBL_OS).select("*").eq("Id_Ordem", idOs).limit(1);
  if (!res || !res.length) return <div>OS não encontrada</div>;

  const row = res[0];
  const ppvStr = safeGet(row, "ID_PPV") as string || "";
  const listaIds = ppvStr.split(",").map((s) => s.trim()).filter(Boolean);

  const cnpjOs = safeGet(row, "Cnpj_Cliente") as string || "";
  const cli = await buscarDadosCliente(cnpjOs);
  const nomeCliente = cli?.nome || (safeGet(row, "Os_Cliente") as string) || "";
  const razaoSocial = cli?.razaoSocial || "";
  const emailCliente = cli?.email || "";
  const telefoneCliente = cli?.telefone || "";
  const enderecoCliente = cli?.endereco || (safeGet(row, "Endereco_Cliente") as string) || "";
  const cidadeCliente = cli?.cidade || "";
  const estadoCliente = cli?.estado || "";
  const cepCliente = cli?.cep || "";
  const cnpjCliente = cli?.cnpj || cnpjOs;

  let produtos: Array<{ descricao: string; qtde: number; valor: number }> = [];
  let vPecas = 0;
  if (listaIds.length) {
    const { data: items } = await supabase.from(TBL_ITENS).select("*").in("Id_PPV", listaIds);
    const resumo: Record<string, { descricao: string; qtde: number; totalFin: number }> = {};
    (items || []).forEach((item) => {
      const cod = item.CodProduto;
      const preco = parseFloat(item.Preco || 0);
      let qtd = Math.abs(parseFloat(item.Qtde || 0));
      if (String(item.TipoMovimento || "").toLowerCase().includes("devolu")) qtd = -qtd;
      if (!resumo[cod]) resumo[cod] = { descricao: item.Descricao, qtde: 0, totalFin: 0 };
      resumo[cod].qtde += qtd;
      resumo[cod].totalFin += preco * qtd;
    });
    produtos = Object.values(resumo).filter((p) => p.qtde !== 0).map((p) => ({ descricao: p.descricao, qtde: p.qtde, valor: p.qtde !== 0 ? p.totalFin / p.qtde : 0 }));
    produtos.forEach((p) => { vPecas += p.valor * p.qtde; });
  }

  let vReq = 0;
  for (const rid of listaIds) {
    const { data } = await supabase.from(TBL_REQ_ATT).select("ReqValor").eq("ReqREF", rid);
    if (data && data.length > 0) vReq += parseFloat(data[0].ReqValor || 0);
  }

  const qtdHoras = parseFloat(safeGet(row, "Qtd_HR") as string || "0");
  const qtdKm = parseFloat(safeGet(row, "Qtd_KM") as string || "0");
  const vHoras = qtdHoras * VALOR_HORA;
  const vKmTotal = qtdKm * VALOR_KM;
  const descHora = parseFloat(safeGet(row, "Desconto_Hora") as string || "0");
  const descKm = parseFloat(safeGet(row, "Desconto_KM") as string || "0");
  const desc = parseFloat(safeGet(row, "Desconto") as string || "0");
  const totalDescontos = desc + descHora + descKm;
  const total = vHoras + vKmTotal + vPecas + vReq - desc - descHora - descKm;
  const statusOs = safeGet(row, "Status") as string || "";
  const previsaoExec = safeGet(row, "Previsao_Execucao") as string || "";
  const previsaoFat = safeGet(row, "Previsao_Faturamento") as string || "";

  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <title>OS {idOs}</title>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          @page { margin: 0.8cm; size: A4; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Montserrat', sans-serif; font-size: 9pt; color: #111; margin: 0; padding: 16px; line-height: 1.4; }

          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2.5px solid #1E3A5F; margin-bottom: 16px; }
          .company-name { font-size: 20pt; font-weight: 900; text-transform: uppercase; color: #000; letter-spacing: 1px; }
          .company-sub { font-size: 8pt; color: #555; margin-top: 2px; line-height: 1.5; }
          .os-box { text-align: right; }
          .os-label { font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #1E3A5F; }
          .os-number { font-size: 28pt; font-weight: 900; color: #000; line-height: 1; }
          .os-meta { font-size: 8pt; color: #555; margin-top: 4px; }
          .os-meta span { margin-left: 12px; }
          .os-status { display: inline-block; font-size: 7pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 10px; border: 1.5px solid #1E3A5F; color: #1E3A5F; margin-top: 5px; }

          .section { margin-bottom: 14px; }
          .section-title { font-size: 7pt; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #1E3A5F; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1px solid #ccc; }

          .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2px 20px; }
          .info-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 20px; }
          .field { padding: 4px 0; }
          .field.full { grid-column: 1 / -1; }
          .field.span2 { grid-column: span 2; }
          .lbl { font-size: 6.5pt; color: #999; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
          .val { font-size: 9pt; color: #111; font-weight: 500; }
          .val-name { font-size: 12pt; font-weight: 800; color: #000; text-transform: uppercase; letter-spacing: 0.3px; }
          .val-bold { font-size: 9pt; color: #000; font-weight: 700; }
          .val-equip { font-size: 11pt; font-weight: 800; color: #1E3A5F; }

          .sep { border: none; border-top: 1px dashed #ddd; margin: 6px 0; }

          .desc-box { border: 1px solid #ddd; padding: 10px 12px; min-height: 90px; font-size: 9pt; white-space: pre-wrap; font-family: 'Montserrat', sans-serif; color: #222; line-height: 1.5; }

          table { width: 100%; border-collapse: collapse; }
          .cost-table th { text-align: left; font-size: 7pt; font-weight: 800; color: #000; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 8px; border-bottom: 2px solid #000; }
          .cost-table th:last-child { text-align: right; }
          .cost-table td { padding: 6px 8px; border-bottom: 1px solid #e5e5e5; font-size: 9pt; color: #222; }
          .cost-table .discount-row { color: #C41E2A; }
          .cost-table .discount-row td { font-style: italic; }

          .pecas-label { font-size: 7pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #1E3A5F; margin: 12px 0 4px; }

          .total-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; padding-top: 10px; border-top: 2.5px solid #1E3A5F; }
          .total-info { }
          .total-sub { font-size: 8pt; color: #888; margin-bottom: 2px; }
          .total-sub span { margin-right: 12px; }
          .total-lbl { font-size: 8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #1E3A5F; }
          .total-val { font-size: 22pt; font-weight: 900; color: #1E3A5F; }

          .footer { margin-top: 24px; text-align: center; font-size: 7pt; color: #ccc; letter-spacing: 0.5px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; } }
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `window.onload = function() { window.print(); }` }} />
      </head>
      <body>
        {/* Header */}
        <div className="header">
          <div>
            <div className="company-name">Nova Tratores</div>
            <div className="company-sub">Máquinas Agrícolas Ltda &mdash; CNPJ: 31.463.139/0001-03</div>
          </div>
          <div className="os-box">
            <div className="os-label">Ordem de Serviço</div>
            <div className="os-number">{idOs}</div>
            <div className="os-meta">
              <span>Emissão: {formatarDataBR(safeGet(row, "Data") as string)}</span>
              {previsaoExec && <span>Prev. Exec: {formatarDataBR(previsaoExec)}</span>}
            </div>
            {statusOs && <div className="os-status">{statusOs}</div>}
          </div>
        </div>

        {/* Cliente */}
        <div className="section">
          <div className="section-title">Cliente</div>
          <div className="field">
            <div className="val-name">{nomeCliente.toUpperCase()}</div>
          </div>
          <div className="info-grid">
            <div className="field">
              <div className="lbl">CPF / CNPJ</div>
              <div className="val-bold">{cnpjCliente || "-"}</div>
            </div>
            {razaoSocial && razaoSocial !== nomeCliente && (
              <div className="field span2">
                <div className="lbl">Razão Social</div>
                <div className="val">{razaoSocial}</div>
              </div>
            )}
            {telefoneCliente && (
              <div className="field">
                <div className="lbl">Telefone</div>
                <div className="val">{telefoneCliente}</div>
              </div>
            )}
            {emailCliente && (
              <div className="field">
                <div className="lbl">E-mail</div>
                <div className="val" style={{ fontSize: "7pt", color: "#888" }}>{emailCliente}</div>
              </div>
            )}
          </div>
          <hr className="sep" />
          <div className="info-grid">
            <div className="field span2">
              <div className="lbl">Endereço</div>
              <div className="val">{enderecoCliente || "-"}</div>
            </div>
            <div className="field">
              <div className="lbl">CEP</div>
              <div className="val">{cepCliente || "-"}</div>
            </div>
            <div className="field">
              <div className="lbl">Cidade</div>
              <div className="val">{cidadeCliente || "-"}</div>
            </div>
            {estadoCliente && (
              <div className="field">
                <div className="lbl">Estado</div>
                <div className="val">{estadoCliente}</div>
              </div>
            )}
          </div>
        </div>

        {/* Dados do Serviço */}
        <div className="section">
          <div className="section-title">Dados do Serviço</div>
          <div className="info-grid">
            <div className="field">
              <div className="lbl">Projeto / Equipamento</div>
              <div className="val-equip">{safeGet(row, "Projeto") as string || "Não informado"}</div>
            </div>
            <div className="field">
              <div className="lbl">Técnico Principal</div>
              <div className="val-bold">{safeGet(row, "Os_Tecnico") as string || "-"}</div>
            </div>
            <div className="field">
              <div className="lbl">Técnico Auxiliar</div>
              <div className="val">{safeGet(row, "Os_Tecnico2") as string || "-"}</div>
            </div>
            <div className="field">
              <div className="lbl">Tipo de Atendimento</div>
              <div className="val-bold">{safeGet(row, "Tipo_Servico") as string || "Manutenção"}</div>
            </div>
            <div className="field">
              <div className="lbl">Revisão</div>
              <div className="val">{safeGet(row, "Revisao") as string || "-"}</div>
            </div>
            {previsaoFat && (
              <div className="field">
                <div className="lbl">Previsão Faturamento</div>
                <div className="val">{formatarDataBR(previsaoFat)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Descrição */}
        <div className="section">
          <div className="section-title">Descrição do Serviço</div>
          <div className="desc-box">{safeGet(row, "Serv_Solicitado") as string || "Nenhum registro."}</div>
        </div>

        {/* Financeiro */}
        <div className="section">
          <div className="section-title">Resumo Financeiro</div>
          <table className="cost-table">
            <thead>
              <tr>
                <th style={{ width: "50%" }}>Descrição</th>
                <th style={{ width: "15%", textAlign: "center" }}>Qtd.</th>
                <th style={{ width: "15%", textAlign: "right" }}>Unit.</th>
                <th style={{ width: "20%", textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Mão de Obra (Horas Técnicas)</td>
                <td style={{ textAlign: "center" }}>{qtdHoras} h</td>
                <td style={{ textAlign: "right" }}>R$ {VALOR_HORA.toFixed(2)}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>R$ {vHoras.toFixed(2)}</td>
              </tr>
              {descHora > 0 && (
                <tr className="discount-row">
                  <td style={{ paddingLeft: 20 }}>Desconto Mão de Obra</td>
                  <td /><td />
                  <td style={{ textAlign: "right", fontWeight: 700 }}>- R$ {descHora.toFixed(2)}</td>
                </tr>
              )}
              <tr>
                <td>Deslocamento (KM)</td>
                <td style={{ textAlign: "center" }}>{qtdKm} km</td>
                <td style={{ textAlign: "right" }}>R$ {VALOR_KM.toFixed(2)}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>R$ {vKmTotal.toFixed(2)}</td>
              </tr>
              {descKm > 0 && (
                <tr className="discount-row">
                  <td style={{ paddingLeft: 20 }}>Desconto Deslocamento</td>
                  <td /><td />
                  <td style={{ textAlign: "right", fontWeight: 700 }}>- R$ {descKm.toFixed(2)}</td>
                </tr>
              )}
              {vReq > 0 && (
                <tr>
                  <td>Requisições / Serviços Externos</td>
                  <td style={{ textAlign: "center" }}>1</td>
                  <td style={{ textAlign: "right" }}>-</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>R$ {vReq.toFixed(2)}</td>
                </tr>
              )}
              {desc > 0 && (
                <tr className="discount-row">
                  <td>Desconto Geral</td>
                  <td /><td />
                  <td style={{ textAlign: "right", fontWeight: 700 }}>- R$ {desc.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {produtos.length > 0 && (
            <>
              <div className="pecas-label">Peças e Materiais</div>
              <table className="cost-table">
                <thead>
                  <tr>
                    <th style={{ width: "50%" }}>Peça</th>
                    <th style={{ width: "15%", textAlign: "center" }}>Qtd.</th>
                    <th style={{ width: "15%", textAlign: "right" }}>Unit.</th>
                    <th style={{ width: "20%", textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p, i) => (
                    <tr key={i}>
                      <td>{p.descricao}</td>
                      <td style={{ textAlign: "center" }}>{p.qtde}x</td>
                      <td style={{ textAlign: "right" }}>R$ {p.valor.toFixed(2)}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>R$ {(p.qtde * p.valor).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Total */}
          <div className="total-row">
            <div className="total-info">
              {totalDescontos > 0 && (
                <div className="total-sub">
                  <span>Subtotal: R$ {(total + totalDescontos).toFixed(2)}</span>
                  <span>Descontos: - R$ {totalDescontos.toFixed(2)}</span>
                </div>
              )}
              <div className="total-lbl">Total Geral da O.S.</div>
            </div>
            <div className="total-val">R$ {total.toFixed(2)}</div>
          </div>
        </div>

        <div className="footer">Documento gerado automaticamente pelo Sistema Nova Tratores Manager</div>
      </body>
    </html>
  );
}
