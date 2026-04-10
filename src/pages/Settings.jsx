import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function Settings() {
  const { name, saveName, clearName } = useAuth();
  const [newName, setNewName] = useState(name);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  function handleSaveName(e) {
    e.preventDefault();
    if (newName.trim()) {
      saveName(newName.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  function handleSwitchUser() {
    clearName();
    navigate('/welcome');
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-cafe-900 font-serif">Settings</h2>

      {saved && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm border border-green-200">
          Name updated!
        </div>
      )}

      {/* Your Name */}
      <form onSubmit={handleSaveName} className="card space-y-3">
        <h3 className="font-semibold text-cafe-800">Your Name</h3>
        <div>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="input-field"
            placeholder="Enter your name"
            required
          />
        </div>
        <button type="submit" disabled={!newName.trim() || newName.trim() === name} className="btn-primary w-full">
          Save Name
        </button>
      </form>

      {/* Switch User */}
      <div className="card">
        <h3 className="font-semibold text-cafe-800 mb-3">Switch User</h3>
        <p className="text-sm text-cafe-500 mb-3">
          Go back to the welcome screen to enter a different name.
        </p>
        <button onClick={handleSwitchUser} className="btn-secondary w-full">
          Switch User
        </button>
      </div>

      {/* App Info */}
      <div className="card">
        <h3 className="font-semibold text-cafe-800 mb-3">About</h3>
        <div className="flex justify-center mb-3 text-cafe-400">
          <Logo size="md" />
        </div>
        <div className="space-y-2 text-sm text-cafe-500 text-center">
          <p className="font-serif font-semibold text-cafe-700">Majestic Coast Plaza</p>
          <p>Daily Cash Management System v1.0</p>
          <p>Currency: NZD ($) | Float: $300.00</p>
        </div>
      </div>
    </div>
  );
}
