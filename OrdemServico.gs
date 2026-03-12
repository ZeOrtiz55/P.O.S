// =======================================================
// === ORDEM DE SERVIÇO (CRUD + KANBAN) ===
// =======================================================

function getOrdensParaKanban() {
    try {
        const data = supabaseFetch(`${TBL_OS}?select=*&order=Id_Ordem.desc`);
        const todosLogs = supabaseFetch(`${TBL_LOGS_PPO}?select=Id_ppo,Data_Acao&order=id.desc`);
        const mapaDatasFase = {};
        todosLogs.forEach(l => { if (!mapaDatasFase[l.Id_ppo]) mapaDatasFase[l.Id_ppo] = l.Data_Acao; });
        return data.map(row => {
            const osId = safeGet(row, "Id_Ordem");
            return {
                id: osId,
                cliente: safeGet(row, "Os_Cliente"),
                tecnico: safeGet(row, "Os_Tecnico"),
                data: formatarDataBR(safeGet(row, "Data")),
                dataFase: mapaDatasFase[osId] || formatarDataBR(safeGet(row, "Data")),
                valor: parseFloat(safeGet(row, "Valor_Total") || 0).toFixed(2).replace('.', ','),
                status: safeGet(row, "Status") || "Orçamento",
                temPPV: !!safeGet(row, "ID_PPV"),
                temReq: !!safeGet(row, "Id_Req"),
                temRel: !!safeGet(row, "ID_Relatorio_Final"),
                servSolicitado: safeGet(row, "Serv_Solicitado") || "-"
            };
        });
    } catch (e) { return []; }
}

function buscarInfoExtraOS(row) {
    let info = { relatorio: null, requisicoes: [] };
    if (!row) return info;
    let osId = safeGet(row, "Id_Ordem");

    if (safeGet(row, "ID_Relatorio_Final")) {
        info.relatorio = { status: "OK", link: encontrarLinkDrive(PASTA_RELATORIOS, osId) };
    }

    let idReqStr = safeGet(row, "Id_Req");
    if (idReqStr) {
        let cleanIds = idReqStr.split(',').map(id => id.trim());
        const resSols = supabaseFetch(`${TBL_REQ_SOL}?IdReq=in.(${cleanIds.join(',')})`);
        const resAtts = supabaseFetch(`${TBL_REQ_ATT}?ReqREF=in.(${cleanIds.join(',')})`);
        cleanIds.forEach(id => {
            let sol = resSols.find(s => s.IdReq == id);
            let att = resAtts.find(a => a.ReqREF == id);
            let itemReq = {
                id: id,
                atualizada: !!att,
                valor: att ? parseFloat(att.ReqValor || 0) : 0,
                linkNota: "",
                material: sol ? sol.Material_Serv_Solicitado : "N/A",
                solicitante: sol ? sol.ReqEmail : "N/A"
            };
            if (att) {
                let arq = att.ReqFotoNota ? att.ReqFotoNota.split('/').pop() : id;
                itemReq.linkNota = encontrarLinkDrive(PASTA_IMAGENS_REQ, arq);
            }
            info.requisicoes.push(itemReq);
        });
    }
    return info;
}

function getDadosOSParaEdicao(idOs) {
    const res = supabaseFetch(`${TBL_OS}?select=*&limit=1&Id_Ordem=eq.${idOs}`);
    if (!res.length) return null;
    const row = res[0];
    const extras = buscarInfoExtraOS(row);
    return {
        ...row,
        id: safeGet(row, "Id_Ordem"),
        nomeCliente: safeGet(row, "Os_Cliente"),
        cpfCliente: safeGet(row, "Cnpj_Cliente"),
        enderecoCliente: safeGet(row, "Endereco_Cliente"),
        tecnicoResponsavel: safeGet(row, "Os_Tecnico"),
        tecnico2: safeGet(row, "Os_Tecnico2"),
        tipoServico: safeGet(row, "Tipo_Servico"),
        revisao: safeGet(row, "Revisao"),
        data: formatarDataBR(safeGet(row, "Data")),
        servicoSolicitado: safeGet(row, "Serv_Solicitado"),
        servicoRealizado: safeGet(row, "Serv_Realizado"),
        qtdHoras: safeGet(row, "Qtd_HR"),
        qtdKm: safeGet(row, "Qtd_KM"),
        status: safeGet(row, "Status"),
        ppv: safeGet(row, "ID_PPV"),
        projeto: safeGet(row, "Projeto"),
        ordemOmie: safeGet(row, "Ordem_Omie"),
        motivoCancelamento: safeGet(row, "Motivo_Cancelamento"),
        relatorioTecnico: safeGet(row, "ID_Relatorio_Final"),
        infoRelatorio: extras.relatorio,
        infoRequisicoes: extras.requisicoes,
        descontoSalvo: safeGet(row, "Desconto")
    };
}

function salvarOrdemServico(dados) {
    try {
        let ultimoNum = 0;
        const resId = supabaseFetch(`${TBL_OS}?select=Id_Ordem&order=Id_Ordem.desc&limit=1`);
        if (resId.length > 0) ultimoNum = parseInt(resId[0].Id_Ordem.split('-')[1], 10);
        const newId = `OS-${String(ultimoNum + 1).padStart(4, '0')}`;
        const c = calcularTotaisCompletos(dados, buscarProdutosPorPPV(dados.ppv));

        supabaseFetch(TBL_OS, 'POST', {
            "Id_Ordem": newId,
            "Status": 'Orçamento',
            "Data": new Date().toISOString().split('T')[0],
            "Os_Cliente": dados.nomeCliente,
            "Cnpj_Cliente": dados.cpfCliente,
            "Endereco_Cliente": dados.enderecoCliente,
            "Os_Tecnico": dados.tecnicoResponsavel,
            "Os_Tecnico2": dados.tecnico2,
            "Tipo_Servico": dados.tipoServico,
            "Revisao": dados.revisao,
            "Projeto": dados.projeto,
            "Serv_Solicitado": dados.servicoSolicitado,
            "Qtd_HR": parseFloat(dados.qtdHoras || 0),
            "Valor_HR": VALOR_HORA,
            "Qtd_KM": parseFloat(dados.qtdKm || 0),
            "Valor_KM": VALOR_KM,
            "Valor_Total": c.total,
            "ID_PPV": dados.ppv,
            "Desconto": parseFloat(dados.descontoValor || 0)
        });

        registrarLogPPO(newId, "Ordem Criada", "Orçamento", null);
        return { success: true, ordensAtualizadas: getOrdensParaKanban(), htmlPrint: regerarPDF(newId).htmlPrint };
    } catch (e) { throw "Erro: " + e.message; }
}

function updateOrdemServico(dados) {
    const idOs = dados.id;
    const resAtual = supabaseFetch(`${TBL_OS}?select=*&Id_Ordem=eq.${idOs}`);

    if (resAtual.length > 0) {
        const atual = resAtual[0];
        const stAt = safeGet(atual, "Status");
        if (stAt !== dados.status) {
            registrarLogPPO(idOs, `Mudança para ${dados.status}`, dados.status, stAt);
        }

        const campos = [
            { d: "tecnicoResponsavel", db: "Os_Tecnico", lbl: "Técnico" },
            { d: "tecnico2", db: "Os_Tecnico2", lbl: "Técnico 2" },
            { d: "projeto", db: "Projeto", lbl: "Projeto" },
            { d: "qtdHoras", db: "Qtd_HR", lbl: "Horas" },
            { d: "qtdKm", db: "Qtd_KM", lbl: "KM" },
            { d: "ppv", db: "ID_PPV", lbl: "PPV/Req" },
            { d: "relatorioTecnico", db: "ID_Relatorio_Final", lbl: "Relatório" },
            { d: "servicoSolicitado", db: "Serv_Solicitado", lbl: "Descrição Serviço" }
        ];
        campos.forEach(c => {
            let valDb = String(safeGet(atual, c.db) || "").trim();
            let valNovo = String(dados[c.d] || "").trim();
            if (valDb !== valNovo) {
                registrarLogPPO(idOs, `${c.lbl} alterado: de "${valDb || 'vazio'}" para "${valNovo || 'vazio'}"`, dados.status);
            }
        });
    }

    const c = calcularTotaisCompletos(dados, buscarProdutosPorPPV(dados.ppv));
    supabaseFetch(`${TBL_OS}?Id_Ordem=eq.${idOs}`, 'PATCH', {
        "Os_Tecnico": dados.tecnicoResponsavel,
        "Os_Tecnico2": dados.tecnico2,
        "Tipo_Servico": dados.tipoServico,
        "Revisao": dados.revisao,
        "Serv_Solicitado": dados.servicoSolicitado,
        "Serv_Realizado": null,
        "Qtd_HR": parseFloat(dados.qtdHoras || 0),
        "Qtd_KM": parseFloat(dados.qtdKm || 0),
        "Valor_Total": c.total,
        "Status": dados.status,
        "ID_PPV": dados.ppv,
        "ID_Relatorio_Final": dados.relatorioTecnico,
        "Projeto": dados.projeto,
        "Ordem_Omie": dados.ordemOmie,
        "Motivo_Cancelamento": dados.motivoCancelamento,
        "Desconto": parseFloat(dados.descontoValor || 0)
    });
    return { success: true, ordensAtualizadas: getOrdensParaKanban() };
}
