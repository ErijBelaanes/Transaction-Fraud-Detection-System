import { useRef, useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { API_CONFIG } from '../services/fraudApi';
import { formatAgo, formatPercent } from '../utils/format';
import { useClickOutside } from '../utils/hooks';
 
export default function Header({ title, subtitle, search, onSearchChange, onSearchSubmit, notifications, onOpenTransaction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);
 
  return (
    <header className="header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
 
      <div className="header-right">
        {API_CONFIG.useMock && (
          <span className="demo-pill" title="Les scores et prédictions sont fictifs tant que le modèle n’est pas connecté">
            Données simulées
          </span>
        )}
 
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
        >
          <Search size={18} />
          <input
            type="search"
            placeholder="Rechercher une transaction…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Rechercher une transaction"
          />
        </form>
 
        <div className="popover-anchor" ref={ref}>
          <button type="button" className="icon-btn" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
            <Bell size={20} />
            {notifications.length > 0 && <span className="notif-dot" />}
          </button>
          {open && (
            <div className="popover notif-pop">
              <div className="popover-title">Alertes récentes</div>
              {notifications.length === 0 && <div className="muted small" style={{ padding: 10 }}>Aucune alerte pour le moment.</div>}
              {notifications.map((tx) => (
                <button
                  key={tx.id}
                  type="button"
                  className="notif-item"
                  onClick={() => {
                    setOpen(false);
                    onOpenTransaction(tx.id);
                  }}
                >
                  <strong>{tx.id}</strong>
                  <span>
                    {tx.merchant ?? 'Transaction'} · score {tx.percent != null ? `${formatPercent(tx.percent)} %` : `${tx.score}/100`}
                  </span>
                  <small>{formatAgo(tx.ageMinutes)}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}