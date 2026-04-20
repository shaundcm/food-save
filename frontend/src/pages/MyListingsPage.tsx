import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import { Trash2, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { MY_LISTINGS, DELETE_LISTING, UPDATE_CLAIM_STATUS } from '../lib/queries';
import { FoodListing, Claim } from '../lib/types';
import { LoadingPage, EmptyState, StatusBadge, Modal, Alert } from '../components/shared/UI';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '../lib/types';
import { formatDistanceToNow } from 'date-fns';

export default function MyListingsPage() {
  const { data, loading } = useQuery(MY_LISTINGS);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [deleteListing, { loading: deleting }] = useMutation(DELETE_LISTING, {
    refetchQueries: [{ query: MY_LISTINGS }],
    onCompleted: () => setConfirmDelete(null),
    onError: e => setError(e.message),
  });

  const [updateClaim] = useMutation(UPDATE_CLAIM_STATUS, {
    refetchQueries: [{ query: MY_LISTINGS }],
    onError: e => setError(e.message),
  });

  const listings: FoodListing[] = data?.myListings || [];

  if (loading) return <LoadingPage />;

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="page-title">My Listings</h1>
          <p className="muted-text mt-1">{listings.length} total donations</p>
        </div>
        <Link to="/listings/new" className="btn-primary text-sm">+ Donate Food</Link>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-4" />}

      {listings.length === 0 ? (
        <EmptyState icon="🍱" title="No listings yet"
          description="Post your first food donation."
          action={<Link to="/listings/new" className="btn-primary text-sm">Donate Food</Link>} />
      ) : (
        <div className="space-y-3 animate-fade-up animate-delay-100">
          {listings.map(l => {
            const pendingClaims = (l.claims || []).filter((c: Claim) => c.status === 'PENDING');
            const confirmedClaims = (l.claims || []).filter((c: Claim) => c.status === 'CONFIRMED');
            const isExpanded = expanded === l.id;

            return (
              <div key={l.id} className="glass-card overflow-hidden">
                {/* Main row */}
                <div className="p-4 flex items-center gap-4">
                  <span className="text-2xl">{CATEGORY_EMOJI[l.category]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-semibold text-white text-sm">{l.title}</p>
                      <StatusBadge status={l.status} />
                      {pendingClaims.length > 0 && (
                        <span className="badge bg-earth-500/20 text-earth-400">
                          {pendingClaims.length} pending claim{pendingClaims.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="muted-text text-xs mt-0.5">
                      {l.quantity} {l.unit} · {CATEGORY_LABELS[l.category]} ·{' '}
                      {formatDistanceToNow(new Date(l.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(l.claims || []).length > 0 && (
                      <button
                        onClick={() => setExpanded(isExpanded ? null : l.id)}
                        className="p-2 text-white/40 hover:text-white hover:bg-surface-muted rounded-lg transition-colors text-xs flex items-center gap-1"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {(l.claims || []).length} claim{(l.claims || []).length !== 1 ? 's' : ''}
                      </button>
                    )}
                    {l.status === 'AVAILABLE' && (
                      <button
                        onClick={() => setConfirmDelete(l.id)}
                        className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Claims panel */}
                {isExpanded && (l.claims || []).length > 0 && (
                  <div className="border-t border-surface-border bg-surface-soft">
                    {(l.claims as Claim[]).map(claim => (
                      <div key={claim.id} className="p-3 flex items-center gap-3 border-b border-surface-border last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">
                            {claim.recipient.organization || claim.recipient.name}
                          </p>
                          <p className="muted-text text-xs">
                            {claim.quantity} {l.unit} ·{' '}
                            {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
                            {claim.notes && ` · "${claim.notes}"`}
                          </p>
                        </div>
                        <StatusBadge status={claim.status} />
                        {claim.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateClaim({ variables: { id: claim.id, status: 'CONFIRMED' } })}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-500/20 text-brand-400 text-xs hover:bg-brand-500/30 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
                            </button>
                            <button
                              onClick={() => updateClaim({ variables: { id: claim.id, status: 'CANCELLED' } })}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Remove Listing">
        <div className="space-y-4">
          <p className="text-white/60 text-sm">Are you sure? This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => confirmDelete && deleteListing({ variables: { id: confirmDelete } })}
              disabled={deleting}
              className="flex-1 bg-red-500 hover:bg-red-400 text-white font-display font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
