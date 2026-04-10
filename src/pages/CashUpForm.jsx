import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { NZNote, NZCoin } from '../components/Currency';
import { downloadPDF, shareToWhatsApp } from '../services/pdfReport';

const NOTES_LIST = [
  { label: '$100', value: 100, color: '#d49a2a', bg: '#fdf9ef', border: '#f2dfa6' },
  { label: '$50', value: 50, color: '#1a5b58', bg: '#f0f7f7', border: '#b4ddd9' },
  { label: '$20', value: 20, color: '#2e8c86', bg: '#f0f7f7', border: '#7ec4bf' },
  { label: '$10', value: 10, color: '#ba7a1f', bg: '#fdf9ef', border: '#e8c86e' },
  { label: '$5', value: 5, color: '#4da8a1', bg: '#f0f7f7', border: '#b4ddd9' },
];

const COINS_LIST = [
  { label: '$2', value: 2, color: '#1a5b58' },
  { label: '$1', value: 1, color: '#d49a2a' },
  { label: '50c', value: 0.5, color: '#2e8c86' },
  { label: '20c', value: 0.2, color: '#ba7a1f' },
  { label: '10c', value: 0.1, color: '#4da8a1' },
];

const CASHOUT_CATEGORIES = [
  { value: 'countdown', label: 'Countdown Purchase', icon: '🛒' },
  { value: 'cash_given', label: 'Cash Given to Someone', icon: '🤝' },
  { value: 'supplier', label: 'Supplier Payment', icon: '📦' },
  { value: 'petty_cash', label: 'Petty Cash', icon: '💵' },
  { value: 'other', label: 'Other', icon: '📝' },
];

const STEPS = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'cashouts', label: 'Cash Out', icon: '📤' },
  { id: 'totals', label: 'Totals', icon: '📊' },
  { id: 'review', label: 'Review', icon: '✅' },
];

const DEFAULT_FLOAT = 300;

export default function CashUpForm({ onViewHistory }) {
  const { name, clearName } = useAuth();
  const [step, setStep] = useState(0);
  const [cashMode, setCashMode] = useState('count');
  const [quickTotal, setQuickTotal] = useState('');
  const [counts, setCounts] = useState({});
  const [eftpos, setEftpos] = useState('');
  const [cashedUp, setCashedUp] = useState('');
  const [tally, setTally] = useState('');
  const [diffReason, setDiffReason] = useState('');
  const [bankedBy, setBankedBy] = useState('');
  const [dateBanked, setDateBanked] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [existing, setExisting] = useState(null);

  const [cashouts, setCashouts] = useState([]);
  const [showCashoutForm, setShowCashoutForm] = useState(false);
  const [coAmount, setCoAmount] = useState('');
  const [coCategory, setCoCategory] = useState('countdown');
  const [coReason, setCoReason] = useState('');
  const [coGivenTo, setCoGivenTo] = useState('');
  const [coSaving, setCoSaving] = useState(false);
  const [editingCo, setEditingCo] = useState(null);

  const topRef = useRef(null);

  useEffect(() => {
    api.getTodayRegister().then(reg => {
      if (reg) { setExisting(reg); setCashouts(reg.cashouts || []); }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setError('');
  }, [step]);

  function getQty(val) { return parseInt(counts[val]) || 0; }
  function setQty(val, qty) { setCounts(prev => ({ ...prev, [val]: Math.max(0, qty) })); }

  const allDenoms = [...NOTES_LIST, ...COINS_LIST];
  const denomTotal = allDenoms.reduce((sum, d) => sum + getQty(d.value) * d.value, 0);
  const denomTotalRounded = Math.round(denomTotal * 100) / 100;
  const quickTotalVal = parseFloat(quickTotal) || 0;
  const total = cashMode === 'quick' ? quickTotalVal : denomTotalRounded;
  const totalCashouts = cashouts.reduce((s, c) => s + c.amount, 0);

  const totalSalesVal = parseFloat(cashedUp) || 0;
  const eftposVal = parseFloat(eftpos) || 0;
  const cashSales = totalSalesVal - eftposVal;
  const expectedTill = DEFAULT_FLOAT + cashSales - totalCashouts;
  const actualTillVal = parseFloat(tally) || 0;
  const tillDiff = actualTillVal - expectedTill;
  const hasDiff = actualTillVal > 0 && Math.abs(tillDiff) > 0.01;
  const toBank = actualTillVal > 0 ? actualTillVal - DEFAULT_FLOAT : 0;

  const dateDisplay = new Date().toLocaleDateString('en-NZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  async function loadToday() {
    const reg = await api.getTodayRegister();
    if (reg) { setExisting(reg); setCashouts(reg.cashouts || []); }
  }

  async function handleAddCashout(e) {
    e.preventDefault(); setCoSaving(true);
    try {
      if (!existing) {
        await api.openRegister({ opening_balance: 0, denominations: {} });
        await loadToday();
      }
      if (editingCo) {
        await api.updateCashout(editingCo, { amount: parseFloat(coAmount), reason: coReason, category: coCategory, given_to: coGivenTo || null });
      } else {
        await api.addCashout({ amount: parseFloat(coAmount), reason: coReason, category: coCategory, given_to: coGivenTo || null });
      }
      resetCashoutForm(); await loadToday();
    } catch (err) { setError(err.message); }
    finally { setCoSaving(false); }
  }

  function resetCashoutForm() {
    setCoAmount(''); setCoCategory('countdown'); setCoReason(''); setCoGivenTo('');
    setShowCashoutForm(false); setEditingCo(null);
  }
  function startEditCashout(c) {
    setEditingCo(c.id); setCoAmount(c.amount.toString()); setCoCategory(c.category);
    setCoReason(c.reason); setCoGivenTo(c.given_to || ''); setShowCashoutForm(true);
  }
  async function deleteCashout(id) {
    if (!confirm('Delete this cashout?')) return;
    try { await api.deleteCashout(id); await loadToday(); } catch (err) { alert(err.message); }
  }

  async function handleSave() {
    if (!tally || actualTillVal <= 0) { setError('Please enter the actual till count.'); return; }
    if (hasDiff && !diffReason.trim()) { setError('Please explain the till difference.'); return; }
    setSaving(true); setError('');
    try {
      if (!existing) await api.openRegister({ opening_balance: total, denominations: counts });
      const reg = await api.getTodayRegister();
      if (reg?.status === 'open') {
        await api.closeRegister({
          closing_balance: total, denominations: counts,
          shortage_reason: hasDiff ? `Till diff $${tillDiff.toFixed(2)}: ${diffReason}` : null,
          notes: [
            `Total Sales: $${totalSalesVal.toFixed(2)}`,
            eftposVal > 0 ? `Eftpos: $${eftposVal.toFixed(2)}` : '',
            `Cash Sales: $${cashSales.toFixed(2)}`,
            `Expected Till: $${expectedTill.toFixed(2)}`,
            `Actual Till: $${actualTillVal.toFixed(2)}`,
            hasDiff ? `Difference: $${tillDiff.toFixed(2)} — ${diffReason}` : '',
            `To Bank: $${toBank.toFixed(2)}`,
            totalCashouts > 0 ? `Cashouts: $${totalCashouts.toFixed(2)}` : '',
            bankedBy ? `Banked by: ${bankedBy}` : '',
            dateBanked ? `Date banked: ${dateBanked}` : '',
            additionalNotes || '',
          ].filter(Boolean).join(' | '),
        });
      }
      setSaved(true);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  function handleReset() {
    setCounts({}); setQuickTotal(''); setCashMode('count');
    setEftpos(''); setCashedUp(''); setTally(''); setDiffReason('');
    setBankedBy(''); setDateBanked(''); setAdditionalNotes('');
    setSaved(false); setExisting(null); setError(''); setCashouts([]); setStep(0);
  }

  const [sending, setSending] = useState(false);

  function buildWhatsAppMessage() {
    const lines = [
      `*Majestic Coast Plaza — Daily Cash Up*`,
      `Date: ${dateDisplay}`,
      `Completed by: ${name}`,
      '',
      `*Cash Count:* $${total.toFixed(2)}`,
    ];
    if (totalSalesVal > 0) lines.push(`*Total Sales:* $${totalSalesVal.toFixed(2)}`);
    if (eftposVal > 0) lines.push(`*Eftpos:* $${eftposVal.toFixed(2)}`);
    if (totalSalesVal > 0) lines.push(`*Cash Sales:* $${cashSales.toFixed(2)}`);
    if (totalCashouts > 0) lines.push(`*Cashouts:* -$${totalCashouts.toFixed(2)}`);
    lines.push('');
    lines.push(`*Expected Till:* $${expectedTill.toFixed(2)}`);
    lines.push(`*Actual Till:* $${actualTillVal.toFixed(2)}`);
    const diffText = Math.abs(tillDiff) <= 0.01 ? 'Balanced' : (tillDiff >= 0 ? `+$${tillDiff.toFixed(2)} over` : `-$${Math.abs(tillDiff).toFixed(2)} short`);
    lines.push(`*Difference:* ${diffText}`);
    if (hasDiff) lines.push(`*Reason:* ${diffReason}`);
    lines.push('');
    lines.push(`*To Bank:* $${toBank.toFixed(2)}`);
    if (bankedBy) lines.push(`Banked by: ${bankedBy}`);
    if (dateBanked) lines.push(`Date banked: ${dateBanked}`);
    if (additionalNotes) lines.push(`\nNotes: ${additionalNotes}`);
    return lines.join('\n');
  }

  async function handleSendPDF() {
    setSending(true);
    try {
      await downloadPDF('cash-up-report', `cash-up-${new Date().toISOString().split('T')[0]}.pdf`);
      setTimeout(() => {
        shareToWhatsApp(buildWhatsAppMessage());
      }, 500);
    } catch (err) {
      alert('Error generating PDF: ' + err.message);
    } finally {
      setSending(false);
    }
  }

  function handleWhatsAppOnly() {
    shareToWhatsApp(buildWhatsAppMessage());
  }

  // --- SUCCESS SCREEN ---
  if (saved) {
    return (
      <div className="max-w-lg mx-auto px-5 py-8">
        <div className="text-center animate-scale-in mb-6">
          <div className="w-20 h-20 rounded-full bg-mj-100 border-2 border-mj-300
                          flex items-center justify-center mx-auto mb-4 shadow-lg shadow-mj-200/50">
            <svg className="w-10 h-10 text-mj-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-mj-900 mb-1">Cash Up Complete!</h2>
        </div>

        {/* PDF-ready report */}
        <div id="cash-up-report" className="bg-white rounded-2xl p-5 mb-5" style={{ border: '1px solid #d9eeec' }}>
          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '2px solid #d9eeec' }}>
            <img src="/logo.png" alt="Majestic" className="h-10" />
            <div className="text-right">
              <p className="text-xs font-bold text-mj-800">Daily Cash Up</p>
              <p className="text-[10px] text-mj-400">{dateDisplay}</p>
              <p className="text-[10px] text-mj-400">By: {name}</p>
            </div>
          </div>

          <div className="space-y-1.5 text-sm">
            <Row label="Cash Count" value={`$${total.toFixed(2)}`} />
            {totalSalesVal > 0 && <Row label="Total Sales" value={`$${totalSalesVal.toFixed(2)}`} />}
            {eftposVal > 0 && <Row label="Eftpos" value={`$${eftposVal.toFixed(2)}`} />}
            {totalSalesVal > 0 && <Row label="Cash Sales" value={`$${cashSales.toFixed(2)}`} bold />}
            {totalCashouts > 0 && <Row label="Cashouts" value={`-$${totalCashouts.toFixed(2)}`} color="#dc2626" />}
            <div style={{ borderTop: '1px solid #d9eeec', paddingTop: '6px', marginTop: '6px' }} />
            <Row label="Float" value="$300.00" />
            <Row label="Expected Till" value={`$${expectedTill.toFixed(2)}`} />
            <Row label="Actual Till" value={`$${actualTillVal.toFixed(2)}`} bold />
            <Row label="Difference" value={
              Math.abs(tillDiff) <= 0.01 ? 'Balanced' : (tillDiff >= 0 ? `+$${tillDiff.toFixed(2)} over` : `-$${Math.abs(tillDiff).toFixed(2)} short`)
            } color={Math.abs(tillDiff) <= 0.01 ? '#2e8c86' : tillDiff < 0 ? '#dc2626' : '#2e8c86'} bold />
            {hasDiff && <Row label="Reason" value={diffReason} />}
            <div style={{ borderTop: '1px solid #d9eeec', paddingTop: '6px', marginTop: '6px' }} />
            <Row label="To Bank" value={`$${toBank.toFixed(2)}`} bold color="#d49a2a" />
            {bankedBy && <Row label="Banked By" value={bankedBy} />}
            {dateBanked && <Row label="Date Banked" value={dateBanked} />}
            {additionalNotes && <Row label="Notes" value={additionalNotes} />}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button onClick={handleWhatsAppOnly}
            className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2
                       active:scale-[0.97] transition-all"
            style={{ background: '#25D366', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)' }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Send via WhatsApp
          </button>

          <button onClick={handleSendPDF} disabled={sending}
            className="w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2
                       active:scale-[0.97] transition-all"
            style={{ background: '#1a5b58', color: '#fff', boxShadow: '0 4px 14px rgba(26,91,88,0.3)' }}>
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download PDF + WhatsApp
              </>
            )}
          </button>

          <div className="flex gap-2.5">
            <button onClick={handleReset} className="btn-secondary flex-1">New Cash Up</button>
            <button onClick={onViewHistory} className="btn-secondary flex-1">History</button>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN FORM ---
  return (
    <div className="max-w-lg mx-auto px-5 pt-4 pb-28">
      <div ref={topRef} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 animate-fade-up">
        <button onClick={onViewHistory} className="btn-ghost flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>History
        </button>
        <img src="/logo.png" alt="Majestic" className="h-9" />
        <button onClick={clearName} className="btn-ghost text-xs">{name} &#x2715;</button>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <div className="flex justify-between mb-2">
          {STEPS.map((s, i) => (
            <button key={s.id} onClick={() => setStep(i)}
              className={`flex flex-col items-center gap-0.5 transition-all duration-200 ${
                i === step ? 'scale-110' : i < step ? 'opacity-70' : 'opacity-30'
              }`}>
              <span className={`text-lg ${i <= step ? '' : 'grayscale'}`}>{s.icon}</span>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                i === step ? 'text-mj-700' : i < step ? 'text-mj-500' : 'text-mj-300'
              }`}>{s.label}</span>
            </button>
          ))}
        </div>
        <div className="h-1.5 bg-mj-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500 ease-out"
               style={{ width: `${((step + 1) / STEPS.length) * 100}%`,
                        background: 'linear-gradient(90deg, #1a5b58, #2e8c86)' }} />
        </div>
      </div>

      <p className="text-xs text-mj-400 text-center mb-4">{dateDisplay}</p>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm mb-4 border border-red-200 animate-scale-in">
          {error}
        </div>
      )}

      {/* STEP 0: Cash Count */}
      {step === 0 && (
        <div className="animate-fade-up">
          <StepHeader title="Cash in Till" hint="How much cash is in the register?" />

          {/* Mode Toggle */}
          <div className="flex bg-mj-100 rounded-2xl p-1 mb-5">
            <button onClick={() => setCashMode('count')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                cashMode === 'count' ? 'bg-white text-mj-800 shadow-sm' : 'text-mj-400'
              }`}>
              Count It
            </button>
            <button onClick={() => setCashMode('quick')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                cashMode === 'quick' ? 'bg-white text-mj-800 shadow-sm' : 'text-mj-400'
              }`}>
              Quick Entry
            </button>
          </div>

          {cashMode === 'quick' ? (
            /* Quick Entry Mode */
            <div className="animate-fade-up">
              <div className="glass-card p-6 mb-5 text-center">
                <p className="text-xs text-mj-400 mb-3">Type the total cash amount</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl text-mj-400">$</span>
                  <input type="number" step="0.01" min="0" value={quickTotal}
                    onChange={e => setQuickTotal(e.target.value)}
                    className="text-4xl font-black text-mj-800 bg-transparent border-0 border-b-3 border-mj-200
                               focus:border-mj-500 outline-none transition-colors w-48 text-center py-2"
                    placeholder="0.00" autoFocus />
                </div>
              </div>

              {/* Quick-add buttons */}
              <div className="mb-5">
                <p className="text-[10px] font-bold text-mj-400 uppercase tracking-wider mb-2">Quick Add</p>
                <div className="grid grid-cols-5 gap-2">
                  {[100, 50, 20, 10, 5].map(v => (
                    <button key={v} type="button"
                      onClick={() => setQuickTotal(prev => ((parseFloat(prev) || 0) + v).toFixed(2))}
                      className="py-3 rounded-xl bg-white border border-mj-200 text-sm font-bold text-mj-700
                                 hover:border-mj-400 active:scale-95 active:bg-mj-50 transition-all">
                      +${v}
                    </button>
                  ))}
                  {[2, 1, 0.5, 0.2, 0.1].map(v => (
                    <button key={v} type="button"
                      onClick={() => setQuickTotal(prev => ((parseFloat(prev) || 0) + v).toFixed(2))}
                      className="py-2.5 rounded-xl bg-white border border-mj-200 text-xs font-bold text-mj-600
                                 hover:border-mj-400 active:scale-95 active:bg-mj-50 transition-all">
                      +${v < 1 ? (v * 100) + 'c' : v}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={() => setQuickTotal('')}
                className="w-full text-center text-xs text-mj-400 hover:text-red-500 mb-4 transition-colors">
                Clear
              </button>
            </div>
          ) : (
            /* Count Mode - Notes & Coins */
            <div className="animate-fade-up">
              {/* Notes */}
              <p className="text-[10px] font-bold text-mj-400 uppercase tracking-[0.2em] mb-2">Notes</p>
              <div className="space-y-2 mb-5">
                {NOTES_LIST.map(d => {
                  const qty = getQty(d.value); const lineTotal = qty * d.value; const active = qty > 0;
                  return (
                    <div key={d.value} className="flex items-center gap-3 p-2.5 rounded-2xl border transition-all duration-200"
                         style={{ background: active ? d.bg : '#fff', borderColor: active ? d.border : '#d9eeec',
                                  boxShadow: active ? `0 4px 14px ${d.color}12` : '0 1px 3px rgba(0,0,0,0.03)' }}>
                      <NZNote value={d.value} className={`w-14 shrink-0 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-35'}`} />
                      <div className="flex items-center gap-1.5 flex-1 justify-center">
                        <Stepper value={qty} onMinus={() => setQty(d.value, qty - 1)} onPlus={() => setQty(d.value, qty + 1)}
                                 onChange={v => setCounts(prev => ({ ...prev, [d.value]: v }))}
                                 rawValue={counts[d.value]} color={d.color} active={active} />
                      </div>
                      <span className="text-sm font-bold w-16 text-right" style={{ color: active ? d.color : '#b4ddd9' }}>
                        {active ? `$${lineTotal.toFixed(2)}` : '—'}</span>
                    </div>
                  );
                })}
              </div>

              {/* Coins */}
              <p className="text-[10px] font-bold text-mj-400 uppercase tracking-[0.2em] mb-2">Coins</p>
              <div className="grid grid-cols-5 gap-2 mb-5">
                {COINS_LIST.map(d => {
                  const qty = getQty(d.value); const lineTotal = qty * d.value; const active = qty > 0;
                  return (
                    <div key={d.value} className="rounded-2xl p-2.5 text-center border transition-all duration-200"
                         style={{ background: active ? `${d.color}08` : '#fff', borderColor: active ? `${d.color}30` : '#d9eeec' }}>
                      <NZCoin value={d.value} className={`w-8 h-8 mx-auto mb-1 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-35'}`} />
                      <div className="flex items-center justify-center gap-0.5 mb-1">
                        <button type="button" onClick={() => setQty(d.value, qty - 1)} disabled={qty <= 0}
                          className="w-6 h-6 rounded-lg bg-white border border-mj-200 flex items-center justify-center text-mj-400 active:scale-90 transition-all disabled:opacity-20 text-xs">−</button>
                        <input type="number" min="0" value={counts[d.value] ?? ''}
                          onChange={e => setCounts(prev => ({ ...prev, [d.value]: e.target.value }))}
                          className="w-9 text-center text-sm font-bold rounded-lg py-1 border-2 outline-none transition-colors"
                          style={{ background: '#fff', borderColor: active ? `${d.color}30` : '#d9eeec', color: active ? d.color : '#7ec4bf' }}
                          placeholder="0" />
                        <button type="button" onClick={() => setQty(d.value, qty + 1)}
                          className="w-6 h-6 rounded-lg text-white flex items-center justify-center active:scale-90 transition-all text-xs font-bold"
                          style={{ background: d.color }}>+</button>
                      </div>
                      <p className="text-[10px] font-semibold" style={{ color: active ? d.color : '#b4ddd9' }}>
                        {active ? `$${lineTotal.toFixed(2)}` : '—'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Running Total */}
          <div className="glass-card p-3 mb-5 text-center"
               style={{ background: total > 0 ? 'linear-gradient(135deg, #f0f7f7, #d9eeec)' : undefined }}>
            <p className="text-xs text-mj-400 font-semibold uppercase tracking-wider">Cash Total</p>
            <p className={`text-2xl font-black transition-all ${total > 0 ? 'text-mj-800' : 'text-mj-300'}`}>
              ${total.toFixed(2)}
            </p>
          </div>
          <NextButton onClick={() => setStep(1)} label="Next: Cashouts" />
        </div>
      )}

      {/* STEP 1: Cashouts */}
      {step === 1 && (
        <div className="animate-fade-up">
          <StepHeader title="Cashouts" hint="Record any cash taken out today" />

          {!showCashoutForm && (
            <button onClick={() => { resetCashoutForm(); setShowCashoutForm(true); }}
              className="w-full glass-card p-4 mb-4 flex items-center justify-center gap-2 text-mj-600 font-semibold
                         hover:border-mj-300 transition-all active:scale-[0.98]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" d="M12 5v14m-7-7h14" /></svg>
              Add Cashout
            </button>
          )}

          {showCashoutForm && (
            <form onSubmit={handleAddCashout} className="glass-card p-4 mb-4 space-y-3 animate-scale-in">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-mj-800">{editingCo ? 'Edit Cashout' : 'New Cashout'}</p>
                <button type="button" onClick={resetCashoutForm} className="text-xs text-mj-400 hover:text-mj-600">Cancel</button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-mj-400 uppercase tracking-wider block mb-1.5">What is it for?</label>
                <div className="grid grid-cols-2 gap-2">
                  {CASHOUT_CATEGORIES.map(c => (
                    <button key={c.value} type="button" onClick={() => setCoCategory(c.value)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all active:scale-[0.97] ${
                        coCategory === c.value ? 'border-mj-500 bg-mj-50 text-mj-800' : 'border-mj-100 bg-white text-mj-500'
                      }`}>
                      <span className="mr-1.5">{c.icon}</span>{c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-mj-400 uppercase tracking-wider block mb-1">Amount ($)</label>
                <input type="number" step="0.01" min="0.01" value={coAmount} onChange={e => setCoAmount(e.target.value)}
                  className="w-full border border-mj-200 rounded-xl px-3 py-3 text-base bg-white text-mj-800 font-semibold
                             focus:outline-none focus:border-mj-500 transition-colors" placeholder="0.00" required />
              </div>

              {coCategory === 'cash_given' && (
                <div>
                  <label className="text-[10px] font-bold text-mj-400 uppercase tracking-wider block mb-1">Given to (name)</label>
                  <input type="text" value={coGivenTo} onChange={e => setCoGivenTo(e.target.value)}
                    className="w-full border border-mj-200 rounded-xl px-3 py-3 text-base bg-white text-mj-800
                               focus:outline-none focus:border-mj-500 transition-colors" placeholder="Person's name" required />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-mj-400 uppercase tracking-wider block mb-1">Reason / details</label>
                <textarea value={coReason} onChange={e => setCoReason(e.target.value)}
                  className="w-full border border-mj-200 rounded-xl px-3 py-3 text-sm bg-white text-mj-800
                             focus:outline-none focus:border-mj-500 transition-colors resize-none" rows={2}
                  placeholder="What was this for?" required />
              </div>

              <button type="submit" disabled={coSaving || !coAmount || !coReason} className="btn-primary w-full">
                {coSaving ? 'Saving...' : editingCo ? 'Save Changes' : 'Add Cashout'}
              </button>
            </form>
          )}

          {cashouts.length > 0 && (
            <div className="space-y-2 mb-4">
              {cashouts.map(c => (
                <div key={c.id} className="glass-card px-4 py-3 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm">{CASHOUT_CATEGORIES.find(cat => cat.value === c.category)?.icon}</span>
                      <span className="text-sm font-semibold text-mj-800 truncate">{c.reason}</span>
                    </div>
                    <p className="text-[11px] text-mj-400">
                      {c.given_to && <span className="text-gold-600 font-medium">To: {c.given_to} · </span>}
                      {c.performed_by} · {new Date(c.created_at).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm font-bold text-red-500">-${c.amount.toFixed(2)}</span>
                    <button onClick={() => startEditCashout(c)} className="p-1.5 text-mj-300 hover:text-mj-600 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                    </button>
                    <button onClick={() => deleteCashout(c.id)} className="p-1.5 text-mj-300 hover:text-red-500 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
              <p className="text-right text-xs font-bold text-red-500 pr-1">Total: -${totalCashouts.toFixed(2)}</p>
            </div>
          )}

          {cashouts.length === 0 && !showCashoutForm && (
            <p className="text-center text-sm text-mj-300 mb-4">No cashouts — that's fine, you can skip this step</p>
          )}

          <div className="flex gap-3">
            <BackButton onClick={() => setStep(0)} />
            <NextButton onClick={() => setStep(2)} label="Next: Totals" className="flex-1" />
          </div>
        </div>
      )}

      {/* STEP 3: Totals */}
      {step === 2 && (
        <div className="animate-fade-up">
          <StepHeader title="Daily Totals" hint="Enter today's sales and count the till" />

          <div className="space-y-4 mb-6">
            {/* Sales Section */}
            <p className="text-[10px] font-bold text-mj-400 uppercase tracking-wider">Sales</p>

            <InputCard label="Total Sales" sublabel="Day's total turnover from the POS" value={cashedUp} onChange={setCashedUp}
                       placeholder="0.00" prefix="$" />

            <InputCard label="Eftpos" sublabel="Non-cash / card payments" value={eftpos} onChange={setEftpos}
                       placeholder="0.00" prefix="$" />

            {totalSalesVal > 0 && (
              <div className="glass-card p-4 text-center animate-scale-in">
                <p className="text-[10px] text-mj-400 font-bold uppercase tracking-wider mb-1">Cash Sales</p>
                <p className="text-[10px] text-mj-300 mb-1">Total Sales - Eftpos</p>
                <p className="text-2xl font-black" style={{ color: cashSales >= 0 ? '#1a5b58' : '#dc2626' }}>
                  ${cashSales.toFixed(2)}
                </p>
              </div>
            )}

            {/* Expected Till */}
            {totalSalesVal > 0 && (
              <div className="glass-card p-4 text-center animate-scale-in">
                <p className="text-[10px] text-mj-400 font-bold uppercase tracking-wider mb-1">Expected in Till</p>
                <p className="text-[10px] text-mj-300 mb-1">
                  $300 float + ${cashSales.toFixed(2)} cash sales{totalCashouts > 0 ? ` - $${totalCashouts.toFixed(2)} cashouts` : ''}
                </p>
                <p className="text-2xl font-black text-mj-800">${expectedTill.toFixed(2)}</p>
              </div>
            )}

            {/* Actual Till Count */}
            <div className="border-t border-mj-100 pt-4">
              <p className="text-[10px] font-bold text-mj-400 uppercase tracking-wider mb-3">Till Count</p>

              <InputCard label="Actual Till Count *" sublabel="Count all cash in the till now" value={tally} onChange={setTally}
                         placeholder="0.00" prefix="$" required />

              {/* Difference: Actual vs Expected */}
              {actualTillVal > 0 && totalSalesVal > 0 && (
                <div className="glass-card p-4 text-center mt-3 animate-scale-in"
                     style={{ borderLeft: `4px solid ${Math.abs(tillDiff) <= 0.01 ? '#2e8c86' : tillDiff < 0 ? '#dc2626' : '#2e8c86'}` }}>
                  <p className="text-xs text-mj-400 mb-1">Difference (Actual vs Expected)</p>
                  <p className="text-xl font-black" style={{
                    color: Math.abs(tillDiff) <= 0.01 ? '#2e8c86' : tillDiff < 0 ? '#dc2626' : '#2e8c86'
                  }}>
                    {Math.abs(tillDiff) <= 0.01 ? '✓ Balanced' : (tillDiff >= 0 ? `+$${tillDiff.toFixed(2)} over` : `-$${Math.abs(tillDiff).toFixed(2)} short`)}
                  </p>
                </div>
              )}

              {hasDiff && (
                <div className="mt-3 animate-scale-in">
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1"
                         style={{ color: tillDiff < 0 ? '#dc2626' : '#2e8c86' }}>
                    Why is the till {tillDiff < 0 ? 'short' : 'over'}? *
                  </label>
                  <textarea value={diffReason} onChange={e => setDiffReason(e.target.value)}
                    className="w-full border-2 rounded-xl px-3 py-3 text-sm bg-white text-mj-800
                               focus:outline-none transition-colors resize-none"
                    style={{ borderColor: tillDiff < 0 ? '#fca5a5' : '#86efac' }}
                    rows={2} placeholder="Please explain..." required />
                </div>
              )}
            </div>

            {/* To Bank */}
            {actualTillVal > 0 && (
              <div className="glass-card p-4 text-center animate-scale-in"
                   style={{ background: 'linear-gradient(135deg, #fdf9ef, #f9f0d4)', borderColor: '#e8c86e' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#9a5b1c' }}>To Bank</p>
                <p className="text-[10px] mb-1" style={{ color: '#9a5b1c' }}>Actual Till - $300 float</p>
                <p className="text-3xl font-black" style={{ color: '#d49a2a' }}>${toBank.toFixed(2)}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <BackButton onClick={() => setStep(1)} />
            <NextButton onClick={() => {
              if (!tally || actualTillVal <= 0) { setError('Please enter the actual till count.'); return; }
              if (hasDiff && !diffReason.trim()) { setError('Please explain the till difference.'); return; }
              setStep(3);
            }} label="Next: Review" className="flex-1" />
          </div>
        </div>
      )}

      {/* STEP 4: Review & Save */}
      {step === 3 && (
        <div className="animate-fade-up">
          <StepHeader title="Review & Save" hint="Check everything, then save" />

          <div className="glass-card p-4 mb-4 space-y-2.5">
            <Row label="Cash Count (Notes + Coins)" value={`$${total.toFixed(2)}`} />
            {totalCashouts > 0 && <Row label="Cashouts" value={`-$${totalCashouts.toFixed(2)}`} color="#dc2626" />}
            <div className="border-t border-mj-100 pt-2" />
            {totalSalesVal > 0 && <Row label="Total Sales" value={`$${totalSalesVal.toFixed(2)}`} />}
            {eftposVal > 0 && <Row label="Eftpos" value={`$${eftposVal.toFixed(2)}`} />}
            {totalSalesVal > 0 && <Row label="Cash Sales" value={`$${cashSales.toFixed(2)}`} bold />}
            <div className="border-t border-mj-100 pt-2" />
            <Row label="Float" value="$300.00" />
            {totalSalesVal > 0 && <Row label="Expected in Till" value={`$${expectedTill.toFixed(2)}`} />}
            <Row label="Actual Till Count" value={`$${actualTillVal.toFixed(2)}`} bold />
            <Row label="Difference" value={
              Math.abs(tillDiff) <= 0.01 ? '✓ Balanced' : (tillDiff >= 0 ? `+$${tillDiff.toFixed(2)} over` : `-$${Math.abs(tillDiff).toFixed(2)} short`)
            } color={Math.abs(tillDiff) <= 0.01 ? '#2e8c86' : tillDiff < 0 ? '#dc2626' : '#2e8c86'} bold />
            {hasDiff && <Row label="Reason" value={diffReason} />}
            <div className="border-t border-mj-100 pt-2" />
            <Row label="To Bank" value={`$${toBank.toFixed(2)}`} bold color="#d49a2a" />
          </div>

          {/* Banking & Notes */}
          <div className="glass-card p-4 mb-4 space-y-3">
            <p className="text-[10px] font-bold text-mj-400 uppercase tracking-wider">Banking Details (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-mj-400 block mb-1">Banked By</label>
                <input type="text" value={bankedBy} onChange={e => setBankedBy(e.target.value)}
                  className="w-full border border-mj-200 rounded-xl px-3 py-2.5 text-sm bg-white text-mj-800
                             focus:outline-none focus:border-mj-500" placeholder="Name" />
              </div>
              <div>
                <label className="text-[10px] text-mj-400 block mb-1">Date Banked</label>
                <input type="date" value={dateBanked} onChange={e => setDateBanked(e.target.value)}
                  className="w-full border border-mj-200 rounded-xl px-3 py-2.5 text-sm bg-white text-mj-800
                             focus:outline-none focus:border-mj-500" />
              </div>
            </div>
          </div>

          <div className="glass-card p-4 mb-6">
            <p className="text-[10px] font-bold text-mj-400 uppercase tracking-wider mb-1">Additional Notes (optional)</p>
            <textarea value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)}
              className="w-full border border-mj-200 rounded-xl px-3 py-2.5 text-sm bg-white text-mj-800
                         focus:outline-none focus:border-mj-500 resize-none" rows={2} placeholder="Anything else to note..." />
          </div>

          <div className="flex gap-3">
            <BackButton onClick={() => setStep(2)} />
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-3.5 text-base">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : (<>Save Cash Up <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></>)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepHeader({ title, hint }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-mj-900">{title}</h2>
      <p className="text-xs text-mj-400">{hint}</p>
    </div>
  );
}

function Stepper({ value, onMinus, onPlus, onChange, rawValue, color, active }) {
  return (
    <>
      <button type="button" onClick={onMinus} disabled={value <= 0}
        className="w-10 h-10 rounded-xl bg-white border border-mj-200 flex items-center justify-center
                   text-mj-400 hover:border-mj-300 active:scale-90 transition-all disabled:opacity-20 text-lg font-bold">
        −
      </button>
      <input type="number" min="0" value={rawValue ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-14 text-center text-xl font-bold rounded-xl py-2 border-2 transition-all outline-none"
        style={{ background: '#fff', color: active ? color : '#7ec4bf', borderColor: active ? color + '40' : '#d9eeec' }}
        placeholder="0" />
      <button type="button" onClick={onPlus}
        className="w-10 h-10 rounded-xl text-white flex items-center justify-center
                   active:scale-90 transition-all shadow-md text-lg font-bold"
        style={{ background: color, boxShadow: `0 4px 12px ${color}25` }}>
        +
      </button>
    </>
  );
}

function InputCard({ label, sublabel, value, onChange, placeholder, prefix, required }) {
  return (
    <div className="glass-card p-4">
      <label className="text-[10px] font-bold text-mj-400 uppercase tracking-wider block mb-0.5">
        {label}
      </label>
      {sublabel && <p className="text-[10px] text-mj-300 mb-2">{sublabel}</p>}
      <div className="flex items-center gap-2">
        {prefix && <span className="text-mj-400 font-semibold text-sm">{prefix}</span>}
        <input type="number" step="0.01" min="0" value={value} onChange={e => onChange(e.target.value)}
          className="w-full text-xl font-black text-mj-800 bg-transparent border-0 border-b-2 border-mj-200
                     focus:border-mj-500 outline-none transition-colors py-1"
          placeholder={placeholder} required={required} />
      </div>
    </div>
  );
}

function Row({ label, value, bold, color }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-mj-500">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'}`} style={{ color: color || '#133c3b' }}>{value}</span>
    </div>
  );
}

function NextButton({ onClick, label, className = '' }) {
  return (
    <button onClick={onClick} className={`btn-primary py-3 ${className}`}>
      {label}
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
    </button>
  );
}

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="btn-secondary px-4 flex items-center gap-1">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
      Back
    </button>
  );
}
