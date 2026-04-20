import { useQuery } from '@apollo/client';
import { TrendingUp, Leaf, Users, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { ADMIN_STATS, MY_LISTINGS, MY_CLAIMS, GET_LISTINGS } from '../lib/queries';
import { StatCard, SectionHeader, LoadingPage, EmptyState, StatusBadge } from '../components/shared/UI';
import { ListingCard } from '../components/shared/ListingCard';
import { FoodListing, Claim, AdminStats } from '../lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return <LoadingPage />;

  const h = new Date().getHours();
  const greeting = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 animate-fade-up">
        <h1 className="page-title">
          Good {greeting}, <span className="text-gradient">{user.name.split(' ')[0]}</span> 👋
        </h1>
        <p className="muted-text mt-1">
          {user.role === 'DONOR' ? 'Your food donations are making a difference.' :
           user.role === 'RECIPIENT' ? 'Browse available food and claim what you need.' :
           'Platform overview and management.'}
        </p>
      </div>
      {user.role === 'ADMIN'     && <AdminDashboard />}
      {user.role === 'DONOR'     && <DonorDashboard />}
      {user.role === 'RECIPIENT' && <RecipientDashboard />}
    </div>
  );
}

function AdminDashboard() {
  const { data, loading } = useQuery(ADMIN_STATS);
  if (loading) return <LoadingPage />;
  const s: AdminStats = data?.adminStats;
  if (!s) return null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-fade-up">
        <StatCard label="Total Listings" value={s.totalListings}                     icon={<Package className="w-4 h-4" />} />
        <StatCard label="Active"         value={s.activeListings}                    icon={<Leaf className="w-4 h-4" />} />
        <StatCard label="Total Claims"   value={s.totalClaims}                       icon={<CheckCircle2 className="w-4 h-4" />} />
        <StatCard label="Completed"      value={s.completedClaims}                   icon={<TrendingUp className="w-4 h-4" />} />
        <StatCard label="Users"          value={s.totalUsers}                        icon={<Users className="w-4 h-4" />} />
        <StatCard label="Waste Reduced"  value={`${s.wasteReducedKg.toFixed(0)} kg`} icon={<Leaf className="w-4 h-4" />} />
      </div>
      <div className="glass-card p-5 animate-fade-up animate-delay-200">
        <SectionHeader title="Top Donors" />
        <div className="space-y-2">
          {s.topDonors.map((d, i) => (
            <div key={d.id} className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0">
              <span className="font-mono text-xs text-white/30 w-6">#{i + 1}</span>
              <div>
                <p className="text-sm font-medium text-white">{d.name}</p>
                <p className="muted-text text-xs">{d.organization}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DonorDashboard() {
  const { data, loading } = useQuery(MY_LISTINGS);
  if (loading) return <LoadingPage />;
  const listings: FoodListing[] = data?.myListings || [];
  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'AVAILABLE').length,
    claimed: listings.filter(l => l.status === 'CLAIMED').length,
    completed: listings.filter(l => l.status === 'COMPLETED').length,
  };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Posted" value={stats.total}     icon={<Package className="w-4 h-4" />} />
        <StatCard label="Available"    value={stats.active}    icon={<Leaf className="w-4 h-4" />} />
        <StatCard label="Claimed"      value={stats.claimed}   icon={<CheckCircle2 className="w-4 h-4" />} />
        <StatCard label="Completed"    value={stats.completed} icon={<TrendingUp className="w-4 h-4" />} />
      </div>
      <div className="glass-card p-5">
        <SectionHeader title="Recent Listings"
          action={<Link to="/listings/new" className="btn-primary text-sm py-2">+ Donate Food</Link>} />
        {listings.length === 0 ? (
          <EmptyState icon="🍱" title="No listings yet" description="Start by donating your surplus food."
            action={<Link to="/listings/new" className="btn-primary text-sm">Donate Food</Link>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {listings.slice(0, 6).map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function RecipientDashboard() {
  const { data: claimsData, loading: claimsLoading } = useQuery(MY_CLAIMS);
  const { data: listingsData, loading: listingsLoading } = useQuery(GET_LISTINGS, {
    variables: { status: 'AVAILABLE', limit: 4, strategy: 'composite' },
  });
  if (claimsLoading || listingsLoading) return <LoadingPage />;
  const claims: Claim[] = claimsData?.myClaims || [];
  const listings: FoodListing[] = listingsData?.listings?.listings || [];
  const activeClaims = claims.filter(c => ['PENDING', 'CONFIRMED'].includes(c.status));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Active Claims" value={activeClaims.length}                               icon={<AlertCircle className="w-4 h-4" />} />
        <StatCard label="Total Claims"  value={claims.length}                                     icon={<Package className="w-4 h-4" />} />
        <StatCard label="Completed"     value={claims.filter(c => c.status === 'PICKED_UP').length} icon={<CheckCircle2 className="w-4 h-4" />} />
      </div>
      {activeClaims.length > 0 && (
        <div className="glass-card p-5">
          <SectionHeader title="Active Claims" />
          <div className="space-y-2">
            {activeClaims.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-surface-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{c.listing.title}</p>
                  <p className="muted-text text-xs">{c.listing.donor.organization} · {c.quantity} {c.listing.unit}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={c.status} />
                  <span className="muted-text text-xs">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="glass-card p-5">
        <SectionHeader title="Available Food Near You"
          action={<Link to="/browse" className="text-brand-400 hover:text-brand-300 text-sm font-display">View all →</Link>} />
        {listings.length === 0 ? (
          <EmptyState icon="🔍" title="No food available right now" description="Check back soon — donors post regularly." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {listings.map(l => <ListingCard key={l.id} listing={l} showClaimButton />)}
          </div>
        )}
      </div>
    </div>
  );
}
