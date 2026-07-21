"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { crmApi } from "@/shared/api/client";
import { getCrmErrorMessage } from "@/shared/api/errors";
import { ManagedUser, Page } from "@/shared/api/types";
import { useNotifications } from "@/shared/feedback/NotificationProvider";
import { useI18n } from "@/shared/i18n/useI18n";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";

type UserSearchFormValues = {
  search: string;
};

export function UserListView() {
  const { locale, t, messages } = useI18n();
  const [page, setPage] = useState<Page<ManagedUser> | null>(null);
  const { handleSubmit, register } = useForm<UserSearchFormValues>({
    defaultValues: {
      search: "",
    },
  });
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    crmApi
      .users({ search: submittedSearch })
      .then((nextPage) => {
        setPage(nextPage);
        setError(false);
      })
      .catch(() => setError(true));
  }, [submittedSearch]);

  const submitSearch = (values: UserSearchFormValues) => {
    setSubmittedSearch(values.search.trim());
  };

  const replaceUser = (user: ManagedUser) => {
    setPage((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        content: current.content.map((item) => (item.id === user.id ? user : item)),
      };
    });
  };

  if (error) {
    return <Text className="crm-form-error">{t("common.error")}</Text>;
  }

  return (
    <section className="crm-page">
      <Text tone="muted">{t("users.subtitle")}</Text>

      <section className="crm-panel">
        <div className="crm-panel__header">
          <form className="crm-inline-actions" onSubmit={handleSubmit(submitSearch)}>
            <input
              {...register("search")}
              className="crm-input"
              aria-label={t("common.search")}
              placeholder={t("users.searchPlaceholder")}
            />
            <Button type="submit" variant="secondary">
              {t("common.search")}
            </Button>
          </form>
          <Link href="/users/new">
            <Button>{t("users.addUser")}</Button>
          </Link>
        </div>

        {!page ? (
          <div className="crm-panel__body">
            <Text tone="muted">{t("common.loading")}</Text>
          </div>
        ) : page.content.length === 0 ? (
          <div className="crm-panel__body crm-empty">
            <Text tone="muted">{t("common.empty")}</Text>
          </div>
        ) : (
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>{t("users.name")}</th>
                  <th>{t("users.email")}</th>
                  <th>{t("users.role")}</th>
                  <th>{t("users.status")}</th>
                  <th>{t("users.createdAt")}</th>
                  <th>{t("users.updatedAt")}</th>
                  <th>{t("common.edit")}</th>
                </tr>
              </thead>
              <tbody>
                {page.content.map((user) => (
                  <UserRow
                    key={`${user.id}-${user.enabled}-${user.roles.join("-")}`}
                    user={user}
                    locale={locale}
                    roleLabels={messages.users.roles}
                    statusLabels={messages.users.statuses}
                    onUserChange={replaceUser}
                    t={t}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

function UserRow({
  user,
  locale,
  roleLabels,
  statusLabels,
  onUserChange,
  t,
}: {
  user: ManagedUser;
  locale: string;
  roleLabels: Record<string, string>;
  statusLabels: { enabled: string; disabled: string };
  onUserChange: (user: ManagedUser) => void;
  t: (key: string) => string;
}) {
  const notifications = useNotifications();
  const [busy, setBusy] = useState(false);
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  const toggleStatus = async () => {
    if (busy) {
      return;
    }

    setBusy(true);
    try {
      const nextUser = await crmApi.updateUserStatus(user.id, !user.enabled);
      onUserChange(nextUser);
      notifications.success(t("users.statusUpdated"));
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("users.statusUpdateError")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr>
      <td>
        <Text as="span" size="small">
          {fullName || t("common.empty")}
        </Text>
        {user.phone && (
          <Text tone="muted" size="caption">
            {user.phone}
          </Text>
        )}
      </td>
      <td>{user.email}</td>
      <td>
        <div className="crm-inline-actions">
          {user.roles.map((role) => (
            <span className="crm-chip" key={role}>
              {roleLabels[role] ?? role}
            </span>
          ))}
        </div>
      </td>
      <td>
        <span className={user.enabled ? "crm-chip crm-chip--success" : "crm-chip crm-chip--danger"}>
          {user.enabled ? statusLabels.enabled : statusLabels.disabled}
        </span>
      </td>
      <td>{formatDate(user.createdAt, locale)}</td>
      <td>{formatDate(user.updatedAt, locale)}</td>
      <td>
        <div className="crm-inline-actions">
          <Link href={`/users/${user.id}`}>
            <Button variant="secondary">{t("common.edit")}</Button>
          </Link>
          <Button variant={user.enabled ? "danger" : "secondary"} isLoading={busy} onClick={toggleStatus}>
            {user.enabled ? t("users.block") : t("users.unblock")}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function formatDate(value: string | null, locale: string) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString(locale);
}
