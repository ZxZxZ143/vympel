"use client";

import { useEffect, useState } from "react";
import { crmApi } from "@/shared/api/client";
import { Dashboard } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/useI18n";
import { Heading } from "@/shared/ui/Heading";
import { Text } from "@/shared/ui/Text";

export function DashboardView() {
  const { locale, t, messages } = useI18n();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    crmApi
      .dashboard(locale)
      .then((nextDashboard) => {
        setDashboard(nextDashboard);
        setError(false);
      })
      .catch(() => setError(true));
  }, [locale]);

  if (error) {
    return <Text className="crm-form-error">{t("common.error")}</Text>;
  }

  if (!dashboard) {
    return <Text tone="muted">{t("common.loading")}</Text>;
  }

  const metrics = [
    ["dashboard.totalProducts", dashboard.totalProducts],
    ["dashboard.activeProducts", dashboard.activeProducts],
    ["dashboard.inStockProducts", dashboard.inStockProducts],
    ["dashboard.outOfStockProducts", dashboard.outOfStockProducts],
    ["dashboard.missingKaspiLinks", dashboard.missingKaspiLinks],
    ["dashboard.missingWildberriesLinks", dashboard.missingWildberriesLinks],
    ["dashboard.pendingReviews", dashboard.pendingReviews],
  ];

  return (
    <section className="crm-page">
      <Text tone="muted">{t("dashboard.subtitle")}</Text>

      <div className="crm-grid crm-grid--metrics">
        {metrics.map(([labelKey, value]) => (
          <article className="crm-metric" key={labelKey}>
            <Text tone="muted" size="small">
              {t(String(labelKey))}
            </Text>
            <span className="crm-metric__value">{value}</span>
          </article>
        ))}
      </div>

      <section className="crm-panel">
        <div className="crm-panel__header">
          <Heading as="h2" size="title">
            {t("dashboard.recentProducts")}
          </Heading>
        </div>
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>{t("products.name")}</th>
                <th>{t("products.model")}</th>
                <th>{t("products.price")}</th>
                <th>{t("products.stockQuantity")}</th>
                <th>{t("products.kaspi")}</th>
                <th>{t("products.wildberries")}</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentlyUpdatedProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.model}</td>
                  <td>
                    {product.price} {t("common.currency")}
                  </td>
                  <td>{product.stockQuantity}</td>
                  <td>
                    <span className={product.kaspiUrl ? "crm-chip crm-chip--success" : "crm-chip crm-chip--danger"}>
                      {product.kaspiUrl ? t("products.linkReady") : t("products.linkMissing")}
                    </span>
                  </td>
                  <td>
                    <span className={product.wildberriesUrl ? "crm-chip crm-chip--success" : "crm-chip crm-chip--danger"}>
                      {product.wildberriesUrl ? t("products.linkReady") : t("products.linkMissing")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="crm-panel">
        <div className="crm-panel__header">
          <Heading as="h2" size="title">
            {t("dashboard.recentActivity")}
          </Heading>
        </div>
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>{t("activity.eventType")}</th>
                <th>{t("activity.actor")}</th>
                <th>{t("activity.timestamp")}</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentActivities.map((activity) => (
                <tr key={activity.id}>
                  <td>{messages.activity.events[activity.eventType as keyof typeof messages.activity.events] ?? activity.eventType}</td>
                  <td>{activity.actorEmail ?? activity.actorRole ?? t("common.empty")}</td>
                  <td>{new Date(activity.createdAt).toLocaleString(locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
