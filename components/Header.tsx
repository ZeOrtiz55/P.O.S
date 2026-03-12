"use client";

interface HeaderProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  onNewOS: () => void;
  onNewClient: () => void;
  onGenerateReport: () => void;
}

export default function Header({ searchTerm, onSearch, onNewOS, onNewClient, onGenerateReport }: HeaderProps) {
  return (
    <header>
      <div className="brand-area">
        <div className="brand-icon"><i className="fas fa-tractor" /></div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>NOVA TRATORES</div>
      </div>
      <div className="search-box" style={{ position: "relative" }}>
        <i className="fas fa-search" style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
        <input type="text" className="search-input" placeholder="Pesquisar cliente ou OS..." value={searchTerm} onChange={(e) => onSearch(e.target.value)} />
      </div>
      <div className="header-actions">
        <button className="btn-top btn-report" onClick={onGenerateReport}><i className="fas fa-file-invoice" /> GERAR RELATÓRIO</button>
        <button className="btn-top btn-cli" onClick={onNewClient}><i className="fas fa-user-plus" /> CRIAR CLIENTE</button>
        <button className="btn-top btn-new" onClick={onNewOS}><i className="fas fa-plus" /> NOVA ORDEM</button>
      </div>
    </header>
  );
}
