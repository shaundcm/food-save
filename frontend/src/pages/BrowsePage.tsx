import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Search, SlidersHorizontal, Zap, MapPin, Scale } from 'lucide-react';
import { GET_LISTINGS } from '../lib/queries';
import { FoodCategory, FoodListing, CATEGORY_LABELS } from '../lib/types';
import { ListingCard } from '../components/shared/ListingCard';
import { LoadingPage, EmptyState, Spinner } from '../components/shared/UI';

// Strategy and category config — no JSX at module level
const STRATEGIES: { value: string; label: string; iconName: 'scale' | 'map' | 'zap' }[] = [
  { value: 'composite', label: 'Best Match', iconName: 'scale' },
  { value: 'proximity', label: 'Nearest',    iconName: 'map'   },
  { value: 'urgency',   label: 'Urgent',     iconName: 'zap'   },
];

function StrategyIcon({ name }: { name: string }) {
  if (name === 'map')   return <MapPin   className="w-3.5 h-3.5" />;
  if (name === 'zap')   return <Zap      className="w-3.5 h-3.5" />;
  return                       <Scale    className="w-3.5 h-3.5" />;
}

const CATEGORIES: { value: FoodCategory | ''; label: string }[] = [
  { value: '', label: 'All' },
  ...Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v as FoodCategory, label: l })),
];

const LIMIT = 12;

export default function BrowsePage() {
  const [strategy, setStrategy] = useState('composite');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [currentOffset, setCurrentOffset] = useState(0);

  const { data, loading, fetchMore } = useQuery(GET_LISTINGS, {
    variables: {
      status: 'AVAILABLE',
      strategy,
      category: category || undefined,
      limit: LIMIT,
      offset: 0,
    },
    notifyOnNetworkStatusChange: true,
  });

  const allListings: FoodListing[] = data?.listings?.listings || [];
  const total: number              = data?.listings?.total    || 0;
  const hasMore: boolean           = data?.listings?.hasMore  || false;

  const filtered = search
    ? allListings.filter(l =>
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.donor.organization?.toLowerCase().includes(search.toLowerCase())
      )
    : allListings;

  const handleLoadMore = () => {
    const newOffset = currentOffset + LIMIT;
    setCurrentOffset(newOffset);
    fetchMore({ variables: { offset: newOffset } });
  };

  // Reset offset when filters change
  const handleStrategyChange = (s: string) => { setStrategy(s); setCurrentOffset(0); };
  const handleCategoryChange = (c: string) => { setCategory(c); setCurrentOffset(0); };

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 animate-fade-up">
        <h1 className="page-title">Browse Food</h1>
        <p className="muted-text mt-1">{total} listings available</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 space-y-4 animate-fade-up animate-delay-100">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search listings or donors…"
            className="input-field pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Strategy selector */}
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-white/30 mr-1" />
            {STRATEGIES.map(s => (
              <button
                key={s.value}
                onClick={() => handleStrategyChange(s.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-medium transition-all ${
                  strategy === s.value
                    ? 'bg-brand-500 text-white'
                    : 'bg-surface-muted text-white/50 hover:text-white border border-surface-border'
                }`}
              >
                <StrategyIcon name={s.iconName} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Category selector */}
          <div className="flex items-center gap-1 flex-wrap">
            {CATEGORIES.slice(0, 5).map(c => (
              <button
                key={c.value}
                onClick={() => handleCategoryChange(c.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium transition-all ${
                  category === c.value
                    ? 'bg-earth-500 text-white'
                    : 'bg-surface-muted text-white/50 hover:text-white border border-surface-border'
                }`}
              >
                {c.label}
              </button>
            ))}
            <select
              value={category}
              onChange={e => handleCategoryChange(e.target.value)}
              className="bg-surface-muted border border-surface-border text-white/50 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading && allListings.length === 0 ? (
        <LoadingPage />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No listings found"
          description="Try a different filter or check back later."
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((listing, i) => (
              <div
                key={listing.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
              >
                <ListingCard listing={listing} showClaimButton />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="btn-secondary flex items-center gap-2"
              >
                {loading ? <><Spinner size="sm" /> Loading…</> : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
