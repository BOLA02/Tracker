'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function LoginForm() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      alert('Login successful');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin} className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-bold text-center">Login</h2>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        className="w-full p-2 border rounded"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        className="w-full p-2 border rounded"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}
