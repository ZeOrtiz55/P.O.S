// =======================================================
// === FINANCEIRO (PPV, PRODUTOS, CÁLCULOS) ===
// =======================================================

function buscarProdutosPorPPV(idPPVInput) {
    const listaIds = String(idPPVInput).split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (!listaIds.length) return [];
    const items = supabaseFetch(`${TBL_ITENS}?Id_PPV=in.(${listaIds.join(',')})`);
    const resumo = {};
    items.forEach(item => {
        const cod = safeGet(item, "CodProduto");
        const desc = safeGet(item, "Descricao");
        const tipo = String(safeGet(item, "TipoMovimento") || "").toLowerCase();
        const preco = parseFloat(safeGet(item, "Preco") || 0);
        let qtd = Math.abs(parseFloat(safeGet(item, "Qtde") || 0));
        if (tipo.includes("devolu")) { qtd = -qtd; }
        if (!resumo[cod]) { resumo[cod] = { descricao: desc, qtde: 0, totalFinanceiro: 0 }; }
        resumo[cod].qtde += qtd;
        resumo[cod].totalFinanceiro += (preco * qtd);
    });
    return Object.values(resumo).map(p => ({
        descricao: p.descricao,
        qtde: p.qtde,
        valor: p.qtde !== 0 ? (p.totalFinanceiro / p.qtde) : 0
    })).filter(p => p.qtde !== 0);
}

function calcularTotaisCompletos(dados, listaProdutos) {
    let vPecas = 0;
    listaProdutos.forEach(p => { vPecas += (p.valor * p.qtde); });

    let vHoras = (parseFloat(dados.qtdHoras || 0) * VALOR_HORA);
    let vKm = (parseFloat(dados.qtdKm || 0) * VALOR_KM);
    let vReq = 0;

    let idReqStr = dados.ppv || dados.Id_Req;
    if (idReqStr) {
        String(idReqStr).split(',').forEach(id => {
            const resAtt = supabaseFetch(`${TBL_REQ_ATT}?ReqREF=eq.${id.trim()}`);
            if (resAtt.length > 0) vReq += parseFloat(safeGet(resAtt[0], "ReqValor") || 0);
        });
    }

    let subtotal = vHoras + vKm + vPecas + vReq;
    let desc = parseFloat(dados.descontoValor || 0);
    return {
        total: subtotal - desc,
        subtotal, vHoras, vKm, vPecas, vReq,
        vHorasRaw: vHoras, vKmRaw: vKm, vPecasRaw: vPecas
    };
}
