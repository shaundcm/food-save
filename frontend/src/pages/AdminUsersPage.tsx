import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Search } from 'lucide-react';
import { ALL_USERS } from '../lib/queries';
import { User, UserRole } from '../lib/types';
import { LoadingPage, EmptyState, Avatar } from '../components/shared/UI';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

const ROLE_BADGE: Record<UserRole, string> = {
  ADMIN:     'bg-blue-500/20 text-blue-400 border-blue-500/30',
  DONOR:     'bg-earth-500/20 text-earth-400 border-earth-500/30',
  RECIPIENT: 'bg-brand-500/20 text-brand-400 border-brand-500/30',
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');

  const { data, loading } = useQuery(ALL_USERS, {
    variables: { role: roleFilter || undefined },
  });

  const users: User[] = data?.allUsers || [];
  const filtered = search
    ? users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.organization?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  if (loading) return <LoadingPage />;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6 animate-fade-up">
        <h1 className="page-title">Users</h1>
        <p className="muted-text mt-1">{users.length} registered users</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-5 flex flex-wrap gap-3 animate-fade-up animate-delay-100">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(['', 'DONOR', 'RECIPIENT', 'ADMIN'] as (UserRole | '')[]).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display transition-all ${
                roleFilter === r
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-muted text-white/50 border border-surface-border hover:text-white'
              }`}
            >
              {r || 'All'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="👥" title="No users found" />
      ) : (
        <div className="space-y-2 animate-fade-up animate-delay-200">
          {filtered.map(u => (
            <div key={u.id} className="glass-card p-4 flex items-center gap-4">
              <Avatar name={u.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-semibold text-white text-sm">{u.name}</p>
                  <span className={clsx('text-xs font-mono px-1.5 py-0.5 rounded border', ROLE_BADGE[u.role])}>
                    {u.role}
                  </span>
                  {!u.isActive && (
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/20">
                      INACTIVE
                    </span>
                  )}
                </div>
                <p className="muted-text text-xs mt-0.5">{u.email}</p>
                {u.organization && (
                  <p className="muted-text text-xs">{u.organization}</p>
                )}
              </div>
              <div className="text-right">
                <p className="muted-text text-xs">
                  Joined {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                </p>
                {u.address && (
                  <p className="muted-text text-xs truncate max-w-40">{u.address}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
