import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, ChevronRight, Clock, Info, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { getRiskByKey, getRiskLevel } from '../config';
import { ALERT_VOLUME, BASE_STATS, RISK_DISTRIBUTION } from '../data/mockStats';
import { formatAgo, formatEuro, formatInt, formatNumber, formatPercent } from '../utils/format';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
 
// summary : chiffres réels du backend (null en mode démonstration -> données fictives)
// apiMode : true quand l'application parle au backend
export default function Dashboard({ transactions, investigations, search, onOpenTransaction, summary, apiMode }) {
  const real = Boolean(summary);
  const [period, setPeriod] = useState('7j');
  const [showAll, setShowAll] = useState(false);
 
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const source = real ? summary.topAlerts : transactions;
    return source
      .filter((t) => !q || t.id.toLowerCase().includes(q) || (t.merchant ?? '').toLowerCase().includes(q))
      .sort((a, b) => (real ? b.score - a.score : a.ageMinutes - b.ageMinutes));
  }, [real, summary, transactions, search]);
 
  // Mode API mais pas (encore) de chiffres : on n'affiche JAMAIS de données fictives à la place
  if (apiMode && !real) {
    return (
      <div className="card empty-analysis">
        <Info size={28} />
        <h3>Tableau de bord indisponible</h3>
        <p>Vérifiez que le backend est lancé et que le modèle est chargé (GET /health), puis rechargez la page.</p>
      </div>
    );
  }
 
  // ---- Chiffres affichés : réels (backend) ou fictifs (démo)
  const distribution = (real ? summary.distribution : RISK_DISTRIBUTION).map((r) => ({ ...r, ...getRiskByKey(r.key) }));
  const totalAlerts = distribution.reduce((sum, r) => sum + r.value, 0);
  const totalAnalyzed = real ? summary.totalAnalyzed : BASE_STATS.totalAnalyzed;
  const alertRate = totalAnalyzed ? (totalAlerts / totalAnalyzed) * 100 : 0;
  const metrics = real ? summary.metrics : null;
 
  // Graphique : alertes par niveau de risque (réel) ou légitimes / suspectes (démo)
  const mockVolume = ALERT_VOLUME[period];
  const volume = real
    ? { subtitle: 'Alertes par tranche de 6 h, selon le niveau de risque (jeu de test)', data: summary.volume }
    : mockVolume;
  const series = real
    ? ['critique', 'eleve', 'modere'].map((key) => ({ key, name: getRiskByKey(key).label, color: getRiskByKey(key).color }))
    : [
        { key: 'suspectes', name: 'Suspectes', color: '#e5737f' },
        { key: 'legitimes', name: 'Légitimes', color: '#2d7d64' },
      ];
  const legend = real ? series : [series[1], series[0]];
 
  // Chiffres calculés à partir des dossiers réellement présents dans l'application
  const toReview = investigations.filter((i) => i.status === 'a_examiner').length;
  const criticalOpen = investigations.filter((i) => i.priority === 'critique' && i.status !== 'resolu').length;
 
  const visible = showAll ? rows : rows.slice(0, 4);
 
  return (
    <>
      <div className="stats">
        <StatCard
          icon={TrendingUp}
          tone="blue"
          label="Transactions analysées"
          value={formatInt(totalAnalyzed)}
          sub={real ? 'Jeu de test complet' : `+${formatNumber(BASE_STATS.vsYesterday, 1)} % vs hier`}
        />
        <StatCard icon={ShieldCheck} tone="red" label="Alertes détectées" value={formatInt(totalAlerts)} sub={`${formatNumber(alertRate, 2)} % des transactions`} />
        <StatCard icon={Clock} tone="amber" label="À examiner" value={formatInt(toReview)} sub={`${criticalOpen} alerte${criticalOpen > 1 ? 's' : ''} critique${criticalOpen > 1 ? 's' : ''}`} />
        {!real && (
          <StatCard icon={Sparkles} tone="green" label="Précision du modèle" value={`${formatNumber(BASE_STATS.accuracy, 1)} %`} sub={`+${formatNumber(BASE_STATS.accuracyDelta, 1)} % ce mois · simulé`} />
        )}
        {real && metrics && (
          <StatCard
            icon={Sparkles}
            tone="green"
            label="Rappel du modèle"
            value={`${formatNumber(metrics.recall * 100, 1)} %`}
            sub={`Précision ${formatNumber(metrics.precision * 100, 1)} % · ${metrics.detected}/${metrics.frauds} fraudes`}
          />
        )}
        {real && !metrics && (
          <StatCard icon={Sparkles} tone="green" label="Seuil de décision" value={`${Math.round(summary.threshold * 100)} %`} sub="Étiquettes du jeu de test indisponibles" />
        )}
      </div>
 
      <div className="charts-row">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Volume d’alertes</h2>
              <p>{volume.subtitle}</p>
            </div>
            {!real && (
              <select className="select-pill" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Période">
                {Object.entries(ALERT_VOLUME).map(([key, v]) => (
                  <option key={key} value={key}>{v.label}</option>
                ))}
              </select>
            )}
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volume.data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="38%">
                <CartesianGrid vertical={false} stroke="#e9eeeb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6a7a73', fontSize: 12 }} />
                <YAxis
                  width={44}
                  {...(real ? { allowDecimals: false } : { ticks: volume.ticks, domain: [0, volume.ticks[volume.ticks.length - 1]] })}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8a9791', fontSize: 12 }}
                />
                <Tooltip cursor={{ fill: 'rgba(20,80,63,.05)' }} formatter={(v, name) => [formatInt(v), name]} />
                {series.map((s, i) => (
                  <Bar key={s.key} dataKey={s.key} name={s.name} stackId="a" fill={s.color} radius={i === series.length - 1 ? [6, 6, 0, 0] : 0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            {legend.map((s) => (
              <span key={s.key}><i className="legend-dot" style={{ background: s.color }} />{s.name}</span>
            ))}
          </div>
        </section>
 
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Répartition du risque</h2>
              <p>Alertes actives par niveau</p>
            </div>
          </div>
          <div className="donut-body">
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} dataKey="value" nameKey="label" innerRadius="68%" outerRadius="100%" startAngle={90} endAngle={-270} stroke="#fff" strokeWidth={2}>
                    {distribution.map((d) => (
                      <Cell key={d.key} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <strong>{totalAlerts}</strong>
                <span>alertes</span>
              </div>
            </div>
            <ul className="risk-list">
              {distribution.map((d) => (
                <li key={d.key} className="risk-row">
                  <span><i className="legend-dot" style={{ background: d.color }} />{d.label}</span>
                  <strong>{d.value}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
 
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Alertes prioritaires</h2>
            <p>{real ? 'Transactions les plus risquées du jeu de test' : 'Transactions nécessitant votre attention'}</p>
          </div>
          <button type="button" className="link-btn" onClick={() => setShowAll((s) => !s)}>
            {showAll ? 'Voir moins' : 'Voir toutes les alertes'} <ArrowRight size={16} />
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Transaction</th>
              {!real && <th>Commerçant</th>}
              <th>Montant</th>
              <th>Score de risque</th>
              <th>{real ? 'Niveau' : 'Statut'}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((tx) => {
              const level = getRiskLevel(tx.percent ?? tx.score);
              return (
                <tr key={tx.id} className="clickable" onClick={() => onOpenTransaction(tx.id)}>
                  <td>
                    <div className="tx-id">{tx.id}</div>
                    <div className="muted small">{real ? `Heure : ${formatInt(tx.time)} s` : formatAgo(tx.ageMinutes)}</div>
                  </td>
                  {!real && (
                    <td>
                      <div className="tx-id">{tx.merchant}</div>
                      <div className="muted small">{tx.location} · {tx.category}</div>
                    </td>
                  )}
                  <td className="nowrap">{formatEuro(tx.amount)}</td>
                  <td className="nowrap">
                    <span className="score-dot" style={{ background: level.color }} />
                    {real ? (
                      <strong>{formatPercent(tx.percent ?? tx.score)} %</strong>
                    ) : (
                      <>
                        <strong>{tx.score}</strong> <span className="muted small">/100</span>
                      </>
                    )}
                  </td>
                  <td><RiskBadge level={level.key} /></td>
                  <td className="right">
                    <button type="button" className="chev-btn" aria-label={`Analyser ${tx.id}`}>
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={real ? 5 : 6} className="empty">
                  {search ? `Aucune transaction ne correspond à « ${search} ».` : 'Aucune alerte à afficher.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}