import { getRiskByKey } from '../config';

export default function RiskBadge({ level }) {
  const l = getRiskByKey(level);
  return <span className={`badge badge-${l.key}`}>{l.label}</span>;
}