import { useMemo, useRef, useState } from 'react';
import { Folder, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { ANALYSTS, RISK_LEVELS, STATUSES, getRiskByKey } from '../config';
import { formatActivity } from '../utils/format';
import { useClickOutside } from '../utils/hooks';
import Avatar from '../components/Avatar';
import DotsIcon from '../components/DotsIcon';
import InvestigationDrawer from '../components/InvestigationDrawer';
import StatusBadge from '../components/StatusBadge';

const PAGE_SIZE = 10; // modifie cette valeur (ex. 4) pour changer le nombre de lignes par page
const STATUS_ORDER = ['a_examiner', 'en_investigation', 'resolu'];

function RowMenu({ onView, onEdit, onClose, onDelete, resolved }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);
  const act = (fn) => () => {
    setOpen(false);
    fn();
  };
  return (
    <div className="popover-anchor" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="icon-btn ghost" onClick={() => setOpen((o) => !o)} aria-label="Actions">
        <DotsIcon />
      </button>
      {open && (
        <div className="popover menu">
          <button type="button" className="menu-item" onClick={act(onView)}>Consulter</button>
          <button type="button" className="menu-item" onClick={act(onEdit)}>Modifier</button>
          <button type="button" className="menu-item" disabled={resolved} onClick={act(onClose)}>Clôturer</button>
          <button type="button" className="menu-item danger" onClick={act(onDelete)}>Supprimer</button>
        </div>
      )}
    </div>
  );
}

export default function InvestigationManagement({ investigations, initialOpenId, onNew, onSave, onDelete }) {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('all');
  const [analyst, setAnalyst] = useState('all');
  const [sort, setSort] = useState('priority');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [drawer, setDrawer] = useState(initialOpenId ? { id: initialOpenId, editing: false, closing: false } : null);
  const filterRef = useRef(null);
  useClickOutside(filterRef, () => setFiltersOpen(false), filtersOpen);

  const counts = useMemo(
    () => ({
      all: investigations.length,
      a_examiner: investigations.filter((i) => i.status === 'a_examiner').length,
      en_investigation: investigations.filter((i) => i.status === 'en_investigation').length,
      resolu: investigations.filter((i) => i.status === 'resolu').length,
    }),
    [investigations]
  );
  const activeFilters = (priority !== 'all' ? 1 : 0) + (analyst !== 'all' ? 1 : 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = investigations.filter((inv) => {
      if (tab !== 'all' && inv.status !== tab) return false;
      if (priority !== 'all' && inv.priority !== priority) return false;
      if (analyst !== 'all' && inv.analyst !== analyst) return false;
      if (!q) return true;
      return [inv.id, inv.transactionId, inv.title, inv.account].some((v) => (v || '').toLowerCase().includes(q));
    });
    const prioIdx = (k) => RISK_LEVELS.findIndex((l) => l.key === k);
    return [...list].sort((a, b) => {
      if (sort === 'priority') {
        const d = prioIdx(a.priority) - prioIdx(b.priority);
        if (d) return d;
      }
      if (sort === 'status') {
        const d = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
        if (d) return d;
      }
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [investigations, tab, search, priority, analyst, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const startIdx = (current - 1) * PAGE_SIZE;
  const rows = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  // Chaque changement de filtre ramène à la page 1
  const withReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const drawerInv = drawer ? investigations.find((i) => i.id === drawer.id) : null;

  function confirmDelete(inv) {
    if (window.confirm(`Supprimer définitivement le dossier ${inv.id} ?\nCette action est irréversible.`)) {
      onDelete(inv.id);
      setDrawer(null);
    }
  }

  const tabs = [{ key: 'all', label: 'Tous' }, ...STATUSES.map((s) => ({ key: s.key, label: s.key === 'resolu' ? 'Résolus' : s.label }))];

  return (
    <>
      <div className="page-actions">
        <div className="tabs">
          {tabs.map((t) => (
            <button key={t.key} type="button" className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => withReset(setTab)(t.key)}>
              {t.label} <span>{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-primary" onClick={onNew}>
          <Plus size={18} /> Nouveau dossier
        </button>
      </div>

      <section className="card">
        <div className="toolbar">
          <div className="search search-inline">
            <Search size={18} />
            <input value={search} onChange={(e) => withReset(setSearch)(e.target.value)} placeholder="Rechercher par dossier, compte…" aria-label="Rechercher un dossier" />
          </div>

          <div className="toolbar-right">
            <div className="popover-anchor" ref={filterRef}>
              <button type="button" className="filter-btn" onClick={() => setFiltersOpen((o) => !o)}>
                <SlidersHorizontal size={17} /> Filtres
                {activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}
              </button>
              {filtersOpen && (
                <div className="popover filter-pop">
                  <div className="field">
                    <label htmlFor="f-prio">Priorité</label>
                    <select id="f-prio" className="input" value={priority} onChange={(e) => withReset(setPriority)(e.target.value)}>
                      <option value="all">Toutes</option>
                      {RISK_LEVELS.map((l) => (
                        <option key={l.key} value={l.key}>{l.labelF}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="f-analyst">Analyste</label>
                    <select id="f-analyst" className="input" value={analyst} onChange={(e) => withReset(setAnalyst)(e.target.value)}>
                      <option value="all">Tous</option>
                      {ANALYSTS.map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-block"
                    onClick={() => {
                      setPriority('all');
                      setAnalyst('all');
                      setPage(1);
                    }}
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>
            <select className="select-pill" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Trier">
              <option value="priority">Trier : Priorité</option>
              <option value="recent">Trier : Activité récente</option>
              <option value="status">Trier : Statut</option>
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Dossier</th>
              <th>Statut</th>
              <th>Priorité</th>
              <th className="col-hide-md">Analyste</th>
              <th className="col-hide-sm">Dernière activité</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => {
              const prio = getRiskByKey(inv.priority);
              return (
                <tr key={inv.id} className="clickable" onClick={() => setDrawer({ id: inv.id, editing: false, closing: false })}>
                  <td>
                    <div className="dossier-cell">
                      <span className="folder-icon"><Folder size={20} /></span>
                      <div>
                        <div className="dossier-title">{inv.title}</div>
                        <div className="muted small">
                          {inv.id}
                          {inv.account ? ` · Compte •••• ${inv.account}` : ''} · {inv.txCount} transaction{inv.txCount > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td>
                    <span className={`prio ${inv.priority === 'critique' ? 'prio-critique' : 'prio-indent'}`}>
                      {inv.priority === 'critique' && <i className="prio-dot" />}
                      {prio.labelF}
                    </span>
                  </td>
                  <td className="col-hide-md">
                    <span className="analyst-cell"><Avatar name={inv.analyst} size={34} /> {inv.analyst}</span>
                  </td>
                  <td className="col-hide-sm">
                    <div className="dossier-title">{formatActivity(inv.updatedAt)}</div>
                    <div className="muted small">Activité mise à jour</div>
                  </td>
                  <td className="right">
                    <RowMenu
                      resolved={inv.status === 'resolu'}
                      onView={() => setDrawer({ id: inv.id, editing: false, closing: false })}
                      onEdit={() => setDrawer({ id: inv.id, editing: true, closing: false })}
                      onClose={() => setDrawer({ id: inv.id, editing: true, closing: true })}
                      onDelete={() => confirmDelete(inv)}
                    />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">Aucun dossier ne correspond à votre recherche.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="footer-row">
        <span className="muted small">
          {filtered.length === 0
            ? 'Aucun dossier'
            : `Affichage de ${startIdx + 1} à ${startIdx + rows.length} sur ${filtered.length} dossiers`}
        </span>
        <div className="pagination">
          <button type="button" className="page-btn" disabled={current === 1} onClick={() => setPage(current - 1)}>Précédent</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" className={`page-btn ${n === current ? 'active' : ''}`} onClick={() => setPage(n)}>
              {n}
            </button>
          ))}
          <button type="button" className="page-btn" disabled={current === totalPages} onClick={() => setPage(current + 1)}>Suivant</button>
        </div>
      </div>

      {drawerInv && (
        <InvestigationDrawer
          key={`${drawerInv.id}-${drawer.editing}-${drawer.closing}`}
          investigation={drawerInv}
          startEditing={drawer.editing}
          closing={drawer.closing}
          onClose={() => setDrawer(null)}
          onSave={onSave}
          onDelete={confirmDelete}
        />
      )}
    </>
  );
}