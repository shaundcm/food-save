import { useQuery, useMutation } from '@apollo/client';
import { Bell, CheckCheck, Package } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { MY_NOTIFICATIONS, MARK_READ, MARK_ALL_READ, ME } from '../lib/queries';
import { AppNotification } from '../lib/types';
import { LoadingPage, EmptyState } from '../components/shared/UI';

const TYPE_CONFIG: Record<string, { emoji: string }> = {
  NEW_LISTING:     { emoji: '🍱' },
  LISTING_CLAIMED: { emoji: '🤝' },
  CLAIM_CONFIRMED: { emoji: '✅' },
  LISTING_EXPIRED: { emoji: '⏰' },
  CLAIM_CANCELLED: { emoji: '❌' },
};

export default function NotificationsPage() {
  const { data, loading } = useQuery(MY_NOTIFICATIONS, { variables: { unreadOnly: false } });

  const [markRead] = useMutation(MARK_READ, {
    refetchQueries: [{ query: ME }, { query: MY_NOTIFICATIONS, variables: { unreadOnly: false } }],
  });
  const [markAll, { loading: markingAll }] = useMutation(MARK_ALL_READ, {
    refetchQueries: [{ query: ME }, { query: MY_NOTIFICATIONS, variables: { unreadOnly: false } }],
  });

  const notifications: AppNotification[] = data?.myNotifications || [];
  const unread = notifications.filter(n => !n.isRead);

  if (loading) return <LoadingPage />;

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="muted-text mt-1">{unread.length > 0 ? `${unread.length} unread` : 'All caught up'}</p>
        </div>
        {unread.length > 0 && (
          <button onClick={() => markAll()} disabled={markingAll}
            className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 transition-colors font-display">
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="w-8 h-8 text-white/20" />} title="No notifications yet"
          description="You'll be notified when new food is available or claims are updated." />
      ) : (
        <div className="space-y-2 animate-fade-up animate-delay-100">
          {notifications.map(n => {
            const config = TYPE_CONFIG[n.type] || { emoji: '📢' };
            return (
              <button key={n.id} onClick={() => !n.isRead && markRead({ variables: { id: n.id } })}
                className={clsx(
                  'w-full text-left glass-card p-4 flex items-start gap-3 transition-all',
                  !n.isRead ? 'border-brand-500/20 hover:border-brand-500/40' : 'opacity-50 hover:opacity-70'
                )}>
                <span className="text-xl flex-shrink-0 mt-0.5">{config.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={clsx('text-sm font-body', n.isRead ? 'text-white/50' : 'text-white')}>
                    {n.message}
                  </p>
                  {n.listing && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-white/30">
                      <Package className="w-3 h-3" />{n.listing.title}
                    </div>
                  )}
                  <p className="muted-text text-xs mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.isRead && <div className="w-2 h-2 rounded-full bg-brand-400 flex-shrink-0 mt-1.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
