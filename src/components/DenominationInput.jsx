import { useState, useEffect } from 'react';

const NZD_DENOMINATIONS = [
  { label: '$100', value: 100, type: 'note' },
  { label: '$50', value: 50, type: 'note' },
  { label: '$20', value: 20, type: 'note' },
  { label: '$10', value: 10, type: 'note' },
  { label: '$5', value: 5, type: 'note' },
  { label: '$2', value: 2, type: 'coin' },
  { label: '$1', value: 1, type: 'coin' },
  { label: '50c', value: 0.5, type: 'coin' },
  { label: '20c', value: 0.2, type: 'coin' },
  { label: '10c', value: 0.1, type: 'coin' },
];

export default function DenominationInput({ onChange, initialValues }) {
  const [counts, setCounts] = useState(() => {
    const init = {};
    NZD_DENOMINATIONS.forEach(d => {
      init[d.value] = initialValues?.[d.value] || 0;
    });
    return init;
  });

  const total = NZD_DENOMINATIONS.reduce(
    (sum, d) => sum + (counts[d.value] || 0) * d.value,
    0
  );

  useEffect(() => {
    onChange({ denominations: counts, total: Math.round(total * 100) / 100 });
  }, [counts]);

  function updateCount(denomValue, count) {
    const parsed = parseInt(count) || 0;
    setCounts(prev => ({ ...prev, [denomValue]: Math.max(0, parsed) }));
  }

  return (
    <div className="space-y-3">
      {/* Notes */}
      <div>
        <p className="text-xs font-semibold text-cafe-500 uppercase tracking-wide mb-2">Notes</p>
        <div className="grid grid-cols-5 gap-2">
          {NZD_DENOMINATIONS.filter(d => d.type === 'note').map(d => (
            <div key={d.value} className="text-center">
              <label className="text-xs font-medium text-cafe-600 block mb-1">{d.label}</label>
              <input
                type="number"
                min="0"
                value={counts[d.value] || ''}
                onChange={e => updateCount(d.value, e.target.value)}
                className="w-full text-center px-1 py-2 border border-cafe-200 rounded-lg focus:ring-2 focus:ring-cafe-500 focus:border-transparent text-sm"
                placeholder="0"
              />
              <span className="text-xs text-cafe-400 mt-0.5 block">
                ${((counts[d.value] || 0) * d.value).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Coins */}
      <div>
        <p className="text-xs font-semibold text-cafe-500 uppercase tracking-wide mb-2">Coins</p>
        <div className="grid grid-cols-5 gap-2">
          {NZD_DENOMINATIONS.filter(d => d.type === 'coin').map(d => (
            <div key={d.value} className="text-center">
              <label className="text-xs font-medium text-cafe-600 block mb-1">{d.label}</label>
              <input
                type="number"
                min="0"
                value={counts[d.value] || ''}
                onChange={e => updateCount(d.value, e.target.value)}
                className="w-full text-center px-1 py-2 border border-cafe-200 rounded-lg focus:ring-2 focus:ring-cafe-500 focus:border-transparent text-sm"
                placeholder="0"
              />
              <span className="text-xs text-cafe-400 mt-0.5 block">
                ${((counts[d.value] || 0) * d.value).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between bg-cafe-100 rounded-xl px-4 py-3 mt-2">
        <span className="font-semibold text-cafe-800">Total</span>
        <span className="text-xl font-bold text-cafe-900">${total.toFixed(2)}</span>
      </div>
    </div>
  );
}
