import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Login() {
  const [name, setName] = useState('');
  const { saveName } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (name.trim()) {
      saveName(name.trim());
      navigate('/');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cafe-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 text-cafe-800">
          <Logo size="lg" className="mb-4" />
          <p className="text-cafe-500 mt-2 text-sm">Daily Cash Management</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">What's your name?</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field text-center text-lg"
              placeholder="Enter your name"
              required
              autoFocus
              autoComplete="name"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="btn-primary w-full text-base py-3"
          >
            Let's Go
          </button>
        </form>
      </div>
    </div>
  );
}
