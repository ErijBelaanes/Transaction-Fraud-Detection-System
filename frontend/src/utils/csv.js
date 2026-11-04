const REQUIRED = ['Time', 'Amount', ...Array.from({ length: 28 }, (_, i) => `V${i + 1}`)];

// Lit les premières lignes d'un fichier au format creditcard.csv (Kaggle).
// On ne lit que ~3 Mo pour ne pas bloquer le navigateur avec un fichier de 150 Mo.
export async function parseCreditCardCsv(file, maxRows = 300) {
  const chunk = await file.slice(0, 3_000_000).text();
  const lines = chunk.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('Le fichier est vide ou illisible.');

  const header = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());
  const missing = REQUIRED.filter((c) => !header.includes(c));
  if (missing.length) {
    throw new Error(`Colonnes manquantes : ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}`);
  }

  const rows = [];
  for (let i = 1; i < lines.length && rows.length < maxRows; i += 1) {
    const cells = lines[i].split(',').map((c) => c.replace(/"/g, '').trim());
    if (cells.length !== header.length) continue; // ligne tronquée
    const row = {};
    header.forEach((name, idx) => {
      row[name] = Number(cells[idx]);
    });
    rows.push(row);
  }
  if (rows.length === 0) throw new Error('Aucune ligne valide trouvée dans le fichier.');
  return rows;
}

// Transforme une ligne du CSV en "transaction" utilisable par l'application.
// La colonne Class (vérité terrain) est volontairement ignorée.
export function rowToTransaction(row, index) {
  const features = {};
  for (let i = 1; i <= 28; i += 1) features[`V${i}`] = row[`V${i}`];
  return {
    id: `CSV-${String(index + 1).padStart(5, '0')}`,
    testIndex: index + 1,
    source: 'csv',
    merchant: null,
    location: null,
    category: null,
    amount: row.Amount,
    time: row.Time,
    score: null,
    ageMinutes: null,
    features,
  };
}