import { useRef, useState } from 'react';
import { Focus, Folder, LayoutGrid, ShieldCheck } from 'lucide-react';
import { CURRENT_ANALYST, MODEL_INFO } from '../config';
import { useClickOutside } from '../utils/hooks';
import Avatar from './Avatar';
import DotsIcon from './DotsIcon';

const NAV = [
  { key: 'dashboard', label: 'Tableau de bord', icon: LayoutGrid },
  { key: 'analyse', label: 'Analyser une transaction', icon: Focus },
  { key: 'dossiers', label: 'Dossiers d’investigation', icon: Folder },
];

export default function Sidebar({ page, onNavigate, onResetDemo }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setMenuOpen(false), menuOpen);

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-logo">
          <ShieldCheck size={22} />
        </span>
        <span className="brand-name">
          TransactionGuard <small>AI</small>
        </span>
      </div>

      <div className="nav-title">ESPACE ANALYSTE</div>
      <nav>
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`nav-item ${page === key ? 'active' : ''}`}
            onClick={() => onNavigate(key)}
            title={label}
          >
            <Icon size={20} />
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      <div className="model-card">
        <div className="model-head">
          <span className={`dot ${MODEL_INFO.connected ? 'dot-green' : 'dot-amber'}`} />
          {MODEL_INFO.connected ? 'Modèle opérationnel' : 'Modèle de démonstration'}
        </div>
        <div className="model-name">{MODEL_INFO.name}</div>
        <div className="model-sub">
          {MODEL_INFO.connected ? MODEL_INFO.updatedLabel : 'Scores fictifs · modèle non connecté'}
        </div>
      </div>

      <div className="user-box" ref={ref}>
        <Avatar name={CURRENT_ANALYST.name} size={44} />
        <div className="user-info">
          <div className="user-name">{CURRENT_ANALYST.name}</div>
          <div className="user-role">{CURRENT_ANALYST.role}</div>
        </div>
        <button type="button" className="user-menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu utilisateur">
          <DotsIcon />
        </button>
        {menuOpen && (
          <div className="popover menu menu-up">
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                setMenuOpen(false);
                onResetDemo();
              }}
            >
              Réinitialiser les données de démo
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}