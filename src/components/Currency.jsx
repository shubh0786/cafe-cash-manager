export function NZNote({ value, className = '' }) {
  return (
    <img
      src={`/currency/nz-${value}.jpg`}
      alt={`NZ $${value} note`}
      className={`rounded-md object-cover ${className}`}
      loading="lazy"
    />
  );
}

export function NZCoin({ value, className = '' }) {
  const coins = {
    2:   { text: '$2', gold: true, size: 28 },
    1:   { text: '$1', gold: true, size: 26 },
    0.5: { text: '50c', gold: false, size: 24 },
    0.2: { text: '20c', gold: false, size: 22 },
    0.1: { text: '10c', gold: false, size: 20 },
  };
  const c = coins[value];
  if (!c) return null;

  const r = c.size / 2;

  return (
    <svg viewBox="0 0 32 32" className={className} style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))' }}>
      <defs>
        <radialGradient id={`cg${value}`} cx="38%" cy="32%">
          <stop offset="0%" stopColor={c.gold ? '#f5e07a' : '#e0e0e0'} />
          <stop offset="40%" stopColor={c.gold ? '#d4a017' : '#c0c0c0'} />
          <stop offset="100%" stopColor={c.gold ? '#a67c00' : '#909090'} />
        </radialGradient>
        <radialGradient id={`cs${value}`} cx="55%" cy="60%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor={c.gold ? '#7a5800' : '#666'} stopOpacity="0.3" />
        </radialGradient>
      </defs>
      {/* Coin body */}
      <circle cx="16" cy="16" r={r} fill={`url(#cg${value})`} />
      <circle cx="16" cy="16" r={r} fill={`url(#cs${value})`} />
      {/* Rim */}
      <circle cx="16" cy="16" r={r} fill="none" stroke={c.gold ? '#b8860b' : '#a0a0a0'} strokeWidth="0.8" />
      <circle cx="16" cy="16" r={r - 1.5} fill="none" stroke={c.gold ? '#dbb840' : '#b8b8b8'} strokeWidth="0.3" opacity="0.5" />
      {/* Inner design ring */}
      <circle cx="16" cy="16" r={r - 3} fill="none" stroke={c.gold ? '#c49000' : '#aaa'} strokeWidth="0.3" opacity="0.4" />
      {/* Highlight */}
      <ellipse cx="13" cy="12" rx="4" ry="3" fill="white" opacity="0.12" />
      {/* Denomination */}
      <text x="16" y={value >= 1 ? 18.5 : 18} fontSize={value >= 1 ? 7.5 : 6}
            fontWeight="800" fill={c.gold ? '#5a3e00' : '#444'}
            textAnchor="middle" fontFamily="Arial" opacity="0.75">
        {c.text}
      </text>
    </svg>
  );
}
