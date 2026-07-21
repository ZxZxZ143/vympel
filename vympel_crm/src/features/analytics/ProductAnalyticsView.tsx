"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { crmApi } from "@/shared/api/client";
import { getCrmErrorMessage } from "@/shared/api/errors";
import {
  ProductAnalyticsPeriod,
  ProductPopularityAnalytics,
  ProductPopularityRow,
} from "@/shared/api/types";
import { useNotifications } from "@/shared/feedback/NotificationProvider";
import { useI18n } from "@/shared/i18n/useI18n";
import { Button } from "@/shared/ui/Button";
import { Heading } from "@/shared/ui/Heading";
import { Text } from "@/shared/ui/Text";

const periods: ProductAnalyticsPeriod[] = ["today", "7d", "30d", "all"];

export function ProductAnalyticsView() {
  const notifications = useNotifications();
  const { locale, t } = useI18n();
  const [period, setPeriod] = useState<ProductAnalyticsPeriod>("7d");
  const [analytics, setAnalytics] = useState<ProductPopularityAnalytics | null>(null);
  const [promotionBusyId, setPromotionBusyId] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const loadAnalytics = useCallback(() => {
    setAnalytics(null);
    setError(false);
    crmApi
      .productPopularityAnalytics({ lang: locale, period })
      .then((nextAnalytics) => {
        setAnalytics(nextAnalytics);
        setError(false);
      })
      .catch(() => setError(true));
  }, [locale, period]);

  useEffect(() => {
    let alive = true;

    crmApi
      .productPopularityAnalytics({ lang: locale, period })
      .then((nextAnalytics) => {
        if (!alive) {
          return;
        }

        setAnalytics(nextAnalytics);
        setError(false);
      })
      .catch(() => {
        if (alive) {
          setError(true);
        }
      });

    return () => {
      alive = false;
    };
  }, [locale, period]);

  const changePeriod = (nextPeriod: ProductAnalyticsPeriod) => {
    setAnalytics(null);
    setError(false);
    setPeriod(nextPeriod);
  };

  const updatePromotion = async (row: ProductPopularityRow) => {
    if (promotionBusyId !== null) {
      return;
    }

    const nextMode = row.promotionMode === "MANUAL" ? "NOT_PROMOTED" : "MANUAL";
    setPromotionBusyId(row.productId);
    try {
      await crmApi.updateProductPromotion(row.productId, nextMode, locale);
      notifications.success(t("analytics.promotionUpdated"));
      loadAnalytics();
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("analytics.promotionUpdateError")));
    } finally {
      setPromotionBusyId(null);
    }
  };

  if (error) {
    return <Text className="crm-form-error">{t("common.error")}</Text>;
  }

  return (
    <section className="crm-page">
      <div className="crm-panel">
        <div className="crm-panel__header">
          <Text tone="muted">{t("analytics.subtitle")}</Text>
          <label className="crm-field" htmlFor="analyticsPeriod">
            <span className="crm-label">{t("analytics.period")}</span>
            <select id="analyticsPeriod" className="crm-select" value={period} onChange={(event) => changePeriod(event.target.value as ProductAnalyticsPeriod)}>
              {periods.map((item) => (
                <option key={item} value={item}>
                  {t(`analytics.periods.${item}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {!analytics ? (
        <Text tone="muted">{t("common.loading")}</Text>
      ) : (
        <>
          <div className="crm-grid crm-grid--metrics">
            <Metric label={t("analytics.views")} value={analytics.summary.views} />
            <Metric label={t("analytics.favorites")} value={analytics.summary.favorites} />
            <Metric label={t("analytics.cartAdditions")} value={analytics.summary.cartAdditions} />
            <Metric label={t("analytics.addToCartRate")} value={`${analytics.summary.addToCartRate}%`} />
            <Metric label={t("analytics.recommendations")} value={analytics.promotionRecommendations.length} />
          </div>

          <AnalyticsTable title={t("analytics.mostViewed")} rows={analytics.mostViewed} t={t} />
          <AnalyticsTable title={t("analytics.mostFavorited")} rows={analytics.mostFavorited} t={t} />
          <AnalyticsTable title={t("analytics.mostAddedToCart")} rows={analytics.mostAddedToCart} t={t} />
          <AnalyticsTable title={t("analytics.lowDemand")} rows={analytics.lowDemand} t={t} />
          <AnalyticsTable title={t("analytics.highInterest")} rows={analytics.highInterest} t={t} />
          <AnalyticsTable
            title={t("analytics.promotionRecommendations")}
            rows={analytics.promotionRecommendations}
            t={t}
            renderAction={(row) => (
              <Button
                type="button"
                variant={row.promotionMode === "MANUAL" ? "danger" : "secondary"}
                isLoading={promotionBusyId === row.productId}
                disabled={promotionBusyId !== null && promotionBusyId !== row.productId}
                onClick={() => updatePromotion(row)}
              >
                {row.promotionMode === "MANUAL" ? t("analytics.disablePromotion") : t("analytics.enablePromotion")}
              </Button>
            )}
          />
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="crm-metric">
      <Text tone="muted" size="small">{label}</Text>
      <span className="crm-metric__value">{value}</span>
    </article>
  );
}

function AnalyticsTable({
  title,
  rows,
  t,
  renderAction,
}: {
  title: string;
  rows: ProductPopularityRow[];
  t: (key: string) => string;
  renderAction?: (row: ProductPopularityRow) => ReactNode;
}) {
  return (
    <section className="crm-panel">
      <div className="crm-panel__header">
        <Heading as="h2" size="title">{title}</Heading>
      </div>
      {rows.length === 0 ? (
        <div className="crm-panel__body crm-empty">
          <Text tone="muted">{t("common.empty")}</Text>
        </div>
      ) : (
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>{t("products.name")}</th>
                <th>{t("products.sku")}</th>
                <th>{t("analytics.views")}</th>
                <th>{t("analytics.favorites")}</th>
                <th>{t("analytics.cartAdditions")}</th>
                <th>{t("analytics.addToCartRate")}</th>
                <th>{t("products.stockQuantity")}</th>
                <th>{t("analytics.promotionMode")}</th>
                <th>{t("analytics.recommendationReason")}</th>
                {renderAction && <th>{t("common.edit")}</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${title}-${row.productId}`}>
                  <td>{row.name}</td>
                  <td>{row.sku}</td>
                  <td>{row.views}</td>
                  <td>{row.favorites}</td>
                  <td>{row.cartAdditions}</td>
                  <td>{row.addToCartRate}%</td>
                  <td>{row.stockQuantity ?? t("common.empty")}</td>
                  <td>
                    <span className={row.promotionMode === "MANUAL" ? "crm-chip crm-chip--success" : "crm-chip"}>
                      {t(`analytics.promotionModes.${row.promotionMode}`)}
                    </span>
                  </td>
                  <td>{row.recommendationReasonCode ? t(`analytics.recommendationReasons.${row.recommendationReasonCode}`) : t("common.empty")}</td>
                  {renderAction && <td>{renderAction(row)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
