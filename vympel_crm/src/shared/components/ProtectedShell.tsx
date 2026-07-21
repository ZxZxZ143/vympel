"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { CrmApiError, crmApi } from "@/shared/api/client";
import { FORBIDDEN_EVENT, SESSION_EXPIRED_EVENT } from "@/shared/api/session";
import { canAccessProtectedRoute, canViewNavigationItem, hasAdminRole } from "@/shared/auth/permissions";
import { CrmUser } from "@/shared/api/types";
import { useNotifications } from "@/shared/feedback/NotificationProvider";
import { useI18n } from "@/shared/i18n/useI18n";
import { CrmLocale } from "@/shared/i18n/messages";
import { Button } from "@/shared/ui/Button";
import { Heading } from "@/shared/ui/Heading";
import { Text } from "@/shared/ui/Text";
import { cx } from "@/shared/utils/cx";

type NavItem = {
  href: string;
  labelKey: string;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard" },
  { href: "/products", labelKey: "nav.products" },
  { href: "/requests", labelKey: "nav.requests" },
  { href: "/reviews", labelKey: "nav.reviews" },
  { href: "/analytics", labelKey: "nav.analytics" },
  { href: "/cms", labelKey: "nav.cms", adminOnly: true },
  { href: "/users", labelKey: "nav.users", adminOnly: true },
  { href: "/activity", labelKey: "nav.activity" },
  { href: "/settings", labelKey: "nav.settings" },
];

type ProtectedShellProps = PropsWithChildren<{
  adminOnly?: boolean;
}>;

export function ProtectedShell({ adminOnly = false, children }: ProtectedShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const notifications = useNotifications();
  const { locale, locales, setLocale, t } = useI18n();
  const [user, setUser] = useState<CrmUser | null>(null);
  const [state, setState] = useState<"checking" | "ready" | "expired" | "forbidden" | "error">("checking");
  const [reloadCount, setReloadCount] = useState(0);
  const [logoutPending, setLogoutPending] = useState(false);
  const isAdmin = user ? hasAdminRole(user.roles) : false;

  useEffect(() => {
    let active = true;

    crmApi
      .me()
      .then((nextUser) => {
        if (!active) {
          return;
        }

        setUser(nextUser);
        if (!canAccessProtectedRoute(nextUser.roles, adminOnly)) {
          setState("forbidden");
          return;
        }
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        if (error instanceof CrmApiError && error.status === 401) {
          setState("expired");
          router.replace("/login");
          return;
        }

        setState("error");
      });

    return () => {
      active = false;
    };
  }, [adminOnly, reloadCount, router]);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setState("expired");
      notifications.warning(t("common.sessionExpired"));
      router.replace("/login");
    };
    const handleForbidden = () => {
      notifications.warning(t("common.forbiddenAction"));
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    window.addEventListener(FORBIDDEN_EVENT, handleForbidden);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
      window.removeEventListener(FORBIDDEN_EVENT, handleForbidden);
    };
  }, [notifications, router, t]);

  const visibleNavItems = useMemo(() => {
    const roles = isAdmin ? ["ADMIN"] : [];
    return navItems.filter((item) => canViewNavigationItem(roles, item.adminOnly));
  }, [isAdmin]);

  const title = useMemo(() => {
    const active = visibleNavItems.find((item) => pathname.startsWith(item.href));
    return active ? t(active.labelKey) : t("nav.dashboard");
  }, [pathname, t, visibleNavItems]);

  const logout = async () => {
    if (logoutPending) {
      return;
    }

    setLogoutPending(true);
    try {
      await crmApi.logout();
      notifications.success(t("login.logoutSuccess"));
      router.replace("/login");
    } catch {
      notifications.error(t("login.logoutFailed"));
      setLogoutPending(false);
    }
  };

  if (state !== "ready") {
    return (
      <main className="crm-login">
        <section className="crm-panel crm-login__panel">
          <div className="crm-panel__body">
            <Heading as="h1" size="title">
              {state === "expired"
                ? t("common.sessionExpired")
                : state === "forbidden"
                  ? t("common.forbidden")
                  : state === "error"
                    ? t("common.error")
                    : t("common.loading")}
            </Heading>
            {state === "error" ? (
              <Button
                onClick={() => {
                  setState("checking");
                  setReloadCount((current) => current + 1);
                }}
              >
                {t("common.retry")}
              </Button>
            ) : null}
            {state === "forbidden" ? (
              <Button onClick={() => router.replace("/dashboard")}>{t("nav.dashboard")}</Button>
            ) : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="crm-shell">
      <aside className="crm-sidebar">
        <div>
          <div className="crm-brand">
            <span className="crm-brand__mark">Vympel</span>
            <Text tone="inverse" size="small">
              {t("common.brandSubtitle")}
            </Text>
          </div>

          <nav className="crm-nav" aria-label={t("common.brandSubtitle")}>
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                className={cx("crm-nav__link", pathname.startsWith(item.href) && "crm-nav__link--active")}
                href={item.href}
              >
                <span>{t(item.labelKey)}</span>
                <span aria-hidden="true">›</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="crm-grid">
          <label className="crm-field" htmlFor="crm-locale">
            <span className="crm-label">{t("common.language")}</span>
            <select
              id="crm-locale"
              className="crm-select"
              value={locale}
              onChange={(event) => setLocale(event.target.value as CrmLocale)}
            >
              {locales.map((item) => (
                <option key={item} value={item}>
                  {item.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        </div>
      </aside>

      <main className="crm-main">
        <header className="crm-topbar">
          <div>
            <Heading as="h1" size="display">
              {title}
            </Heading>
            <Text tone="muted" size="small">
              {user?.email ?? user?.roles.join(", ")}
            </Text>
          </div>
          <Button variant="secondary" isLoading={logoutPending} onClick={logout}>
            {t("common.logout")}
          </Button>
        </header>
        {children}
      </main>
    </div>
  );
}
