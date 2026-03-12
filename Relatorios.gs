// =======================================================
// === GERAÇÃO DE PDF E RELATÓRIOS ===
// =======================================================

function regerarPDF(idOs) {
    registrarLogPPO(idOs, "Impressão de PDF realizada", null);
    const d = getDadosOSParaEdicao(idOs);
    const lista = buscarProdutosPorPPV(d.ppv);
    const c = calcularTotaisCompletos({
        qtdHoras: d.qtdHoras,
        qtdKm: d.qtdKm,
        id: idOs,
        ppv: d.ppv,
        descontoValor: d.descontoSalvo || 0
    }, lista);

    const t = HtmlService.createTemplateFromFile('PDF_Template');
    t.os = {
        idOrdem: String(idOs),
        nomeCliente: String(d.nomeCliente || "").toUpperCase(),
        cpfCliente: String(d.cpfCliente || ""),
        enderecoCliente: String(d.enderecoCliente || ""),
        tecnicoResponsavel: String(d.tecnicoResponsavel || ""),
        tecnico2: String(d.tecnico2 || ""),
        tipoServico: String(d.tipoServico || "Manutenção"),
        revisao: String(d.revisao || ""),
        projeto: String(d.projeto || ""),
        data: String(d.data || ""),
        servSolicitado: String(d.servicoSolicitado || ""),
        qtdHoras: d.qtdHoras,
        qtdKm: d.qtdKm,
        valorHoras: c.vHorasRaw.toFixed(2),
        valorKm: c.vKmRaw.toFixed(2),
        valorPecas: c.vPecasRaw.toFixed(2),
        valorReq: c.vReq.toFixed(2),
        valorTotal: c.total.toFixed(2),
        produtos: lista
    };
    t.valorHora = VALOR_HORA;
    t.valorKm = VALOR_KM;
    return { htmlPrint: t.evaluate().getContent() };
}

function gerarRelatorioGeral() {
    const ordens = getOrdensParaKanban();
    const t = HtmlService.createTemplateFromFile('Relatorio_Template');
    t.ordens = ordens;
    t.dataGeracao = formatarDataBR(new Date());
    return t.evaluate().getContent();
}
