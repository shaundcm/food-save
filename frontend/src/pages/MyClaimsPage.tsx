import { useQuery, useMutation } from '@apollo/client';
import { MY_CLAIMS, UPDATE_CLAIM_STATUS } from '../lib/queries';
import { Claim } from '../lib/types';
import { LoadingPage, EmptyState, StatusBadge, Alert } from '../components/shared/UI';
import { CATEGORY_EMOJI } from '../lib/types';
import { formatDistanceToNow, format } from 'date-fns';
import { CheckCircle2, XCircle, Calendar, Clock } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function MyClaimsPage() {
  const { data, loading } = useQuery(MY_CLAIMS);
  const [error, setError] = useState('');

  const [updateStatus] = useMutation(UPDATE_CLAIM_STATUS, {
    refetchQueries: [{ query: MY_CLAIMS }],
    onError: e => setError(e.message),
  });

  const claims: Claim[] = data?.myClaims || [];

  if (loading) return <LoadingPage />;

  const active = claims.filter(c => ['PENDING', 'CONFIRMED'].includes(c.status));
  const past   = claims.filter(c => ['PICKED_UP', 'CANCELLED'].includes(c.status));

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6 animate-fade-up">
        <h1 className="page-title">My Claims</h1>
        <p className="muted-text mt-1">{claims.length} total · {active.length} active</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-4" />}

      {claims.length === 0 ? (
        <EmptyState icon="🤝" title="No claims yet"
          description="Browse available food listings and claim what you need."
          action={<Link to="/browse" className="btn-primary text-sm">Browse Food</Link>} />
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section className="animate-fade-up">
              <h2 className="section-title mb-3">Active Claims</h2>
              <div className="space-y-3">
                {active.map(c => (
                  <ClaimRow
                    key={c.id}
                    claim={c}
                    onUpdateStatus={(id, status) => updateStatus({ variables: { id, status } })}
                  />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section className="animate-fade-up animate-delay-200">
              <h2 className="section-title mb-3 text-white/50">Past Claims</h2>
              <div className="space-y-3 opacity-60">
                {past.map(c => <ClaimRow key={c.id} claim={c} past />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ClaimRow({ claim: c, past, onUpdateStatus }: {
  claim: Claim;
  past?: boolean;
  onUpdateStatus?: (id: string, status: string) => void;
}) {
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <span className="text-2xl">{CATEGORY_EMOJI[c.listing.category]}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-display font-semibold text-white text-sm">{c.listing.title}</p>
          <StatusBadge status={c.status} />
        </div>
        <p className="muted-text text-xs mt-0.5">
          {c.quantity} {c.listing.unit} · From {c.listing.donor.organization || c.listing.donor.name}
        </p>
        <div className="flex flex-wrap gap-3 mt-1">
          <span className="muted-text text-xs">
            Claimed {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
          </span>
          {c.scheduledAt && (
            <span className="flex items-center gap-1 text-xs text-earth-400">
              <Calendar className="w-3 h-3" />
              Pickup: {format(new Date(c.scheduledAt), 'MMM d, h:mm a')}
            </span>
          )}
        </div>
        {/* Status guidance messages */}
        {c.status === 'PENDING' && (
          <p className="flex items-center gap-1 text-xs text-earth-400 mt-1">
            <Clock className="w-3 h-3" />
            Waiting for donor to confirm your claim
          </p>
        )}
        {c.status === 'CONFIRMED' && (
          <p className="flex items-center gap-1 text-xs text-brand-400 mt-1">
            <CheckCircle2 className="w-3 h-3" />
            Confirmed! Please pick up and mark as collected below
          </p>
        )}
      </div>

      {!past && onUpdateStatus && (
        <div className="flex flex-col gap-2">
          {c.status === 'CONFIRMED' && (
            <button
              onClick={() => onUpdateStatus(c.id, 'PICKED_UP')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/20 text-brand-400 text-xs font-display hover:bg-brand-500/30 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark Picked Up
            </button>
          )}
          {['PENDING', 'CONFIRMED'].includes(c.status) && (
            <button
              onClick={() => onUpdateStatus(c.id, 'CANCELLED')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-display hover:bg-red-500/20 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
