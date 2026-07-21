"use client";

import { useEffect, useMemo, useState } from "react";
import { crmApi } from "@/shared/api/client";
import { Activity, Page } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/useI18n";
import { Heading } from "@/shared/ui/Heading";
import { Text } from "@/shared/ui/Text";

export function ActivityView() {
  const { locale, t, messages } = useI18n();
  const [page, setPage] = useState<Page<Activity> | null>(null);
  const [eventFilter, setEventFilter] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    crmApi
      .activity({ size: 50 })
      .then((nextPage) => {
        setPage(nextPage);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  const events = useMemo(() => {
    if (!page) {
      return [];
    }

    return Array.from(new Set(page.content.map((activity) => activity.eventType)));
  }, [page]);

  const filtered = useMemo(() => {
    if (!page) {
      return [];
    }

    return eventFilter ? page.content.filter((activity) => activity.eventType === eventFilter) : page.content;
  }, [eventFilter, page]);

  if (error) {
    return <Text className="crm-form-error">{t("common.error")}</Text>;
  }

  return (
    <section className="crm-page">
      <Text tone="muted">{t("activity.subtitle")}</Text>

      <section className="crm-panel">
        <div className="crm-panel__header">
          <Heading as="h2" size="title">
            {t("activity.title")}
          </Heading>
          <select
            className="crm-select"
            aria-label={t("activity.filterPlaceholder")}
            value={eventFilter}
            onChange={(event) => setEventFilter(event.target.value)}
          >
            <option value="">{t("common.all")}</option>
            {events.map((event) => (
              <option key={event} value={event}>
                {messages.activity.events[event as keyof typeof messages.activity.events] ?? event}
              </option>
            ))}
          </select>
        </div>

        {!page ? (
          <div className="crm-panel__body">
            <Text tone="muted">{t("common.loading")}</Text>
          </div>
        ) : filtered.length === 0 ? (
          <div className="crm-panel__body crm-empty">
            <Text tone="muted">{t("common.empty")}</Text>
          </div>
        ) : (
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>{t("activity.eventType")}</th>
                  <th>{t("activity.actor")}</th>
                  <th>{t("activity.entity")}</th>
                  <th>{t("activity.metadata")}</th>
                  <th>{t("activity.timestamp")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((activity) => (
                  <tr key={activity.id}>
                    <td>{messages.activity.events[activity.eventType as keyof typeof messages.activity.events] ?? activity.eventType}</td>
                    <td>{activity.actorEmail ?? activity.actorRole ?? t("common.empty")}</td>
                    <td>
                      {activity.entityType}
                      {activity.entityId ? ` #${activity.entityId}` : ""}
                    </td>
                    <td>{formatMetadata(activity.metadata, t)}</td>
                    <td>{new Date(activity.createdAt).toLocaleString(locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

function formatMetadata(metadata: Record<string, unknown> | null, t: (key: string) => string) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return t("common.empty");
  }

  return Object.entries(metadata)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
    .join("; ");
}
