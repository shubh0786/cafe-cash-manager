import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import CashUpForm from './pages/CashUpForm';
import History from './pages/History';

export default function App() {
  const { name, saveName, isLoggedIn } = useAuth();
  const [inputName, setInputName] = useState('');
  const [page, setPage] = useState('form');

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-mj-50">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="text-center mb-10">
            <div className="inline-block p-5 rounded-3xl bg-white shadow-lg shadow-mj-200/50 mb-6 border border-mj-100">
              <img src="/logo.png" alt="Majestic Coast Plaza" className="h-24 w-auto" />
            </div>
            <p className="text-mj-400 text-xs tracking-[0.3em] uppercase">Daily Cash Up</p>
          </div>

          <form
            onSubmit={e => { e.preventDefault(); if (inputName.trim()) saveName(inputName.trim()); }}
            className="space-y-5"
          >
            <input
              type="text"
              value={inputName}
              onChange={e => setInputName(e.target.value)}
              className="w-full text-center text-xl font-medium bg-white border-2 border-mj-200
                         rounded-2xl px-6 py-4 text-mj-900 shadow-sm
                         focus:outline-none focus:border-mj-500 focus:shadow-lg focus:shadow-mj-200/50
                         transition-all duration-300 placeholder:text-mj-300"
              placeholder="Enter your name"
              autoFocus
              required
            />
            <button type="submit" disabled={!inputName.trim()} className="btn-primary w-full">
              Let's Go
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mj-50">
      {page === 'form' && <CashUpForm onViewHistory={() => setPage('history')} />}
      {page === 'history' && <History onBack={() => setPage('form')} />}
    </div>
  );
}
