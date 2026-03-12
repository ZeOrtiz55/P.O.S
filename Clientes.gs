// =======================================================
// === CLIENTES ===
// =======================================================

function getDadosCliente(idComPrefixo) {
    const parts = idComPrefixo.split(':');
    const tipo = parts[0], id = parts[1];
    let res = (tipo === "OMIE")
        ? supabaseFetch(`${TBL_CLIENTES}?id_omie=eq.${id}`)
        : supabaseFetch(`${TBL_CLIENTES_MANUAIS}?id=eq.${id}`);

    if (res && res.length > 0) {
        const c = res[0];
        if (tipo === "OMIE") {
            return {
                nome: c.nome_fantasia || c.razao_social,
                cpf: c.cnpj_cpf || "",
                email: c.email || "",
                telefone: c.telefone || "",
                endereco: c.endereco || ""
            };
        }
        return {
            nome: c.Cli_Nome,
            cpf: c.Cli_Cpf_Cnpj || "",
            email: c.Cli_Email || "",
            telefone: c.Cli_Fone || "",
            endereco: (c.Cli_Endereco || "") + (c.Cli_Cidade ? ", " + c.Cli_Cidade : "")
        };
    }
    return { nome: "Não encontrado" };
}

function salvarNovoClienteManual(dados) {
    try {
        supabaseFetch(TBL_CLIENTES_MANUAIS, 'POST', {
            "Cli_Nome": dados.nome,
            "Cli_Cpf_Cnpj": dados.cpf,
            "Cli_Email": dados.email,
            "Cli_Fone": dados.telefone,
            "Cli_Endereco": dados.endereco,
            "Cli_Cidade": dados.cidade
        });
        return { success: true, dadosIniciais: getDadosIniciais() };
    } catch (e) { throw "Erro: " + e.message; }
}
