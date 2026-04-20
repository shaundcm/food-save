import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { MapPin, Clock, Info } from 'lucide-react';
import { CREATE_LISTING, MY_LISTINGS } from '../lib/queries';
import { FoodCategory, CATEGORY_LABELS, CATEGORY_EMOJI } from '../lib/types';
import { Alert, Spinner } from '../components/shared/UI';
import { addHours, format } from 'date-fns';

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [FoodCategory, string][];

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'COOKED_MEAL' as FoodCategory,
    quantity: 10,
    unit: 'portions',
    expiresAt: format(addHours(new Date(), 6), "yyyy-MM-dd'T'HH:mm"),
    address: '',
    latitude: 13.0827,
    longitude: 80.2707,
  });

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const [createListing, { loading }] = useMutation(CREATE_LISTING, {
    refetchQueries: [{ query: MY_LISTINGS }],
    onCompleted: () => navigate('/my-listings'),
    onError: e => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createListing({
      variables: {
        ...form,
        quantity: Number(form.quantity),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        expiresAt: new Date(form.expiresAt).toISOString(),
      },
    });
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6 animate-fade-up">
        <h1 className="page-title">Donate Surplus Food</h1>
        <p className="muted-text mt-1">List your surplus food so NGOs and shelters can claim it.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 animate-fade-up animate-delay-100">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Title */}
        <div>
          <label className="label">Listing Title *</label>
          <input
            type="text" required value={form.title} onChange={set('title')}
            placeholder="e.g. Fresh Biryani — 50 Portions"
            className="input-field"
          />
        </div>

        {/* Category */}
        <div>
          <label className="label">Food Category *</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {CATEGORIES.map(([value, label]) => (
              <button
                type="button" key={value}
                onClick={() => setForm(f => ({ ...f, category: value }))}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
                  form.category === value
                    ? 'border-brand-500 bg-brand-500/10 text-white'
                    : 'border-surface-border bg-surface-muted text-white/50 hover:border-surface-border hover:text-white/80'
                }`}
              >
                <span className="text-xl">{CATEGORY_EMOJI[value]}</span>
                <span className="text-xs font-display leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quantity + Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Quantity *</label>
            <input
              type="number" required min={1} value={form.quantity} onChange={set('quantity')}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Unit</label>
            <select value={form.unit} onChange={set('unit')} className="input-field">
              {['portions', 'kg', 'litres', 'packets', 'boxes', 'loaves', 'items'].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="label">Description (optional)</label>
          <textarea
            rows={3} value={form.description} onChange={set('description')}
            placeholder="Describe the food, preparation time, allergens…"
            className="input-field resize-none"
          />
        </div>

        {/* Expiry */}
        <div>
          <label className="label flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Expiry Date & Time *
          </label>
          <input
            type="datetime-local" required value={form.expiresAt} onChange={set('expiresAt')}
            min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            className="input-field"
          />
          <div className="flex gap-2 mt-2">
            {[2, 4, 6, 12, 24].map(h => (
              <button
                type="button" key={h}
                onClick={() => setForm(f => ({ ...f, expiresAt: format(addHours(new Date(), h), "yyyy-MM-dd'T'HH:mm") }))}
                className="text-xs px-2.5 py-1 rounded-lg bg-surface-muted border border-surface-border text-white/50 hover:text-white transition-colors"
              >
                +{h}h
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="label flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Pickup Address *
          </label>
          <input
            type="text" required value={form.address} onChange={set('address')}
            placeholder="Full pickup address"
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Latitude</label>
            <input type="number" step="any" value={form.latitude} onChange={set('latitude')} className="input-field" />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input type="number" step="any" value={form.longitude} onChange={set('longitude')} className="input-field" />
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-300">
            Once posted, all registered recipients will be notified automatically. You can cancel or update listings at any time.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <><Spinner size="sm" /> Posting…</> : '🍱 Post Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
