import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function History({ onBack }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRegisterHistory({ limit: 30 }).then(setRecords).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleExport() {
    try {
      const from = records.length > 0 ? records[records.length - 1].date : new Date().toISOString().split('T')[0];
      const to = new Date().toISOString().split('T')[0];
      const csv = await api.exportCSV(from, to);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'cash-up-history.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert(err.message); }
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-6">
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <button onClick={onBack} className="btn-ghost flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>Back
        </button>
        <h1 className="text-lg font-bold text-mj-900">History</h1>
        <button onClick={handleExport} disabled={records.length === 0} className="btn-ghost flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>CSV
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-mj-200 border-t-mj-600 rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 animate-fade-up">
          <div className="w-16 h-16 rounded-full bg-white border border-mj-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg className="w-8 h-8 text-mj-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-mj-600 font-medium">No cash ups yet</p>
          <p className="text-mj-400 text-sm mt-1">Complete your first cash up to see it here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r, i) => (
            <div key={r.id}
                 className="glass-card p-4 animate-fade-up hover:shadow-md hover:border-mj-300 transition-all duration-200"
                 style={{ animationDelay: `${i * 0.03}s` }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-mj-800">
                    {new Date(r.date + 'T00:00:00').toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-xs text-mj-400 mt-0.5">by {r.opened_by}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-mj-700">${(r.closing_balance ?? r.opening_balance).toFixed(2)}</p>
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5 ${
                    r.status === 'open'
                      ? 'bg-mj-100 text-mj-600 border border-mj-200'
                      : 'bg-gold-50 text-gold-700 border border-gold-200'
                  }`}>{r.status}</span>
                </div>
              </div>
              {(r.status === 'closed' || r.shortage_amount > 0) && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-mj-100 text-xs">
                  <span className="text-mj-400">Open: ${r.opening_balance.toFixed(2)}</span>
                  {r.closing_balance != null && <span className="text-mj-400">Close: ${r.closing_balance.toFixed(2)}</span>}
                  {r.shortage_amount > 0 && (
                    <span className="text-red-500 font-bold ml-auto">Short: ${r.shortage_amount.toFixed(2)}</span>
                  )}
                </div>
              )}
              {r.notes && <p className="text-[11px] text-mj-400 mt-2 truncate">{r.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
