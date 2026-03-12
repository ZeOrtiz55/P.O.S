// =======================================================
// === CONEXÃO SUPABASE ===
// =======================================================

function supabaseFetch(endpoint, method = 'GET', payload = null) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint.replace(/ /g, "%20")}`;
    const options = {
        method,
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": "Bearer " + SUPABASE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        muteHttpExceptions: true
    };
    if (payload) options.payload = JSON.stringify(payload);
    const res = UrlFetchApp.fetch(url, options);
    return res.getResponseCode() < 300 ? JSON.parse(res.getContentText()) : [];
}

function supabaseFetchAll(tabela) {
    let todos = [];
    let de = 0;
    let ate = 999;
    let continua = true;
    while (continua) {
        const url = `${SUPABASE_URL}/rest/v1/${tabela}?select=*`;
        const options = {
            method: 'GET',
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": "Bearer " + SUPABASE_KEY,
                "Range": `${de}-${ate}`
            },
            muteHttpExceptions: true
        };
        const res = UrlFetchApp.fetch(url, options);
        const data = JSON.parse(res.getContentText());
        if (data && data.length > 0) {
            todos = todos.concat(data);
            if (data.length < 1000) continua = false;
            else { de += 1000; ate += 1000; }
        } else continua = false;
    }
    return todos;
}
