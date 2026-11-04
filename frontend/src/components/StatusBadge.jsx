import { STATUSES } from '../config';

export default function StatusBadge({ status }) {
  const s = STATUSES.find((x) => x.key === status);
  return <span className={`badge badge-${status}`}>{s ? s.label : status}</span>;
}