// =======================================================
// === UTILITÁRIOS ===
// =======================================================

function formatarDataBR(valor) {
    if (!valor) return Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
    let d = new Date(valor);
    return isNaN(d.getTime()) ? String(valor) : Utilities.formatDate(d, "GMT-3", "dd/MM/yyyy");
}

function safeGet(obj, ...keys) {
    if (!obj) return null;
    for (let key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "EMPTY") return obj[key];
    }
    return null;
}

function encontrarLinkDrive(folderId, fileName) {
    if (!fileName) return "";
    try {
        const folder = DriveApp.getFolderById(folderId);
        let limpo = fileName.trim().split('.')[0];
        let files = folder.getFilesByName(fileName.trim());
        if (files.hasNext()) return files.next().getUrl();
        files = folder.searchFiles("title contains '" + limpo + "'");
        return files.hasNext() ? files.next().getUrl() : "";
    } catch (e) { return ""; }
}

function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
