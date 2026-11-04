import { initials } from '../utils/format';

export default function Avatar({ name, size = 34 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}>
      {initials(name)}
    </span>
  );
}