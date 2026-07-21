"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";
import { cx } from "@/shared/utils/cx";

type NotificationTone = "success" | "warning" | "error";

type Notification = {
  id: number;
  tone: NotificationTone;
  message: string;
};

type NotificationContextValue = {
  success: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);
const notificationLifetimeMs = 5000;

export function NotificationProvider({ children }: PropsWithChildren) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const remove = useCallback((id: number) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);

  const show = useCallback(
    (tone: NotificationTone, message: string) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setNotifications((current) => [...current, { id, tone, message }]);
      window.setTimeout(() => remove(id), notificationLifetimeMs);
    },
    [remove]
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      success: (message) => show("success", message),
      warning: (message) => show("warning", message),
      error: (message) => show("error", message),
    }),
    [show]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="crm-notifications" aria-live="polite" aria-atomic="true">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cx(
              "crm-notification",
              notification.tone === "success" && "crm-notification--success",
              notification.tone === "warning" && "crm-notification--warning",
              notification.tone === "error" && "crm-notification--error"
            )}
          >
            {notification.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }

  return context;
}
