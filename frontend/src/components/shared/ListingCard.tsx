import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { MapPin, Clock, Package, Zap } from 'lucide-react';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { FoodListing } from '../../lib/types';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '../../lib/types';
import { StatusBadge, Modal, Spinner, Alert } from './UI';
import { CREATE_CLAIM, GET_LISTINGS, MY_CLAIMS } from '../../lib/queries';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

export function ListingCard({ listing, showClaimButton = false }: {
  listing: FoodListing;
  showClaimButton?: boolean;
}) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const isExpired = isPast(new Date(listing.expiresAt));
  const expiresInHours = (new Date(listing.expiresAt).getTime() - Date.now()) / 3600000;
  const isUrgent = expiresInHours > 0 && expiresInHours < 3;

  return (
    <>
      <div
        className={clsx(
          'glass-card overflow-hidden cursor-pointer group',
          'hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300',
          isExpired && 'opacity-50'
        )}
        onClick={() => setShowModal(true)}
      >
        {/* Category colour strip */}
        <div className="h-1 w-full bg-gradient-to-r from-brand-600 to-brand-400 opacity-60 group-hover:opacity-100 transition-opacity" />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl flex-shrink-0">{CATEGORY_EMOJI[listing.category]}</span>
              <div className="min-w-0">
                <h3 className="font-display font-semibold text-white text-sm leading-tight truncate">
                  {listing.title}
                </h3>
                <p className="muted-text text-xs mt-0.5">{listing.donor.organization || listing.donor.name}</p>
              </div>
            </div>
            <StatusBadge status={listing.status} />
          </div>

          {/* Meta */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-white/50 text-xs">
              <Package className="w-3 h-3" />
              <span className="font-mono">{listing.quantity} {listing.unit}</span>
              <span className="text-white/20">·</span>
              <span>{CATEGORY_LABELS[listing.category]}</span>
            </div>

            <div className="flex items-center gap-1.5 text-white/50 text-xs">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{listing.address}</span>
              {listing.distanceKm !== undefined && listing.distanceKm !== null && (
                <span className="text-brand-400 font-mono ml-auto flex-shrink-0">
                  {listing.distanceKm.toFixed(1)}km
                </span>
              )}
            </div>

            <div className={clsx('flex items-center gap-1.5 text-xs', isUrgent ? 'text-earth-400' : 'text-white/50')}>
              {isUrgent && <Zap className="w-3 h-3" />}
              {!isUrgent && <Clock className="w-3 h-3" />}
              <span>
                {isExpired
                  ? 'Expired'
                  : `Expires ${formatDistanceToNow(new Date(listing.expiresAt), { addSuffix: true })}`}
              </span>
            </div>
          </div>

          {/* Claim button */}
          {showClaimButton && listing.status === 'AVAILABLE' && user?.role === 'RECIPIENT' && !isExpired && (
            <button
              className="btn-primary w-full mt-3 text-sm py-2"
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            >
              Claim Food
            </button>
          )}
        </div>
      </div>

      <ListingDetailModal
        listing={listing}
        open={showModal}
        onClose={() => setShowModal(false)}
        showClaim={showClaimButton && listing.status === 'AVAILABLE' && user?.role === 'RECIPIENT' && !isExpired}
      />
    </>
  );
}

// ─── Detail Modal with Claim Form ────────────────────────────────────────────

function ListingDetailModal({ listing, open, onClose, showClaim }: {
  listing: FoodListing; open: boolean; onClose: () => void; showClaim?: boolean;
}) {
  const [quantity, setQuantity] = useState(listing.quantity);
  const [notes, setNotes] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [createClaim, { loading }] = useMutation(CREATE_CLAIM, {
    refetchQueries: [{ query: GET_LISTINGS, variables: { status: 'AVAILABLE' } }, { query: MY_CLAIMS }],
    onCompleted: () => { setSuccess(true); setTimeout(onClose, 1500); },
    onError: (e) => setError(e.message),
  });

  const handleClaim = () => {
    setError('');
    createClaim({
      variables: {
        listingId: listing.id,
        quantity,
        notes: notes || undefined,
        scheduledAt: scheduledAt || undefined,
      },
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={listing.title}>
      <div className="space-y-4">
        {/* Listing info */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Category',  value: `${CATEGORY_EMOJI[listing.category]} ${CATEGORY_LABELS[listing.category]}` },
            { label: 'Quantity',  value: `${listing.quantity} ${listing.unit}` },
            { label: 'Donor',     value: listing.donor.organization || listing.donor.name },
            { label: 'Expires',   value: format(new Date(listing.expiresAt), 'MMM d, h:mm a') },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-muted rounded-xl p-3">
              <p className="muted-text text-xs mb-0.5">{label}</p>
              <p className="text-white text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-white/60 text-sm">
          <MapPin className="w-4 h-4" />
          <span>{listing.address}</span>
        </div>

        {listing.description && (
          <p className="text-white/60 text-sm bg-surface-muted rounded-xl p-3">{listing.description}</p>
        )}

        {/* Claim form */}
        {showClaim && !success && (
          <div className="border-t border-surface-border pt-4 space-y-3">
            <h3 className="font-display font-semibold text-white text-sm">Claim This Food</h3>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div>
              <label className="label">Quantity to claim</label>
              <input
                type="number"
                min={1}
                max={listing.quantity}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Scheduled pickup (optional)</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requirements…"
                className="input-field resize-none"
              />
            </div>
            <button onClick={handleClaim} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><Spinner size="sm" /> Claiming…</> : 'Confirm Claim'}
            </button>
          </div>
        )}

        {success && <Alert type="success" message="Claimed successfully! The donor has been notified." />}
      </div>
    </Modal>
  );
}
