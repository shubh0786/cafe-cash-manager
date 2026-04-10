const STORAGE_KEY = 'majestic_cashups';

function getData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"registers":[],"cashouts":[]}');
  } catch { return { registers: [], cashouts: [] }; }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function uuid() {
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function getStaffName() {
  return localStorage.getItem('staffName') || 'Staff';
}

export const api = {
  getTodayRegister: async () => {
    const data = getData();
    const reg = data.registers.find(r => r.date === today());
    if (!reg) return null;
    const cashouts = data.cashouts.filter(c => c.register_id === reg.id);
    const total_cashouts = cashouts.reduce((s, c) => s + c.amount, 0);
    return { ...reg, cashouts, total_cashouts };
  },

  openRegister: async ({ opening_balance, denominations }) => {
    const data = getData();
    const existing = data.registers.find(r => r.date === today() && r.status === 'open');
    if (existing) throw new Error('Register already open for today');
    const reg = {
      id: uuid(), date: today(), opening_balance, opening_denominations: denominations,
      closing_balance: null, closing_denominations: null, expected_balance: null,
      shortage_amount: null, shortage_reason: null, status: 'open',
      opened_by: getStaffName(), closed_by: null,
      opened_at: new Date().toISOString(), closed_at: null, notes: null,
    };
    data.registers.push(reg);
    saveData(data);
    return reg;
  },

  closeRegister: async ({ closing_balance, denominations, shortage_reason, notes }) => {
    const data = getData();
    const idx = data.registers.findIndex(r => r.date === today() && r.status === 'open');
    if (idx === -1) throw new Error('No open register for today');
    const reg = data.registers[idx];
    const cashouts = data.cashouts.filter(c => c.register_id === reg.id);
    const totalCashouts = cashouts.reduce((s, c) => s + c.amount, 0);
    const expectedBalance = reg.opening_balance - totalCashouts;
    const shortageAmount = expectedBalance - closing_balance;

    data.registers[idx] = {
      ...reg, closing_balance, closing_denominations: denominations,
      expected_balance: expectedBalance,
      shortage_amount: Math.abs(shortageAmount) > 0.01 ? shortageAmount : 0,
      shortage_reason: shortage_reason || null,
      status: 'closed', closed_by: getStaffName(),
      closed_at: new Date().toISOString(), notes: notes || null,
    };
    saveData(data);
    return data.registers[idx];
  },

  updateRegister: async (id, updates) => {
    const data = getData();
    const idx = data.registers.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Register not found');
    data.registers[idx] = { ...data.registers[idx], ...updates };
    saveData(data);
    return data.registers[idx];
  },

  getRegisterHistory: async ({ limit = 30 } = {}) => {
    const data = getData();
    return data.registers
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  },

  getCashouts: async (params = {}) => {
    const data = getData();
    let results = data.cashouts;
    if (params.category) results = results.filter(c => c.category === params.category);
    return results.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, params.limit || 50);
  },

  addCashout: async ({ amount, reason, category = 'other', given_to }) => {
    if (!amount || !reason) throw new Error('Amount and reason are required');
    if (amount <= 0) throw new Error('Amount must be positive');
    const data = getData();
    let reg = data.registers.find(r => r.date === today() && r.status === 'open');
    if (!reg) {
      reg = {
        id: uuid(), date: today(), opening_balance: 0, opening_denominations: null,
        closing_balance: null, closing_denominations: null, expected_balance: null,
        shortage_amount: null, shortage_reason: null, status: 'open',
        opened_by: getStaffName(), closed_by: null,
        opened_at: new Date().toISOString(), closed_at: null, notes: null,
      };
      data.registers.push(reg);
    }
    const cashout = {
      id: uuid(), register_id: reg.id, amount, reason, category,
      given_to: given_to || null, performed_by: getStaffName(),
      created_at: new Date().toISOString(),
    };
    data.cashouts.push(cashout);
    saveData(data);
    return cashout;
  },

  updateCashout: async (id, updates) => {
    const data = getData();
    const idx = data.cashouts.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Cashout not found');
    data.cashouts[idx] = { ...data.cashouts[idx], ...updates };
    saveData(data);
    return data.cashouts[idx];
  },

  deleteCashout: async (id) => {
    const data = getData();
    data.cashouts = data.cashouts.filter(c => c.id !== id);
    saveData(data);
    return { message: 'Deleted' };
  },

  getSummaryReport: async (params) => {
    const data = getData();
    const from = params.from || '2020-01-01';
    const to = params.to || today();
    const registers = data.registers
      .filter(r => r.date >= from && r.date <= to)
      .sort((a, b) => b.date.localeCompare(a.date));
    const cashouts = data.cashouts;

    return {
      period: { from, to },
      total_days: registers.length,
      total_opening: registers.reduce((s, r) => s + r.opening_balance, 0),
      total_cashouts: registers.reduce((s, r) => {
        return s + cashouts.filter(c => c.register_id === r.id).reduce((cs, c) => cs + c.amount, 0);
      }, 0),
      total_shortages: registers.filter(r => r.shortage_amount > 0).reduce((s, r) => s + r.shortage_amount, 0),
      shortage_days: registers.filter(r => r.shortage_amount > 0).length,
      days: registers.map(r => ({
        date: r.date, opening: r.opening_balance, closing: r.closing_balance,
        cashouts: cashouts.filter(c => c.register_id === r.id).reduce((s, c) => s + c.amount, 0),
        shortage: r.shortage_amount || 0, status: r.status,
      })),
    };
  },

  exportCSV: async (from, to) => {
    const data = getData();
    const registers = data.registers
      .filter(r => r.date >= from && r.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date));
    const cashouts = data.cashouts;

    const headers = ['Date','Status','Opening Balance','Total Cashouts','Expected Balance','Closing Balance','Shortage','Shortage Reason','Opened By','Closed By','Notes'];
    const rows = [headers.join(',')];
    registers.forEach(r => {
      const tc = cashouts.filter(c => c.register_id === r.id).reduce((s, c) => s + c.amount, 0);
      rows.push([
        r.date, r.status, r.opening_balance, tc, r.expected_balance || '',
        r.closing_balance || '', r.shortage_amount || 0,
        `"${(r.shortage_reason || '').replace(/"/g, '""')}"`,
        r.opened_by || '', r.closed_by || '', `"${(r.notes || '').replace(/"/g, '""')}"`,
      ].join(','));
    });
    return rows.join('\n');
  },
};
