
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  X,
  Monitor,
  BellRing,
} from "lucide-react";

import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/hooks/use-notifications";

import { usePushNotifications } from "@/hooks/use-push-notifications";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading, isError } = useNotifications();

  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading: isPushLoading,
    error: pushError,
    enableNotifications,
    disableNotifications,
  } = usePushNotifications();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  function handleNotificationClick(
    notificationId: string,
    isRead: boolean
  ) {
    if (!isRead) {
      markAsRead.mutate(notificationId);
    }

    setIsOpen(false);
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((previous) => !previous)}
        className="
          relative flex h-10 w-10
          items-center justify-center
          rounded-full border border-border
          bg-card transition hover:bg-muted
        "
      >
        <Bell className="h-[17px] w-[17px]" />

        {unreadCount > 0 && (
          <span
            className="
              absolute -right-1 -top-1
              flex h-[19px] min-w-[19px]
              items-center justify-center
              rounded-full bg-primary px-1
              text-[10px] font-bold text-white
            "
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div
            className="
              absolute right-0 top-14 z-50
              w-[calc(100vw-2rem)] max-w-[390px]
              overflow-hidden rounded-2xl
              border border-border bg-card shadow-xl
            "
          >
            {/* Header */}
            <div
              className="
                flex items-center justify-between
                border-b border-border px-4 py-4
              "
            >
              <div>
                <h3 className="text-sm font-semibold">
                  Notifications
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} unread notifications`
                    : "You're all caught up"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    disabled={markAllAsRead.isPending}
                    onClick={() => markAllAsRead.mutate()}
                    className="
                      flex items-center gap-1
                      text-xs font-medium text-primary
                      transition hover:opacity-70
                      disabled:opacity-50
                    "
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}

                <button
                  type="button"
                  aria-label="Close notifications"
                  onClick={() => setIsOpen(false)}
                  className="
                    rounded-full p-1.5
                    text-muted-foreground
                    transition hover:bg-muted
                  "
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Browser Notification Settings */}
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex h-9 w-9 shrink-0
                    items-center justify-center
                    rounded-xl bg-primary/10
                  "
                >
                  <Monitor className="h-4 w-4 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    Browser notifications
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {isSubscribed
                      ? "Enabled on this browser"
                      : permission === "denied"
                        ? "Blocked by browser settings"
                        : "Get reminders even when HabitBot is closed"}
                  </p>
                </div>

                {isSupported && (
                  <button
                    type="button"
                    disabled={isPushLoading || permission === "denied"}
                    onClick={() =>
                      isSubscribed
                        ? disableNotifications()
                        : enableNotifications()
                    }
                    className={`
                      shrink-0 rounded-lg px-3 py-2
                      text-xs font-semibold transition
                      disabled:cursor-not-allowed disabled:opacity-50
                      ${
                        isSubscribed
                          ? "border border-border bg-card text-foreground hover:bg-muted"
                          : "bg-primary text-white hover:opacity-90"
                      }
                    `}
                  >
                    {isPushLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isSubscribed ? (
                      "Disable"
                    ) : (
                      "Enable"
                    )}
                  </button>
                )}
              </div>

              {!isSupported && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Browser push notifications are not supported here.
                </p>
              )}

              {permission === "denied" && isSupported && (
                <p className="mt-2 text-xs text-amber-600">
                  Allow notifications in your browser's site settings,
                  then reload HabitBot.
                </p>
              )}

              {pushError && (
                <p className="mt-2 text-xs text-destructive">
                  {pushError}
                </p>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-[420px] overflow-y-auto">
              {isLoading && (
                <div
                  className="
                    flex items-center justify-center
                    gap-2 py-12 text-sm text-muted-foreground
                  "
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading notifications...
                </div>
              )}

              {isError && (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    Unable to load notifications.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Please try again.
                  </p>
                </div>
              )}

              {!isLoading &&
                !isError &&
                notifications.length === 0 && (
                  <div
                    className="
                      flex flex-col items-center
                      justify-center px-5 py-12 text-center
                    "
                  >
                    <div
                      className="
                        flex h-12 w-12 items-center
                        justify-center rounded-full bg-muted
                      "
                    >
                      <Bell className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <p className="mt-3 text-sm font-medium">
                      No notifications yet
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Your habit reminders will appear here.
                    </p>
                  </div>
                )}

              {!isLoading &&
                !isError &&
                notifications.map((notification) => {
                  const isRead = notification.readAt !== null;

                  const content = (
                    <div
                      className={`
                        flex gap-3 border-b border-border
                        px-4 py-4 transition hover:bg-muted/50
                        ${!isRead ? "bg-primary/[0.035]" : ""}
                      `}
                    >
                      <div
                        className="
                          flex h-9 w-9 shrink-0
                          items-center justify-center
                          rounded-xl bg-primary/10
                        "
                      >
                        <Bell className="h-4 w-4 text-primary" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">
                            {notification.title}
                          </p>

                          {!isRead && (
                            <span
                              className="
                                h-2 w-2 shrink-0
                                rounded-full bg-primary
                              "
                            />
                          )}
                        </div>

                        <p
                          className="
                            mt-1 text-xs leading-relaxed
                            text-muted-foreground
                          "
                        >
                          {notification.message}
                        </p>

                        {notification.habit && (
                          <p className="mt-1.5 text-xs font-medium text-primary">
                            {notification.habit.name}
                          </p>
                        )}

                        <div
                          className="
                            mt-2 flex items-center gap-1
                            text-[11px] text-muted-foreground
                          "
                        >
                          <Clock className="h-3 w-3" />
                          {formatNotificationTime(notification.createdAt)}
                        </div>
                      </div>

                      {!isRead && (
                        <button
                          type="button"
                          aria-label="Mark as read"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            markAsRead.mutate(notification.id);
                          }}
                          className="
                            self-center rounded-full p-1.5
                            text-muted-foreground
                            transition hover:bg-muted hover:text-primary
                          "
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );

                  return notification.habitId ? (
                    <Link
                      key={notification.id}
                      href={`/habits/${notification.habitId}`}
                      onClick={() =>
                        handleNotificationClick(
                          notification.id,
                          isRead
                        )
                      }
                      className="block"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={notification.id}>
                      <button
                        type="button"
                        onClick={() =>
                          handleNotificationClick(
                            notification.id,
                            isRead
                          )
                        }
                        className="block w-full text-left"
                      >
                        {content}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-border px-4 py-3 text-center">
                <p className="text-[11px] text-muted-foreground">
                  Showing your latest {notifications.length} notifications
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);

  const seconds = Math.floor(
    (Date.now() - date.getTime()) / 1000
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
