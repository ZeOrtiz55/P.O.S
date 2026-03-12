// =======================================================
// === PONTO DE ENTRADA (doGet + Dados Iniciais) ===
// =======================================================

function doGet(e) {
    let page = (e && e.parameter && e.parameter.page === 'os') ? 'ManagerOS' : 'index';
    return HtmlService.createTemplateFromFile(page)
        .evaluate()
        .setTitle('Nova Tratores')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getDadosIniciais() {
    try {
        let listOmie = supabaseFetchAll(TBL_CLIENTES).map(c => ({
            chave: "OMIE:" + (c.id_omie || c.id_cliente),
            display: (c.nome_fantasia || c.razao_social) + " [CNPJ/CPF: " + (c.cnpj_cpf || "---") + "] (OMIE)"
        }));
        let listManual = supabaseFetchAll(TBL_CLIENTES_MANUAIS).map(c => ({
            chave: "MANUAL:" + (c.id || c.id_cliente),
            display: (c.Cli_Nome || "Sem Nome") + " [CNPJ/CPF: " + (c.Cli_Cpf_Cnpj || "---") + "] (MANUAL)"
        }));
        let clientesFinal = [...listOmie, ...listManual].sort((a, b) => a.display.localeCompare(b.display));
        let tecnicos = supabaseFetch(`${TBL_TECNICOS}?select=*`).map(t => safeGet(t, "UsuNome") || "Técnico").sort();
        return { tecnicos, clientes: clientesFinal, ordens: getOrdensParaKanban() };
    } catch (e) { return { tecnicos: [], clientes: [], projetos: [], ordens: [] }; }
}
