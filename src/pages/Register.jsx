import { useState, useEffect } from 'react';
import { api } from '../services/api';
import DenominationInput from '../components/DenominationInput';
import Logo from '../components/Logo';

const DEFAULT_FLOAT = 300;

export default function Register() {
  const [register, setRegister] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [denomData, setDenomData] = useState({ denominations: {}, total: 0 });
  const [eftposAmount, setEftposAmount] = useState('');
  const [shortageReason, setShortageReason] = useState('');
  const [notes, setNotes] = useState('');
  const [bankedBy, setBankedBy] = useState('');
  const [dateBanked, setDateBanked] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRegister();
  }, []);

  async function loadRegister() {
    try {
      const reg = await api.getTodayRegister();
      setRegister(reg);
      if (!reg) setMode('open');
      else if (reg.status === 'open') setMode('close');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEditOpen(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.updateRegister(register.id, {
        opening_balance: denomData.total,
        opening_denominations: denomData.denominations,
      });
      await loadRegister();
      setMode('close');
      setSuccess('Opening balance updated!');
      setDenomData({ denominations: {}, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpen(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const result = await api.openRegister({
        opening_balance: denomData.total,
        denominations: denomData.denominations,
      });
      setRegister(result);
      setMode('close');
      setSuccess('Register opened successfully!');
      setDenomData({ denominations: {}, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClose(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const expectedBalance = register.opening_balance - (register.total_cashouts || 0);
    const shortage = expectedBalance - denomData.total;
    const hasDiscrepancy = Math.abs(shortage) > 0.01;

    if (hasDiscrepancy && !shortageReason.trim()) {
      setError(`There is a $${Math.abs(shortage).toFixed(2)} ${shortage > 0 ? 'shortage' : 'overage'}. Please provide a reason.`);
      setSubmitting(false);
      return;
    }

    const eftpos = parseFloat(eftposAmount) || 0;
    const totalCashedUp = denomData.total;
    const totalCashOwed = totalCashedUp - eftpos;
    const finalFloatTally = denomData.total;
    const floatDifference = finalFloatTally - DEFAULT_FLOAT;

    try {
      const result = await api.closeRegister({
        closing_balance: denomData.total,
        denominations: denomData.denominations,
        shortage_reason: hasDiscrepancy ? shortageReason : null,
        notes: [
          notes,
          eftpos > 0 ? `EFTPOS: $${eftpos.toFixed(2)}` : '',
          `Total Cash Owed: $${totalCashOwed.toFixed(2)}`,
          `Float: $${DEFAULT_FLOAT.toFixed(2)} | Tally: $${finalFloatTally.toFixed(2)} | Diff: $${floatDifference.toFixed(2)}`,
          bankedBy ? `Banked by: ${bankedBy}` : '',
          dateBanked ? `Date banked: ${dateBanked}` : '',
        ].filter(Boolean).join(' | '),
      });
      setRegister({ ...result, total_cashouts: register.total_cashouts, cashouts: register.cashouts });
      setMode(null);
      setSuccess('Daily cash up completed!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cafe-700" />
      </div>
    );
  }

  const expectedBalance = register
    ? register.opening_balance - (register.total_cashouts || 0)
    : 0;
  const shortage = expectedBalance - denomData.total;
  const hasDiscrepancy = Math.abs(shortage) > 0.01;

  const eftpos = parseFloat(eftposAmount) || 0;
  const totalCashedUp = denomData.total;
  const totalCashOwed = totalCashedUp - eftpos;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Logo size="sm" className="text-cafe-800" />
        <div>
          <h2 className="text-xl font-bold text-cafe-900 font-serif">Daily Cash Up</h2>
          <p className="text-sm text-cafe-500">
            {new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm border border-green-200">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Register Status */}
      {register && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-cafe-800">Today's Status</h3>
            <div className="flex items-center gap-2">
              {register.status === 'open' && mode !== 'editOpen' && (
                <button
                  onClick={() => setMode('editOpen')}
                  className="text-cafe-400 hover:text-cafe-700 transition-colors"
                  title="Edit opening balance"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
              )}
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                register.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-cafe-100 text-cafe-600'
              }`}>
                {register.status === 'open' ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-cafe-50 rounded-lg p-2">
              <p className="text-xs text-cafe-500">Opening</p>
              <p className="font-bold text-cafe-900">${register.opening_balance.toFixed(2)}</p>
            </div>
            <div className="bg-cafe-50 rounded-lg p-2">
              <p className="text-xs text-cafe-500">Cashouts</p>
              <p className="font-bold text-red-600">${(register.total_cashouts || 0).toFixed(2)}</p>
            </div>
            <div className="bg-cafe-50 rounded-lg p-2">
              <p className="text-xs text-cafe-500">Expected</p>
              <p className="font-bold text-cafe-900">${expectedBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Open Register Form */}
      {mode === 'open' && (
        <form onSubmit={handleOpen} className="card space-y-4">
          <h3 className="font-semibold text-cafe-800 text-lg font-serif">Open Register</h3>
          <p className="text-sm text-cafe-500">Count your opening float:</p>
          <DenominationInput onChange={setDenomData} />
          <button type="submit" disabled={submitting || denomData.total <= 0} className="btn-primary w-full">
            {submitting ? 'Opening...' : `Open Register — $${denomData.total.toFixed(2)}`}
          </button>
        </form>
      )}

      {/* Edit Opening Balance */}
      {mode === 'editOpen' && (
        <form onSubmit={handleEditOpen} className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-cafe-800 text-lg font-serif">Edit Opening Balance</h3>
            <button type="button" onClick={() => setMode('close')} className="text-sm text-cafe-500 hover:text-cafe-700">
              Cancel
            </button>
          </div>
          <p className="text-sm text-cafe-500">Re-count your opening float:</p>
          <DenominationInput onChange={setDenomData} initialValues={register?.opening_denominations} />
          <button type="submit" disabled={submitting || denomData.total <= 0} className="btn-primary w-full">
            {submitting ? 'Saving...' : `Update Opening — $${denomData.total.toFixed(2)}`}
          </button>
        </form>
      )}

      {/* Close Register / Daily Cash Up Form */}
      {mode === 'close' && (
        <form onSubmit={handleClose} className="space-y-4">
          {/* Denomination Count */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-cafe-800 text-lg font-serif">Cash Count</h3>
            <p className="text-sm text-cafe-500">Count your closing cash by denomination:</p>
            <DenominationInput onChange={setDenomData} />
          </div>

          {/* Totals matching PDF form */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-cafe-800 font-serif">Daily Totals</h3>

            {/* Row 1: Total Cashed Up | Less Non-Cash (Eftpos) | Total Cash Owed */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-cafe-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-cafe-500 font-medium leading-tight">Total Cashed Up</p>
                <p className="text-xs text-cafe-400 leading-tight">(Day's Final Turnover)</p>
                <p className="font-bold text-cafe-900 text-lg mt-1">${totalCashedUp.toFixed(2)}</p>
              </div>
              <div className="bg-cafe-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-cafe-500 font-medium leading-tight">Less Non-Cash</p>
                <p className="text-xs text-cafe-400 leading-tight">(Eftpos)</p>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={eftposAmount}
                  onChange={e => setEftposAmount(e.target.value)}
                  className="w-full text-center font-bold text-cafe-900 text-lg mt-1 bg-white border border-cafe-200 rounded-lg py-1 focus:ring-2 focus:ring-cafe-500 focus:border-transparent"
                  placeholder="$0.00"
                />
              </div>
              <div className="bg-cafe-100 rounded-xl p-3 text-center">
                <p className="text-[10px] text-cafe-600 font-medium leading-tight">Total Cash Owed</p>
                <p className="text-xs text-cafe-400 leading-tight">(To Deposit at Bank)</p>
                <p className="font-bold text-cafe-900 text-lg mt-1">${totalCashOwed.toFixed(2)}</p>
              </div>
            </div>

            {/* Row 2: Total Float | Final Float Tally | Difference */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-cafe-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-cafe-500 font-medium">Total Float</p>
                <p className="font-bold text-cafe-900 text-lg mt-1">${DEFAULT_FLOAT.toFixed(2)}</p>
              </div>
              <div className="bg-cafe-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-cafe-500 font-medium">Final Float Tally</p>
                <p className="font-bold text-cafe-900 text-lg mt-1">${denomData.total.toFixed(2)}</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${
                Math.abs(denomData.total - DEFAULT_FLOAT) > 0.01
                  ? (denomData.total < DEFAULT_FLOAT ? 'bg-red-50' : 'bg-green-50')
                  : 'bg-cafe-50'
              }`}>
                <p className="text-[10px] text-cafe-500 font-medium">Difference</p>
                <p className={`font-bold text-lg mt-1 ${
                  Math.abs(denomData.total - DEFAULT_FLOAT) > 0.01
                    ? (denomData.total < DEFAULT_FLOAT ? 'text-red-600' : 'text-green-600')
                    : 'text-cafe-900'
                }`}>
                  {denomData.total > 0
                    ? `${(denomData.total - DEFAULT_FLOAT) >= 0 ? '+' : ''}$${(denomData.total - DEFAULT_FLOAT).toFixed(2)}`
                    : '—'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Shortage/Overage reason */}
          {denomData.total > 0 && hasDiscrepancy && (
            <div className={`card border-l-4 ${
              shortage > 0 ? 'border-l-red-500 bg-red-50' : 'border-l-blue-500 bg-blue-50'
            }`}>
              <p className={`font-semibold text-sm ${shortage > 0 ? 'text-red-700' : 'text-blue-700'}`}>
                {shortage > 0
                  ? `Cash Short: $${shortage.toFixed(2)}`
                  : `Cash Over: $${Math.abs(shortage).toFixed(2)}`
                }
              </p>
              <p className={`text-xs mt-0.5 ${shortage > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                Expected: ${expectedBalance.toFixed(2)} | Actual: ${denomData.total.toFixed(2)}
              </p>
              <div className="mt-3">
                <label className="label">Reason *</label>
                <textarea
                  value={shortageReason}
                  onChange={e => setShortageReason(e.target.value)}
                  className="input-field"
                  rows={2}
                  placeholder={`Why is the cash ${shortage > 0 ? 'short' : 'over'}?`}
                  required
                />
              </div>
            </div>
          )}

          {/* Banked By / Date Banked - matching PDF */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-cafe-800 font-serif">Banking Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Banked By (Name & Signature)</label>
                <input
                  type="text"
                  value={bankedBy}
                  onChange={e => setBankedBy(e.target.value)}
                  className="input-field"
                  placeholder="Staff name"
                />
              </div>
              <div>
                <label className="label">Date Banked</label>
                <input
                  type="date"
                  value={dateBanked}
                  onChange={e => setDateBanked(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <label className="label">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input-field"
              rows={2}
              placeholder="Any additional notes for today..."
            />
          </div>

          <button type="submit" disabled={submitting || denomData.total <= 0} className="btn-primary w-full text-base py-3">
            {submitting ? 'Closing...' : `Complete Daily Cash Up — $${denomData.total.toFixed(2)}`}
          </button>
        </form>
      )}

      {/* Closed summary */}
      {register?.status === 'closed' && mode === null && (
        <div className="card py-6">
          <div className="text-center">
            <div className="text-cafe-800 mb-3">
              <Logo size="sm" />
            </div>
            <span className="text-4xl block mb-2 text-green-600">&#10004;</span>
            <p className="text-cafe-700 font-semibold font-serif text-lg">Daily Cash Up Complete</p>
            <p className="text-sm text-cafe-500 mt-1">
              Closed at ${register.closing_balance?.toFixed(2)} by {register.closed_by}
            </p>
          </div>
          {register.shortage_amount > 0 && (
            <div className="mt-3 bg-red-50 rounded-xl p-3 text-left">
              <p className="text-red-700 text-sm font-semibold">
                Shortage: ${register.shortage_amount.toFixed(2)}
              </p>
              <p className="text-red-600 text-sm">{register.shortage_reason}</p>
            </div>
          )}
          {register.notes && (
            <div className="mt-3 bg-cafe-50 rounded-xl p-3 text-left">
              <p className="text-cafe-600 text-sm">{register.notes}</p>
            </div>
          )}
          <button
            onClick={() => setMode('close')}
            className="btn-secondary w-full mt-4"
          >
            Edit Cash Up
          </button>
        </div>
      )}
    </div>
  );
}
