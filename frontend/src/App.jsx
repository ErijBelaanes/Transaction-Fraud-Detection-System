import { useEffect, useState } from 'react';
import { CURRENT_ANALYST } from './config';
import { mockTransactions } from './data/mockTransactions';
import { API_CONFIG, fetchDashboard, fetchSamples } from './services/fraudApi';
import { createCase, deleteCase, listCases, updateCase } from './services/casesApi';
import { generateInvestigationId, loadInvestigations, resetInvestigations, saveInvestigations } from './utils/storage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import InvestigationModal from './components/InvestigationModal';
import Dashboard from './pages/Dashboard';
import TransactionAnalysis from './pages/TransactionAnalysis';
import InvestigationManagement from './pages/InvestigationManagement';
 
// true = on parle au backend FastAPI ; false = mode démonstration (données fictives + localStorage)
const USE_API = !API_CONFIG.useMock;
 
// Liste de l'écran d'analyse : nombre de transactions tirées au hasard dans la base à chaque chargement
const SAMPLE_COUNT = 20;  // 20, 50… (maximum 100)
const SAMPLE_FRAUDS = 5;  // dont combien de vraies fraudes (0 = tirage 100 % aléatoire, quasiment aucune fraude)
 
const PAGE_TITLES = {
  dashboard: {
    title: `Bonjour, ${CURRENT_ANALYST.name.split(' ')[0]}`,
    subtitle: 'Voici la synthèse de l’activité de détection aujourd’hui.',
  },
  analyse: {
    title: 'Analyser une transaction',
    subtitle: 'Le modèle estime le risque de fraude d’une transaction bancaire.',
  },
  dossiers: {
    title: 'Dossiers d’investigation',
    subtitle: 'Suivez, documentez et résolvez les alertes de fraude.',
  },
};
 
// Ajoute à "current" les transactions de "incoming" qui n'y sont pas encore
const mergeById = (current, incoming) => {
  const seen = new Set(current.map((t) => t.id));
  return [...current, ...incoming.filter((t) => !seen.has(t.id))];
};
 
export default function App() {
  const [page, setPage] = useState('dashboard');
  const [analysis, setAnalysis] = useState({ txId: null, key: 0 });
  const [investigations, setInvestigations] = useState(() => (USE_API ? [] : loadInvestigations()));
  // Transactions proposées dans l'écran d'analyse : fictives (démo) ou réelles (backend)
  const [samples, setSamples] = useState(USE_API ? [] : mockTransactions);
  // Chiffres réels du tableau de bord (null en mode démo ou tant qu'ils ne sont pas chargés)
  const [dashboard, setDashboard] = useState(null);
  const [openInvestigationId, setOpenInvestigationId] = useState(null);
  const [modal, setModal] = useState({ open: false, tx: null, result: null, key: 0 });
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
 
  const notify = (message, type = 'success') => setToast({ message, type });
 
  // Mode démo : sauvegarde automatique dans localStorage
  useEffect(() => {
    if (!USE_API) saveInvestigations(investigations);
  }, [investigations]);
 
  // Mode API : charge dossiers, transactions du jeu de test et chiffres du tableau de bord
  useEffect(() => {
    if (!USE_API) return undefined;
    let cancelled = false;
    listCases()
      .then((cases) => !cancelled && setInvestigations(cases))
      .catch((err) => !cancelled && notify(`Dossiers : ${err.message}`, 'error'));
    fetchSamples(SAMPLE_COUNT, SAMPLE_FRAUDS)
      .then((txs) => !cancelled && setSamples((prev) => mergeById(prev, txs)))
      .catch((err) => !cancelled && notify(`Transactions : ${err.message}`, 'error'));
    fetchDashboard()
      .then((d) => {
        if (cancelled) return;
        setDashboard(d);
      })
      .catch((err) => !cancelled && notify(`Tableau de bord : ${err.message}`, 'error'));
    return () => {
      cancelled = true;
    };
  }, []);
 
  // Le message de confirmation disparaît après 4 secondes
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);
 
  function navigate(next) {
    setPage(next);
    setSearch('');
    setOpenInvestigationId(null);
    if (next === 'analyse') setAnalysis((a) => ({ txId: null, key: a.key + 1 }));
  }
 
  function openAnalysis(txId) {
    let id = txId;
    if (USE_API && id && !samples.some((t) => t.id === id)) {
      // Alerte du tableau de bord ou de la cloche : on l'ajoute à la liste seulement quand on l'ouvre
      const alert = dashboard?.topAlerts.find((t) => t.id === id);
      if (alert) {
        setSamples((prev) => mergeById(prev, [alert]));
      } else {
        notify('Transaction introuvable dans la liste chargée.', 'error');
        id = null;
      }
    }
    setSearch('');
    setOpenInvestigationId(null);
    setAnalysis((a) => ({ txId: id, key: a.key + 1 }));
    setPage('analyse');
  }
 
  function handleSearchSubmit() {
    const q = search.trim().toLowerCase();
    if (!q) return;
    const pool = USE_API ? samples : mockTransactions;
    const found = pool.find((t) => t.id.toLowerCase().includes(q) || (t.merchant ?? '').toLowerCase().includes(q));
    if (found) openAnalysis(found.id);
    else notify(`Aucune transaction trouvée pour « ${search} ».`, 'error');
  }
 
  function openCreateModal(tx = null, result = null) {
    setModal((m) => ({ open: true, tx, result, key: m.key + 1 }));
  }
 
  async function handleCreate(values) {
    try {
      const now = new Date().toISOString();
      const inv = USE_API
        ? await createCase(values)
        : { ...values, id: generateInvestigationId(investigations), createdAt: now, updatedAt: now };
      setInvestigations((prev) => [inv, ...prev]);
      setModal((m) => ({ ...m, open: false }));
      setOpenInvestigationId(inv.id);
      setPage('dossiers');
      notify(`Dossier ${inv.id} créé avec succès.`);
    } catch (err) {
      notify(err.message, 'error'); // la fenêtre reste ouverte pour corriger
    }
  }
 
  // Renvoie true si l'enregistrement a réussi (le panneau latéral quitte alors le mode édition)
  async function handleSave(id, changes) {
    const current = investigations.find((inv) => inv.id === id);
    if (!current) return false;
    try {
      const updated = USE_API
        ? await updateCase(current.apiId, changes)
        : { ...current, ...changes, updatedAt: new Date().toISOString() };
      setInvestigations((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
      notify('Dossier mis à jour.');
      return true;
    } catch (err) {
      notify(err.message, 'error');
      return false;
    }
  }
 
  async function handleDelete(id) {
    const current = investigations.find((inv) => inv.id === id);
    if (!current) return;
    try {
      if (USE_API) await deleteCase(current.apiId);
      setInvestigations((prev) => prev.filter((inv) => inv.id !== id));
      notify(`Dossier ${id} supprimé.`);
    } catch (err) {
      notify(err.message, 'error');
    }
  }
 
  function handleResetDemo() {
    if (USE_API) {
      notify('La réinitialisation n’existe qu’en mode démonstration.', 'error');
      return;
    }
    if (window.confirm('Réinitialiser les dossiers avec les données de démonstration ? Vos modifications seront perdues.')) {
      setInvestigations(resetInvestigations());
      notify('Données de démonstration réinitialisées.');
    }
  }
 
  // Cloche de notifications : vraies alertes du backend, ou alertes fictives en démo
  const notifications = USE_API
    ? (dashboard?.topAlerts ?? []).slice(0, 5)
    : mockTransactions
        .filter((t) => t.score >= 60)
        .sort((a, b) => a.ageMinutes - b.ageMinutes)
        .slice(0, 5);
 
  const { title, subtitle } = PAGE_TITLES[page];
 
  return (
    <div className="app">
      <Sidebar page={page} onNavigate={navigate} onResetDemo={handleResetDemo} />
 
      <div className="main">
        <Header
          title={title}
          subtitle={subtitle}
          search={search}
          onSearchChange={setSearch}
          onSearchSubmit={handleSearchSubmit}
          notifications={notifications}
          onOpenTransaction={openAnalysis}
        />
 
        <main className={`content content-${page}`}>
          {page === 'dashboard' && (
            <Dashboard
              transactions={mockTransactions}
              investigations={investigations}
              search={search}
              onOpenTransaction={openAnalysis}
              summary={dashboard}
              apiMode={USE_API}
            />
          )}
          {page === 'analyse' && (
            <TransactionAnalysis
              key={`${analysis.key}-${samples.length}`}
              transactions={samples}
              initialTxId={analysis.txId}
              onCreateInvestigation={openCreateModal}
              notify={notify}
            />
          )}
          {page === 'dossiers' && (
            <InvestigationManagement
              investigations={investigations}
              initialOpenId={openInvestigationId}
              onNew={() => openCreateModal()}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          )}
        </main>
      </div>
 
      {modal.open && (
        <InvestigationModal
          key={modal.key}
          transactions={samples}
          initialTx={modal.tx}
          initialResult={modal.result}
          onClose={() => setModal((m) => ({ ...m, open: false }))}
          onSubmit={handleCreate}
        />
      )}
 
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
