import React from 'react';
import { NotificationItem } from '../types';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismissNotification: (id: string) => void;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismissNotification,
}) => {
  return (
    <div className="w-full max-w-5xl px-4 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/50 dark:border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-[#234556] dark:text-[#effbfc]">
            Copilot Notifications
          </h1>
          <p className="text-xs text-zinc-500 dark:text-[#b4e4ed]">
            Real-time updates, assistant prompt tips, and system environment messages
          </p>
        </div>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={onMarkAllAsRead}
            className="px-4 py-2 bg-accent/10 border border-accent/20 text-primary dark:text-accent hover:bg-accent/25 rounded-xl text-xs font-bold transition-all hover-scale cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-xs text-zinc-500 italic text-center py-12">
            No system notifications currently logged in workspace.
          </p>
        ) : (
          notifications.map((item) => {
            const typeColors = {
              info: 'bg-blue-500/10 border-blue-500/25 text-blue-500',
              success: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500',
              warning: 'bg-amber-500/10 border-amber-500/25 text-amber-500',
              alert: 'bg-red-500/10 border-red-500/25 text-red-500',
            };

            return (
              <div
                key={item.id}
                onClick={() => !item.read && onMarkAsRead(item.id)}
                className={`glass-panel p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-accent/30 ${
                  !item.read ? 'border-l-4 border-l-accent' : 'opacity-75'
                }`}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                      typeColors[item.type]
                    }`}
                  >
                    {item.type}
                  </span>

                  <div className="min-w-0 space-y-1">
                    <h2 className="text-xs font-bold text-[#234556] dark:text-white flex items-center gap-2">
                      {item.title}
                      {!item.read && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end border-t sm:border-transparent border-zinc-200/40 pt-2 sm:pt-0">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismissNotification(item.id);
                    }}
                    className="text-zinc-400 hover:text-accent text-xs p-1 cursor-pointer"
                    title="Dismiss alert"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsView;
