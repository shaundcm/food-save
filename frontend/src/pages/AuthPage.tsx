import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { LOGIN, REGISTER } from '../lib/queries';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../lib/types';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '', password: '', name: '', role: 'RECIPIENT' as UserRole,
    phone: '', address: '', organization: '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const [doLogin, { loading: loginLoading }] = useMutation(LOGIN, {
    onCompleted: ({ login: payload }) => { login(payload.token, payload.user); navigate('/dashboard'); },
    onError: (e) => setError(e.message),
  });

  const [doRegister, { loading: regLoading }] = useMutation(REGISTER, {
    onCompleted: ({ register: payload }) => { login(payload.token, payload.user); navigate('/dashboard'); },
    onError: (e) => setError(e.message),
  });

  const loading = loginLoading || regLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'login') {
      doLogin({ variables: { email: form.email, password: form.password } });
    } else {
      doRegister({
        variables: {
          email: form.email, password: form.password, name: form.name, role: form.role,
          phone: form.phone || undefined, address: form.address || undefined,
          organization: form.organization || undefined,
        },
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 p-10 border-r border-surface-border bg-surface-soft relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-brand-500/5 blur-3xl" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-brand-400" />
          </div>
          <span className="font-display font-bold text-white text-xl">FoodSave</span>
        </div>
        <div>
          <h1 className="font-display text-4xl font-bold text-white leading-tight mb-4">
            Reduce waste.<br /><span className="text-gradient">Feed communities.</span>
          </h1>
          <p className="text-white/50 font-body leading-relaxed">
            Connect surplus food from restaurants and households to NGOs and shelters.
          </p>
          <div className="mt-8 space-y-4">
            {[
              { emoji: '🍱', label: 'Donors list surplus food in seconds' },
              { emoji: '🤝', label: 'Smart matching finds nearby recipients' },
              { emoji: '♻️', label: 'Track your real-world impact' },
            ].map(({ emoji, label }) => (
              <div key={label} className="flex items-center gap-3 text-white/60 text-sm">
                <span className="text-lg">{emoji}</span><span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="muted-text text-xs">© 2025 FoodSave Platform</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Leaf className="w-6 h-6 text-brand-400" />
            <span className="font-display font-bold text-white text-xl">FoodSave</span>
          </div>

          <div className="flex gap-1 p-1 bg-surface-muted rounded-xl border border-surface-border mb-6">
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-lg font-display font-medium text-sm transition-all ${
                  mode === m ? 'bg-brand-500 text-white' : 'text-white/40 hover:text-white/70'}`}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <h2 className="font-display text-2xl font-bold text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Join FoodSave'}
          </h2>
          <p className="muted-text mb-6">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account to get started'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="label">Full Name</label>
                  <input type="text" required value={form.name} onChange={set('name')}
                    placeholder="Your full name" className="input-field" />
                </div>
                <div>
                  <label className="label">I am a</label>
                  <select value={form.role} onChange={set('role')} className="input-field">
                    <option value="RECIPIENT">Recipient (NGO / Shelter)</option>
                    <option value="DONOR">Donor (Restaurant / Individual)</option>
                  </select>
                </div>
                {form.role === 'DONOR' && (
                  <div>
                    <label className="label">Organization Name *</label>
                    <input type="text" required value={form.organization} onChange={set('organization')}
                      placeholder="Restaurant or organization name" className="input-field" />
                  </div>
                )}
                <div>
                  <label className="label">Address *</label>
                  <input type="text" required value={form.address} onChange={set('address')}
                    placeholder="Your address" className="input-field" />
                </div>
                <div>
                  <label className="label">Phone (optional)</label>
                  <input type="tel" value={form.phone} onChange={set('phone')}
                    placeholder="+91 00000 00000" className="input-field" />
                </div>
              </>
            )}
            <div>
              <label className="label">Email</label>
              <input type="email" required value={form.email} onChange={set('email')}
                placeholder="you@example.com" className="input-field" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={form.password}
                  onChange={set('password')} placeholder="Min. 8 characters" className="input-field pr-10" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-surface-muted rounded-xl border border-surface-border">
            <p className="muted-text text-xs font-mono mb-2">Demo accounts (password: password123)</p>
            <div className="space-y-1">
              {[
                ['admin@foodsave.com', 'Admin'],
                ['restaurant@example.com', 'Donor'],
                ['ngo@example.com', 'Recipient'],
              ].map(([email, role]) => (
                <button key={email}
                  onClick={() => { setForm(f => ({ ...f, email, password: 'password123' })); setMode('login'); }}
                  className="flex items-center gap-2 w-full text-left hover:bg-surface-border rounded-lg px-2 py-1 transition-colors">
                  <span className="text-xs font-mono text-white/30 w-16">{role}</span>
                  <span className="text-xs text-white/60">{email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
