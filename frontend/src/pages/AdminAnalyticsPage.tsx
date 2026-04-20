import { useQuery } from '@apollo/client';
import { TrendingUp, Leaf, Users, Package, CheckCircle2, Award } from 'lucide-react';
import { ADMIN_STATS } from '../lib/queries';
import { AdminStats } from '../lib/types';
import { LoadingPage, StatCard, Avatar } from '../components/shared/UI';

export default function AdminAnalyticsPage() {
  const { data, loading } = useQuery(ADMIN_STATS, { pollInterval: 30000 });

  if (loading) return <LoadingPage />;
  const s: AdminStats = data?.adminStats;
  if (!s) return null;

  const completionRate = s.totalClaims > 0
    ? Math.round((s.completedClaims / s.totalClaims) * 100)
    : 0;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6 animate-fade-up">
        <h1 className="page-title">Analytics</h1>
        <p className="muted-text mt-1">Platform-wide impact metrics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 animate-fade-up animate-delay-100">
        <StatCard label="Total Listings"  value={s.totalListings}                  icon={<Package className="w-4 h-4" />} />
        <StatCard label="Active Now"      value={s.activeListings}                 icon={<Leaf className="w-4 h-4" />} />
        <StatCard label="Total Claims"    value={s.totalClaims}                    icon={<CheckCircle2 className="w-4 h-4" />} />
        <StatCard label="Completed"       value={s.completedClaims}               icon={<TrendingUp className="w-4 h-4" />} />
        <StatCard label="Total Users"     value={s.totalUsers}                     icon={<Users className="w-4 h-4" />} />
        <StatCard
          label="Waste Reduced"
          value={`${s.wasteReducedKg.toFixed(1)} kg`}
          sub="Est. based on completed claims"
          icon={<Leaf className="w-4 h-4" />}
        />
      </div>

      {/* Completion rate visual */}
      <div className="glass-card p-5 mb-5 animate-fade-up animate-delay-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Claim Completion Rate</h2>
          <span className="font-mono text-2xl font-bold text-gradient">{completionRate}%</span>
        </div>
        <div className="h-3 bg-surface-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-1000"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="muted-text text-xs">{s.completedClaims} completed</span>
          <span className="muted-text text-xs">{s.totalClaims} total claims</span>
        </div>
      </div>

      {/* Environmental impact */}
      <div className="glass-card p-5 mb-5 animate-fade-up animate-delay-300">
        <h2 className="section-title mb-4">Environmental Impact</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'CO₂ Saved',   value: `${(s.wasteReducedKg * 2.5).toFixed(0)} kg`,  emoji: '🌱' },
            { label: 'Meals Served', value: `~${(s.completedClaims * 15).toLocaleString()}`, emoji: '🍽️' },
            { label: 'Families Fed', value: `~${Math.round(s.completedClaims * 3)}`,       emoji: '👨‍👩‍👧' },
          ].map(({ label, value, emoji }) => (
            <div key={label} className="bg-surface-muted rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">{emoji}</div>
              <p className="font-display text-xl font-bold text-white">{value}</p>
              <p className="muted-text text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top donors */}
      <div className="glass-card p-5 animate-fade-up animate-delay-400">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-earth-400" />
          <h2 className="section-title">Top Donors</h2>
        </div>
        {s.topDonors.length === 0 ? (
          <p className="muted-text text-sm">No donors yet.</p>
        ) : (
          <div className="space-y-3">
            {s.topDonors.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3">
                <span className="font-mono text-xs text-white/30 w-5 text-right">#{i + 1}</span>
                <Avatar name={d.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-white">{d.name}</p>
                  {d.organization && <p className="muted-text text-xs">{d.organization}</p>}
                </div>
                {i === 0 && <span className="ml-auto text-lg">🏆</span>}
                {i === 1 && <span className="ml-auto text-lg">🥈</span>}
                {i === 2 && <span className="ml-auto text-lg">🥉</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
