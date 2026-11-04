import { mockTransactions } from './mockTransactions';
import { ANALYSTS, DECISION_THRESHOLD } from '../config';

const byId = (id) => mockTransactions.find((t) => t.id === id);

// Date relative à aujourd'hui (pour afficher "Aujourd'hui", "Hier"…)
function at(daysAgo, hh, mm) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

function build(base) {
  const tx = byId(base.transactionId);
  return {
    account: '',
    txCount: 1,
    notes: '',
    outcome: '',
    conclusion: '',
    ...base,
    amount: tx.amount,
    time: tx.time,
    score: tx.score,
    prediction: tx.score >= DECISION_THRESHOLD ? 'Suspecte' : 'Légitime',
  };
}

const handmade = [
  build({
    id: 'INV-2025-042', title: 'Achats internationaux inhabituels', transactionId: 'TRX-8A42F1',
    account: '4821', txCount: 4, status: 'en_investigation', priority: 'critique', analyst: 'Sophie Martin',
    notes: 'Quatre achats à l’étranger en moins de 20 minutes. Contact du client en cours.',
    createdAt: at(1, 17, 5), updatedAt: at(0, 9, 42),
  }),
  build({
    id: 'INV-2025-041', title: 'Multiples transactions rapprochées', transactionId: 'TRX-6B19D4',
    account: '7392', txCount: 7, status: 'a_examiner', priority: 'eleve', analyst: 'Marc Leroy',
    createdAt: at(0, 7, 50), updatedAt: at(0, 8, 15),
  }),
  build({
    id: 'INV-2025-039', title: 'Connexion et paiement à l’étranger', transactionId: 'TRX-4C77E2',
    account: '1268', txCount: 3, status: 'en_investigation', priority: 'eleve', analyst: 'Nadia Benali',
    notes: 'Connexion depuis une nouvelle adresse IP suivie d’un paiement important.',
    createdAt: at(3, 10, 12), updatedAt: at(1, 16, 34),
  }),
  build({
    id: 'INV-2025-035', title: 'Achat e-commerce atypique', transactionId: 'TRX-A1F5D8',
    account: '9054', txCount: 2, status: 'resolu', priority: 'modere', analyst: 'Sophie Martin',
    notes: 'Le client a confirmé les deux achats.', outcome: 'legitime',
    conclusion: 'Transaction validée par le client, aucune action requise.',
    createdAt: '2025-02-14T09:30:00.000Z', updatedAt: '2025-02-18T11:20:00.000Z',
  }),
];

const TITLES = [
  'Paiements fractionnés suspects', 'Carte utilisée dans deux pays', 'Rafale de petits achats',
  'Virement vers un nouveau bénéficiaire', 'Achat de cartes cadeaux', 'Changement soudain de comportement',
  'Retraits répétés en espèces', 'Paiement depuis un nouvel appareil', 'Transactions nocturnes inhabituelles',
  'Montant proche du plafond', 'Commerçant à risque élevé', 'Tentatives de paiement refusées',
  'Abonnements multiples non reconnus', 'Achat de crypto-actifs atypique', 'Paiement hôtelier à l’étranger',
  'Doublon de transaction', 'Utilisation d’une carte récente', 'Transfert international fractionné',
  'Dépenses de jeux en ligne', 'Achat d’électronique en rafale', 'Réservation de voyage atypique',
  'Paiement sans contact répété', 'Débit depuis un pays inhabituel', 'Compte secondaire sollicité',
];
const NUMBERS = [40, 38, 37, 36, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15];
const PRIORITIES = ['eleve', 'modere', 'faible', 'modere', 'eleve', 'modere'];

// 7 "à examiner" + 12 "en investigation" + 5 "résolu" (+ les 4 ci-dessus = 8 / 14 / 6)
const STATUS_POOL = [
  ...Array(7).fill('a_examiner'),
  ...Array(12).fill('en_investigation'),
  ...Array(5).fill('resolu'),
];

let resolvedCounter = 0;
const generated = NUMBERS.map((num, i) => {
  const status = STATUS_POOL[(i * 7) % 24]; // permutation déterministe
  const tx = mockTransactions[(i + 4) % mockTransactions.length];
  const isResolved = status === 'resolu';
  const fraud = isResolved && resolvedCounter++ % 2 === 0;
  return build({
    id: `INV-2025-0${num}`,
    title: TITLES[i],
    transactionId: tx.id,
    account: String(1000 + ((i * 7919) % 9000)),
    txCount: 1 + ((i * 5) % 7),
    status,
    priority: PRIORITIES[i % 6],
    analyst: ANALYSTS[i % ANALYSTS.length],
    notes: `Dossier ouvert suite à une alerte du modèle (score fictif ${tx.score}/100).`,
    outcome: isResolved ? (fraud ? 'fraude_confirmee' : 'legitime') : '',
    conclusion: isResolved
      ? fraud
        ? 'Fraude confirmée après contact avec le titulaire de la carte.'
        : 'Transaction validée par le client, aucune action requise.'
      : '',
    createdAt: at(5 + i, 9, (i * 13) % 60),
    updatedAt: at(2 + i, 8 + ((i * 3) % 10), (i * 17) % 60),
  });
});

export function buildSeedInvestigations() {
  return [...handmade, ...generated];
}