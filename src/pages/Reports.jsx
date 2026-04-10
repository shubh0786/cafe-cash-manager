import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../services/api';

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReport();
  }, [dateFrom, dateTo]);

  async function loadReport() {
    setLoading(true);
    try {
      const data = await api.getSummaryReport({ from: dateFrom, to: dateTo });
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await api.exportCSV(dateFrom, dateTo);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cash-report-${dateFrom}-to-${dateTo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setExporting(false);
    }
  }

  const chartData = summary?.days
    ?.slice()
    .reverse()
    .map(d => ({
      date: new Date(d.date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' }),
      Opening: d.opening,
      Cashouts: d.cashouts,
      Closing: d.closing || 0,
      Shortage: d.shortage,
    })) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-cafe-900 font-serif">Reports</h2>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary text-sm"
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Date Range */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="label">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex-1">
            <label className="label">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cafe-700" />
        </div>
      ) : summary ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Total Days" value={summary.total_days} />
            <SummaryCard label="Total Opening" value={`$${summary.total_opening.toFixed(2)}`} />
            <SummaryCard label="Total Cashouts" value={`$${summary.total_cashouts.toFixed(2)}`} color="red" />
            <SummaryCard
              label="Shortage Days"
              value={`${summary.shortage_days} ($${summary.total_shortages.toFixed(2)})`}
              color={summary.shortage_days > 0 ? 'red' : 'green'}
            />
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-cafe-800 mb-4 font-serif">Cash Flow Overview</h3>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => `$${value.toFixed(2)}`}
                      contentStyle={{ borderRadius: 12, border: '1px solid #d4c4ad' }}
                    />
                    <Legend />
                    <Bar dataKey="Opening" fill="#6b5138" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Cashouts" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Closing" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Daily Breakdown */}
          <div className="card">
              <h3 className="font-semibold text-cafe-800 mb-3 font-serif">Daily Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cafe-100">
                    <th className="text-left py-2 px-2 text-cafe-600 font-medium">Date</th>
                    <th className="text-right py-2 px-2 text-cafe-600 font-medium">Open</th>
                    <th className="text-right py-2 px-2 text-cafe-600 font-medium">Cashouts</th>
                    <th className="text-right py-2 px-2 text-cafe-600 font-medium">Close</th>
                    <th className="text-right py-2 px-2 text-cafe-600 font-medium">Shortage</th>
                    <th className="text-center py-2 px-2 text-cafe-600 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.days.map(d => (
                    <tr key={d.date} className="border-b border-cafe-50 hover:bg-cafe-50">
                      <td className="py-2 px-2 font-medium">
                        {new Date(d.date).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-2 px-2 text-right">${d.opening.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right text-red-600">${d.cashouts.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right">{d.closing ? `$${d.closing.toFixed(2)}` : '—'}</td>
                      <td className={`py-2 px-2 text-right ${d.shortage > 0 ? 'text-red-600 font-semibold' : 'text-cafe-400'}`}>
                        {d.shortage > 0 ? `$${d.shortage.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          d.status === 'open' ? 'bg-green-500' : 'bg-cafe-300'
                        }`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card text-center py-8">
          <p className="text-cafe-400">No data for the selected period</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const textColor = color === 'red' ? 'text-red-600' : color === 'green' ? 'text-green-600' : 'text-cafe-900';
  return (
    <div className="card text-center">
      <p className="text-xs text-cafe-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${textColor}`}>{value}</p>
    </div>
  );
}
