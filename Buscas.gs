// =======================================================
// === BUSCAS (PROJETOS E REVISÕES) ===
// =======================================================

function buscarProjetosSupabase(termo) {
    try {
        let endpoint;
        if (!termo || termo.trim().length === 0) {
            endpoint = `${TBL_PROJETOS_DB}?select=*&limit=50&order=Nome_Projeto.asc`;
        } else {
            const query = `%${termo.trim().replace(/ /g, "%")}%`;
            endpoint = `${TBL_PROJETOS_DB}?Nome_Projeto=ilike.${encodeURIComponent(query)}&select=*&limit=100`;
        }
        const res = supabaseFetch(endpoint);
        return res.map(row => ({ nome: row.Nome_Projeto }));
    } catch (e) { Logger.log("Erro busca Projetos: " + e.message); return []; }
}

function buscarRevisoesSupabase(termo) {
    try {
        let endpoint;
        if (!termo || termo.trim().length === 0) {
            endpoint = `${TBL_REV_PRONTAS}?select=*&limit=50&order=IdRevisoes.asc`;
        } else {
            const query = `%${termo.trim().replace(/ /g, "%")}%`;
            endpoint = `${TBL_REV_PRONTAS}?DescricaoCompleta=ilike.${encodeURIComponent(query)}&select=*&limit=50`;
        }
        const res = supabaseFetch(endpoint);
        return res.map(row => ({ id: row.IdRevisoes, descricao: row.DescricaoCompleta }));
    } catch (e) { Logger.log("Erro busca Revisões: " + e.message); return []; }
}
