import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';


export default function Dashboard() {
  const [register, setRegister] = useState(null);
  const [loading, setLoading] = useState(true);
  const { name } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const reg = await api.getTodayRegister();
      setRegister(reg);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cafe-700" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-NZ', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-cafe-900 font-serif">
          Good {getGreeting()}, {name}
        </h2>
        <p className="text-cafe-500 text-sm">{today}</p>
      </div>

      {/* Register Status Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-cafe-800 font-serif">Today's Register</h3>
          {register ? (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              register.status === 'open'
                ? 'bg-green-100 text-green-700'
                : 'bg-cafe-100 text-cafe-600'
            }`}>
              {register.status === 'open' ? 'Open' : 'Closed'}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
              Not Opened
            </span>
          )}
        </div>

        {register ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Opening Float" value={`$${register.opening_balance.toFixed(2)}`} />
              <StatBox label="Total Cashouts" value={`$${(register.total_cashouts || 0).toFixed(2)}`} color="red" />
              <StatBox
                label="Expected Balance"
                value={`$${(register.opening_balance - (register.total_cashouts || 0)).toFixed(2)}`}
              />
              {register.status === 'closed' && (
                <StatBox
                  label="Closing Balance"
                  value={`$${register.closing_balance?.toFixed(2) || '—'}`}
                  color={register.shortage_amount > 0 ? 'red' : 'green'}
                />
              )}
            </div>

            {register.shortage_amount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-700 text-sm font-semibold">
                  Shortage: ${register.shortage_amount.toFixed(2)}
                </p>
                {register.shortage_reason && (
                  <p className="text-red-600 text-sm mt-1">Reason: {register.shortage_reason}</p>
                )}
              </div>
            )}

            {register.status === 'open' && (
              <div className="flex gap-2">
                <Link to="/cashouts?add=true" className="btn-primary flex-1">
                  + Add Cashout
                </Link>
                <Link to="/register" className="btn-secondary flex-1">
                  Daily Cash Up
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <Logo size="md" className="text-cafe-300 mb-4" />
            <p className="text-cafe-500 mb-4">Register hasn't been opened yet today</p>
            <Link to="/register" className="btn-primary inline-flex">
              Open Register
            </Link>
          </div>
        )}
      </div>

      {/* Recent Cashouts */}
      {register?.cashouts?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-3 font-serif">Recent Cashouts</h3>
          <div className="space-y-2">
            {register.cashouts.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-cafe-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-cafe-800">{c.reason}</p>
                  <p className="text-xs text-cafe-400">
                    {c.performed_by} &middot; {new Date(c.created_at).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-sm font-semibold text-red-600">-${c.amount.toFixed(2)}</span>
              </div>
            ))}
            {register.cashouts.length > 5 && (
              <Link to="/cashouts" className="text-sm text-cafe-600 hover:text-cafe-800 font-medium block text-center pt-1">
                View all {register.cashouts.length} cashouts
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/reports" className="card hover:shadow-md transition-shadow text-center py-5">
          <span className="text-2xl block mb-1">&#128202;</span>
          <span className="text-sm font-medium text-cafe-700">View Reports</span>
        </Link>
        <Link to="/settings" className="card hover:shadow-md transition-shadow text-center py-5">
          <span className="text-2xl block mb-1">&#9881;</span>
          <span className="text-sm font-medium text-cafe-700">Settings</span>
        </Link>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  const colorClass = color === 'red' ? 'text-red-600' : color === 'green' ? 'text-green-600' : 'text-cafe-900';
  return (
    <div className="bg-cafe-50 rounded-xl p-3">
      <p className="text-xs text-cafe-500 mb-0.5">{label}</p>
      <p className={`text-lg font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
