// =======================================================
// === SISTEMA DE LOGS PPO ===
// =======================================================

function registrarLogPPO(osId, acaoTexto, statusPara, statusDe = null) {
    try {
        const agora = new Date();
        const dataFmt = Utilities.formatDate(agora, "GMT-3", "dd/MM/yyyy");
        const horaFmt = Utilities.formatDate(agora, "GMT-3", "HH:mm:ss");
        let emailUser = Session.getActiveUser().getEmail() || "admin.sistema@novatratores.com";

        const resOs = supabaseFetch(`${TBL_OS}?select=Data&Id_Ordem=eq.${osId}`);
        let totalDiasAberto = 0;
        if (resOs.length > 0 && resOs[0].Data) {
            let dataCriacao = new Date(resOs[0].Data.split('T')[0].replace(/-/g, '/'));
            totalDiasAberto = Math.floor((agora - dataCriacao) / 86400000);
        }

        const resUltimoLog = supabaseFetch(`${TBL_LOGS_PPO}?Id_ppo=eq.${osId}&order=id.desc&limit=1`);
        let diasNaFase = 0;
        if (resUltimoLog.length > 0) {
            let pData = resUltimoLog[0].Data_Acao.split('/');
            let dtFaseAnterior = new Date(pData[2], pData[1] - 1, pData[0]);
            diasNaFase = Math.floor((agora - dtFaseAnterior) / 86400000);
        }

        supabaseFetch(TBL_LOGS_PPO, 'POST', {
            "Id_ppo": osId,
            "Data_Acao": dataFmt,
            "Hora_Acao": horaFmt,
            "UsuEmail": emailUser,
            "acao": acaoTexto,
            "Status_Anterior": statusDe,
            "Status_Atual": statusPara,
            "Dias_Na_Fase": Math.max(0, diasNaFase),
            "Total_Dias_Aberto": Math.max(0, totalDiasAberto)
        });
    } catch (e) { Logger.log("Erro Log: " + e.message); }
}

function getLogsPPO(osId) {
    if (!osId) return [];
    try {
        const res = supabaseFetch(`${TBL_LOGS_PPO}?Id_ppo=eq.${osId}&order=id.desc`);
        return res.map(log => ({
            data: log.Data_Acao + " " + log.Hora_Acao,
            acao: log.acao,
            usuario: log.UsuEmail,
            extra: (log.Dias_Na_Fase > 0) ? `Ficou ${log.Dias_Na_Fase} dias nesta fase.` : ""
        }));
    } catch (e) { return []; }
}
