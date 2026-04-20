import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Search } from 'lucide-react';
import { GET_LISTINGS, UPDATE_LISTING } from '../lib/queries';
import { FoodListing, ListingStatus } from '../lib/types';
import { LoadingPage, EmptyState, StatusBadge, Alert } from '../components/shared/UI';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '../lib/types';
import { formatDistanceToNow } from 'date-fns';

const STATUSES: ListingStatus[] = ['AVAILABLE', 'CLAIMED', 'COMPLETED', 'EXPIRED', 'CANCELLED'];

export default function AdminListingsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ListingStatus | ''>('');
  const [error, setError] = useState('');

  const { data, loading } = useQuery(GET_LISTINGS, {
    variables: { limit: 100, status: statusFilter || undefined },
  });

  const [updateListing] = useMutation(UPDATE_LISTING, {
    onError: e => setError(e.message),
    refetchQueries: ['GetListings'],
  });

  const listings: FoodListing[] = data?.listings?.listings || [];

  const filtered = search
    ? listings.filter(l =>
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.donor.name.toLowerCase().includes(search.toLowerCase()) ||
        l.donor.organization?.toLowerCase().includes(search.toLowerCase())
      )
    : listings;

  if (loading) return <LoadingPage />;

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 animate-fade-up">
        <h1 className="page-title">All Listings</h1>
        <p className="muted-text mt-1">{data?.listings?.total || 0} total listings</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-4" />}

      {/* Filters */}
      <div className="glass-card p-4 mb-5 flex flex-wrap gap-3 animate-fade-up animate-delay-100">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search listings…"
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-display transition-all ${
              statusFilter === '' ? 'bg-brand-500 text-white' : 'bg-surface-muted text-white/50 border border-surface-border hover:text-white'
            }`}
          >
            All
          </button>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display transition-all ${
                statusFilter === s ? 'bg-brand-500 text-white' : 'bg-surface-muted text-white/50 border border-surface-border hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📦" title="No listings found" />
      ) : (
        <div className="space-y-2 animate-fade-up animate-delay-200">
          {filtered.map(l => (
            <div key={l.id} className="glass-card p-4 flex items-center gap-4 hover:border-brand-500/20 transition-colors">
              <span className="text-xl">{CATEGORY_EMOJI[l.category]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-semibold text-white text-sm">{l.title}</p>
                  <StatusBadge status={l.status} />
                </div>
                <p className="muted-text text-xs mt-0.5">
                  {l.quantity} {l.unit} · {CATEGORY_LABELS[l.category]} · by{' '}
                  <span className="text-white/60">{l.donor.organization || l.donor.name}</span>
                </p>
                <p className="muted-text text-xs">
                  {formatDistanceToNow(new Date(l.createdAt), { addSuffix: true })}
                </p>
              </div>
              {/* Quick status change */}
              {l.status === 'AVAILABLE' && (
                <button
                  onClick={() => updateListing({ variables: { id: l.id, status: 'CANCELLED' } })}
                  className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-display"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
