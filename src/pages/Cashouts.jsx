import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

const CATEGORIES = [
  { value: 'supplier', label: 'Supplier Payment' },
  { value: 'bank_deposit', label: 'Bank Deposit' },
  { value: 'petty_cash', label: 'Petty Cash' },
  { value: 'wages', label: 'Wages' },
  { value: 'other', label: 'Other' },
];

export default function Cashouts() {
  const [searchParams] = useSearchParams();
  const [cashouts, setCashouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(searchParams.get('add') === 'true');
  const [editingId, setEditingId] = useState(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('other');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    loadCashouts();
  }, [filterCategory]);

  async function loadCashouts() {
    try {
      const params = {};
      if (filterCategory) params.category = filterCategory;
      const data = await api.getCashouts(params);
      setCashouts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setAmount('');
    setReason('');
    setCategory('other');
    setEditingId(null);
    setShowForm(false);
    setError('');
  }

  function startEdit(cashout) {
    setEditingId(cashout.id);
    setAmount(cashout.amount.toString());
    setReason(cashout.reason);
    setCategory(cashout.category);
    setShowForm(true);
    setError('');
  }

  function handleNewCashout() {
    resetForm();
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await api.updateCashout(editingId, {
          amount: parseFloat(amount),
          reason,
          category,
        });
      } else {
        await api.addCashout({
          amount: parseFloat(amount),
          reason,
          category,
        });
      }
      resetForm();
      loadCashouts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this cashout?')) return;
    try {
      await api.deleteCashout(id);
      if (editingId === id) resetForm();
      loadCashouts();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cafe-700" />
      </div>
    );
  }

  const totalToday = cashouts.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-cafe-900 font-serif">Cashouts</h2>
        <button
          onClick={() => showForm && !editingId ? resetForm() : handleNewCashout()}
          className="btn-primary text-sm"
        >
          {showForm && !editingId ? 'Cancel' : '+ Add Cashout'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Add / Edit Cashout Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-cafe-800">
              {editingId ? 'Edit Cashout' : 'New Cashout'}
            </h3>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-sm text-cafe-500 hover:text-cafe-700">
                Cancel Edit
              </button>
            )}
          </div>

          <div>
            <label className="label">Amount ($NZD)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="input-field"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="label">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="input-field"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Reason / Description</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="input-field"
              rows={2}
              placeholder="What is this cashout for?"
              required
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting
              ? (editingId ? 'Saving...' : 'Adding...')
              : (editingId ? 'Save Changes' : `Add Cashout — $${parseFloat(amount || 0).toFixed(2)}`)
            }
          </button>
        </form>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCategory('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            !filterCategory ? 'bg-cafe-800 text-white' : 'bg-cafe-100 text-cafe-600'
          }`}
        >
          All
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setFilterCategory(c.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filterCategory === c.value ? 'bg-cafe-800 text-white' : 'bg-cafe-100 text-cafe-600'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-cafe-100 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-cafe-600">{cashouts.length} cashout{cashouts.length !== 1 ? 's' : ''}</span>
        <span className="font-bold text-cafe-900">Total: ${totalToday.toFixed(2)}</span>
      </div>

      {/* Cashouts List */}
      <div className="space-y-2">
        {cashouts.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-cafe-400">No cashouts found</p>
          </div>
        ) : (
          cashouts.map(c => (
            <div
              key={c.id}
              className={`card flex items-start justify-between gap-3 ${editingId === c.id ? 'ring-2 ring-cafe-500' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-cafe-800 truncate">{c.reason}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cafe-100 text-cafe-600 whitespace-nowrap">
                    {CATEGORIES.find(cat => cat.value === c.category)?.label || c.category}
                  </span>
                </div>
                <p className="text-xs text-cafe-400">
                  {c.performed_by} &middot;{' '}
                  {new Date(c.created_at).toLocaleDateString('en-NZ', {
                    day: 'numeric', month: 'short'
                  })}{' '}
                  {new Date(c.created_at).toLocaleTimeString('en-NZ', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-sm font-bold text-red-600">-${c.amount.toFixed(2)}</span>
                {/* Edit button */}
                <button
                  onClick={() => startEdit(c)}
                  className="text-cafe-300 hover:text-cafe-600 transition-colors p-1"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-cafe-300 hover:text-red-500 transition-colors p-1"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
