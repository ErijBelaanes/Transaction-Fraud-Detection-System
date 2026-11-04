import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Focus, Folder, Info, Upload } from 'lucide-react';
import { getRiskLevel } from '../config';
import { predictTransaction } from '../services/fraudApi';
import { parseCreditCardCsv, rowToTransaction } from '../utils/csv';
import { getAllFeatures } from '../utils/features';
import { formatAmountInput, formatInt, formatNumber, formatPercent } from '../utils/format';
import { downloadReport } from '../utils/report';
 
const DEFAULT_TX_ID = 'TRX-9D1E05'; // transaction fictive proposée par défaut (mode démo uniquement)
 
// true : la liste indique « fraude réelle » pour les vraies fraudes connues (utile pour tester le modèle)
// false : liste neutre, sans aucune indication
const SHOW_GROUND_TRUTH = true;
 
const VERDICTS = {
  critique: { variant: 'danger', title: 'Transaction suspecte', sub: 'Risque critique · à investiguer en priorité' },
  eleve: { variant: 'danger', title: 'Transaction suspecte', sub: 'Risque élevé · à investiguer' },
  modere: { variant: 'warn', title: 'Transaction suspecte', sub: 'Risque modéré · à surveiller' },
  faible: { variant: 'ok', title: 'Transaction légitime', sub: 'Risque faible · aucune action requise' },
};
 
export default function TransactionAnalysis({ transactions, initialTxId, onCreateInvestigation, notify }) {
  const [source, setSource] = useState('test'); // 'test' | 'csv'
  const [csvTxs, setCsvTxs] = useState([]);
  const [csvName, setCsvName] = useState('');
  // Transaction proposée par défaut : celle de la maquette (démo) ou la première du jeu de test (API)
  const firstId = transactions.some((t) => t.id === DEFAULT_TX_ID) ? DEFAULT_TX_ID : transactions[0]?.id ?? '';
  const [selectedId, setSelectedId] = useState(initialTxId || firstId);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAllVars, setShowAllVars] = useState(false);
  const fileRef = useRef(null);
 
  const list = source === 'test' ? transactions : csvTxs;
  const selected = list.find((t) => t.id === selectedId) ?? null;
  const visibleResult = result && result.txId === selectedId ? result : null;
  const allFeatures = getAllFeatures(selected);
  const shownFeatures = showAllVars ? allFeatures : allFeatures.slice(0, 4);
 
  async function runAnalysis(tx) {
    setLoading(true);
    setError('');
    try {
      const r = await predictTransaction(tx);
      setResult({ ...r, txId: tx.id });
    } catch (err) {
      setResult(null);
      setError(err.message || 'Analyse impossible.');
    } finally {
      setLoading(false);
    }
  }
 
  // Analyse automatique à l'ouverture de la page (comme sur la maquette)
  useEffect(() => {
    const tx = transactions.find((t) => t.id === selectedId);
    if (tx) runAnalysis(tx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  function changeSource(next) {
    setSource(next);
    setError('');
    setSelectedId(next === 'test' ? firstId : csvTxs[0]?.id ?? '');
  }
 
  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseCreditCardCsv(file);
      const txs = rows.map(rowToTransaction);
      setCsvTxs(txs);
      setCsvName(file.name);
      setSelectedId(txs[0].id);
      setError('');
      notify(`${txs.length} lignes importées depuis ${file.name}.`);
    } catch (err) {
      setError(err.message);
      notify(err.message, 'error');
    }
    event.target.value = '';
  }
 
  const optionLabel = (tx) => {
    if (tx.source === 'csv') return `Ligne ${formatInt(tx.testIndex)} (CSV importé)`;
    const number = Number.isFinite(tx.testIndex) ? `N° ${formatInt(tx.testIndex)}` : tx.id;
    return `Transaction ${number}${SHOW_GROUND_TRUTH && tx.actualClass === 1 ? ' · fraude réelle' : ''}`;
  };
 
  const level = visibleResult ? getRiskLevel(visibleResult.percent ?? visibleResult.score) : null;
  const verdict = level ? VERDICTS[level.key] : null;
 
  return (
    <div className="analysis-grid">
      <section className="card card-pad">
        <h2 className="section-title"><span>1.</span> Transaction à analyser</h2>
 
        <div className="seg">
          <button type="button" className={source === 'test' ? 'active' : ''} onClick={() => changeSource('test')}>Base de données</button>
          <button type="button" className={source === 'csv' ? 'active' : ''} onClick={() => changeSource('csv')}>Importer un CSV</button>
        </div>
 
        {source === 'csv' && (
          <div className="csv-box">
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} hidden />
            <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Choisir un fichier creditcard.csv
            </button>
            <p className="muted small">
              {csvName
                ? `${csvName} · ${csvTxs.length} lignes chargées`
                : 'Colonnes attendues : Time, V1 à V28, Amount (les 300 premières lignes sont lues).'}
            </p>
          </div>
        )}
 
        <div className="field">
          <label htmlFor="tx-select">Transaction</label>
          <select id="tx-select" className="input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)} disabled={list.length === 0}>
            {list.length === 0 && <option value="">Aucune transaction disponible</option>}
            {list.map((tx) => (
              <option key={tx.id} value={tx.id}>{optionLabel(tx)}</option>
            ))}
          </select>
          {selected && (
            <p className="helper">
              {selected.id}
              {selected.merchant ? ` · ${selected.merchant} · ${selected.location}` : ''}
              {SHOW_GROUND_TRUTH && selected.actualClass === 1 ? ' · fraude réelle (vérité connue)' : ''}
            </p>
          )}
        </div>
 
        <div className="form-row">
          <div className="field">
            <label htmlFor="amount">Montant (€)</label>
            <input id="amount" className="input" readOnly value={selected ? formatAmountInput(selected.amount) : ''} />
          </div>
          <div className="field">
            <label htmlFor="time">Heure (secondes)</label>
            <input id="time" className="input" readOnly value={selected ? formatInt(selected.time) : ''} />
          </div>
        </div>
 
        <div className="vars-head">
          <span>{showAllVars ? `Toutes les variables (${allFeatures.length})` : 'Variables les plus marquées'}</span>
          <small>Composantes PCA anonymisées</small>
        </div>
        <div className={`var-grid ${showAllVars ? 'var-grid-all' : ''}`}>
          {shownFeatures.length === 0 && <p className="muted small">Aucune variable disponible.</p>}
          {shownFeatures.map((f) => (
            <div key={f.name} className="var-tile">
              <span>{f.name}</span>
              <strong>{formatNumber(f.value, 2)}</strong>
            </div>
          ))}
        </div>
        {allFeatures.length > 4 && (
          <button type="button" className="link-btn var-toggle" onClick={() => setShowAllVars((v) => !v)}>
            {showAllVars ? 'Réduire' : `Voir les ${allFeatures.length} variables`}
          </button>
        )}
 
        <button type="button" className="btn btn-primary btn-block" disabled={!selected || loading} onClick={() => selected && runAnalysis(selected)}>
          <Focus size={18} /> {loading ? 'Analyse en cours…' : 'Analyser la transaction'}
        </button>
        {error && <p className="error-text">{error}</p>}
      </section>
 
      <section>
        {visibleResult ? (
          <>
            <div className={`verdict verdict-${verdict.variant}`}>
              <div className="verdict-top">
                <div>
                  <div className="verdict-label">
                    VERDICT {visibleResult.simulated && <span className="sim-tag">Score fictif</span>}
                  </div>
                  <h2>{verdict.title}</h2>
                  <p>{verdict.sub}</p>
                </div>
                <div className="verdict-score">
                  <strong>{formatPercent(visibleResult.percent ?? visibleResult.score)} %</strong>
                  <span>probabilité de fraude</span>
                </div>
              </div>
              <div className="bar">
                <div className="bar-fill" style={{ width: `${visibleResult.percent ?? visibleResult.score}%` }} />
                <div className="bar-marker" style={{ left: `${visibleResult.thresholdPercent ?? visibleResult.threshold}%` }} />
              </div>
              <div className="bar-labels">
                <span>0 %</span>
                <span>Seuil de décision : {formatPercent(visibleResult.thresholdPercent ?? visibleResult.threshold, 1)} %</span>
                <span>100 %</span>
              </div>
            </div>
 
            <div className="actions-row">
              <button type="button" className="btn btn-primary" onClick={() => onCreateInvestigation(selected, visibleResult)}>
                <Folder size={18} /> Marquer à investiguer
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  downloadReport(selected, visibleResult);
                  notify('Rapport téléchargé.');
                }}
              >
                <ArrowRight size={18} /> Exporter le rapport
              </button>
            </div>
 
            {visibleResult.simulated && (
              <p className="sim-note">
                <Info size={16} /> Score et prédiction fictifs : le modèle de Machine Learning n’est pas encore connecté.
              </p>
            )}
          </>
        ) : (
          <div className="card empty-analysis">
            <Focus size={28} />
            <h3>{loading ? 'Analyse en cours…' : error ? 'Analyse impossible' : 'Aucune analyse affichée'}</h3>
            <p>{error || 'Sélectionnez une transaction puis cliquez sur « Analyser la transaction ».'}</p>
          </div>
        )}
      </section>
    </div>
  );
}