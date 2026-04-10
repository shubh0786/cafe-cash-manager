import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [name, setName] = useState(() => localStorage.getItem('staffName') || '');

  function saveName(newName) {
    localStorage.setItem('staffName', newName);
    setName(newName);
  }

  function clearName() {
    localStorage.removeItem('staffName');
    setName('');
  }

  return (
    <AuthContext.Provider value={{ name, saveName, clearName, isLoggedIn: !!name }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
