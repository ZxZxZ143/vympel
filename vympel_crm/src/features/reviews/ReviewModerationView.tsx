"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { crmApi } from "@/shared/api/client";
import { getCrmErrorMessage } from "@/shared/api/errors";
import { Page, ProductReview, ProductReviewStatus } from "@/shared/api/types";
import { useNotifications } from "@/shared/feedback/NotificationProvider";
import { useI18n } from "@/shared/i18n/useI18n";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Heading } from "@/shared/ui/Heading";
import { Text } from "@/shared/ui/Text";
import { cx } from "@/shared/utils/cx";

type ReviewFilterFormValues = {
  product: string;
  rating: string;
  text: "ALL" | "WITH_TEXT" | "WITHOUT_TEXT";
  status: ProductReviewStatus | "ALL";
  dateFrom: string;
  dateTo: string;
};

const defaultFilters: ReviewFilterFormValues = {
  product: "",
  rating: "",
  text: "ALL",
  status: "PENDING",
  dateFrom: "",
  dateTo: "",
};

type ReviewAction = "approve" | "reject" | "delete";

export function ReviewModerationView() {
  const { locale, messages, t } = useI18n();
  const notifications = useNotifications();
  const { handleSubmit, register, reset } = useForm<ReviewFilterFormValues>({
    defaultValues: defaultFilters,
  });
  const [filters, setFilters] = useState(defaultFilters);
  const [pageNumber, setPageNumber] = useState(0);
  const [page, setPage] = useState<Page<ProductReview> | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [reviewPendingDelete, setReviewPendingDelete] = useState<ProductReview | null>(null);

  const fetchReviews = useCallback(() => {
    return Promise.all([
      crmApi.reviews({
        lang: locale,
        page: pageNumber,
        size: 20,
        status: filters.status,
        product: filters.product || undefined,
        rating: filters.rating ? Number(filters.rating) : undefined,
        hasText: filters.text === "ALL" ? undefined : filters.text === "WITH_TEXT",
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      }),
      crmApi.pendingReviewCount(),
    ]);
  }, [filters, locale, pageNumber]);

  useEffect(() => {
    let active = true;

    fetchReviews()
      .then(([nextPage, pending]) => {
        if (!active) return;
        setPage(nextPage);
        setPendingCount(pending.count);
        setLoadError(false);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchReviews]);

  const refreshReviews = useCallback(async () => {
    setLoading(true);
    try {
      const [nextPage, pending] = await fetchReviews();
      setPage(nextPage);
      setPendingCount(pending.count);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchReviews]);

  const submitFilters = (values: ReviewFilterFormValues) => {
    setLoading(true);
    setPageNumber(0);
    setFilters({
      product: values.product.trim(),
      rating: values.rating,
      text: values.text,
      status: values.status,
      dateFrom: values.dateFrom,
      dateTo: values.dateTo,
    });
  };

  const clearFilters = () => {
    setLoading(true);
    reset(defaultFilters);
    setPageNumber(0);
    setFilters(defaultFilters);
  };

  const moderate = async (review: ProductReview, action: ReviewAction) => {
    if (busyAction) return;

    const actionKey = `${review.id}:${action}`;
    setBusyAction(actionKey);

    try {
      if (action === "approve") {
        await crmApi.approveReview(review.id, locale);
      } else if (action === "reject") {
        await crmApi.rejectReview(review.id, locale);
      } else {
        await crmApi.deleteReview(review.id, locale);
      }

      notifications.success(t(`reviews.${action}Success`));
      await refreshReviews();
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("reviews.updateError")));
      } finally {
      setBusyAction(null);
    }
  };

  const confirmDeleteReview = async () => {
    if (!reviewPendingDelete) return;

    await moderate(reviewPendingDelete, "delete");
    setReviewPendingDelete(null);
  };

  return (
    <section className="crm-page">
      <Text tone="muted">{t("reviews.subtitle")}</Text>

      <div className="crm-grid crm-grid--metrics">
        <article className="crm-metric">
          <Text tone="muted" size="small">{t("reviews.newReviews")}</Text>
          <span className="crm-metric__value">{pendingCount}</span>
        </article>
      </div>

      <section className="crm-panel">
        <div className="crm-panel__header">
          <Heading as="h2" size="title">{t("reviews.filters")}</Heading>
        </div>
        <form className="crm-panel__body crm-review-filters" onSubmit={handleSubmit(submitFilters)}>
          <label className="crm-field">
            <span className="crm-label">{t("reviews.product")}</span>
            <input
              {...register("product")}
              className="crm-input"
              placeholder={t("reviews.productPlaceholder")}
            />
          </label>
          <label className="crm-field">
            <span className="crm-label">{t("reviews.rating")}</span>
            <select {...register("rating")} className="crm-select">
              <option value="">{t("common.all")}</option>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
          </label>
          <label className="crm-field">
            <span className="crm-label">{t("reviews.textFilter")}</span>
            <select {...register("text")} className="crm-select">
              <option value="ALL">{t("common.all")}</option>
              <option value="WITH_TEXT">{t("reviews.withText")}</option>
              <option value="WITHOUT_TEXT">{t("reviews.withoutText")}</option>
            </select>
          </label>
          <label className="crm-field">
            <span className="crm-label">{t("reviews.status")}</span>
            <select {...register("status")} className="crm-select">
              <option value="ALL">{t("common.all")}</option>
              {(Object.keys(messages.reviews.statuses) as ProductReviewStatus[]).map((status) => (
                <option key={status} value={status}>{messages.reviews.statuses[status]}</option>
              ))}
            </select>
          </label>
          <label className="crm-field">
            <span className="crm-label">{t("reviews.dateFrom")}</span>
            <input {...register("dateFrom")} className="crm-input" type="date" />
          </label>
          <label className="crm-field">
            <span className="crm-label">{t("reviews.dateTo")}</span>
            <input {...register("dateTo")} className="crm-input" type="date" />
          </label>
          <div className="crm-inline-actions crm-review-filters__actions">
            <Button type="submit">{t("reviews.applyFilters")}</Button>
            <Button type="button" variant="secondary" onClick={clearFilters}>
              {t("reviews.resetFilters")}
            </Button>
          </div>
        </form>
      </section>

      <section className="crm-panel">
        <div className="crm-panel__header">
          <Heading as="h2" size="title">{t("reviews.title")}</Heading>
          {page ? <Text tone="muted" size="small">{t("reviews.total")}: {page.totalElements}</Text> : null}
        </div>

        {loadError ? (
          <div className="crm-panel__body">
            <Text className="crm-form-error">{t("reviews.loadError")}</Text>
            <Button className="crm-review-retry" variant="secondary" onClick={() => void refreshReviews()}>
              {t("reviews.retry")}
            </Button>
          </div>
        ) : loading && !page ? (
          <div className="crm-panel__body"><Text tone="muted">{t("common.loading")}</Text></div>
        ) : page?.content.length ? (
          <>
            <div className="crm-table-wrap">
              <table className="crm-table crm-review-table">
                <thead>
                  <tr>
                    <th>{t("reviews.product")}</th>
                    <th>{t("reviews.rating")}</th>
                    <th>{t("reviews.review")}</th>
                    <th>{t("reviews.author")}</th>
                    <th>{t("reviews.date")}</th>
                    <th>{t("reviews.status")}</th>
                    <th>{t("reviews.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {page.content.map((review) => (
                    <tr
                      key={review.id}
                      className={cx(review.status === "PENDING" && "crm-review-row--pending")}
                    >
                      <td>
                        <Text as="span" size="small">{review.productName}</Text>
                        <Text tone="muted" size="caption">
                          {review.productModel} · {review.productSku}
                        </Text>
                      </td>
                      <td><span className="crm-review-rating">★ {review.rating}</span></td>
                      <td>
                        <Text size="small" className="crm-review-text">
                          {review.text || t("reviews.ratingOnly")}
                        </Text>
                      </td>
                      <td>
                        <Text size="small">
                          {review.authorName || messages.reviews.authorTypes[review.authorType]}
                        </Text>
                        {review.authorName ? (
                          <Text tone="muted" size="caption">
                            {messages.reviews.authorTypes[review.authorType]}
                          </Text>
                        ) : null}
                      </td>
                      <td>{new Date(review.createdAt).toLocaleDateString(locale)}</td>
                      <td>
                        <span className={cx(
                          "crm-chip",
                          review.status === "APPROVED" && "crm-chip--success",
                          (review.status === "REJECTED" || review.status === "DELETED") && "crm-chip--danger",
                          review.status === "PENDING" && "crm-chip--warning"
                        )}>
                          {messages.reviews.statuses[review.status]}
                        </span>
                      </td>
                      <td>
                        {review.status === "DELETED" ? (
                          <Text tone="muted" size="caption">{t("reviews.deletedNoActions")}</Text>
                        ) : (
                          <div className="crm-inline-actions">
                            <Button
                              variant="secondary"
                              isLoading={busyAction === `${review.id}:approve`}
                              disabled={busyAction !== null}
                              onClick={() => void moderate(review, "approve")}
                            >
                              {t("reviews.approve")}
                            </Button>
                            <Button
                              variant="secondary"
                              isLoading={busyAction === `${review.id}:reject`}
                              disabled={busyAction !== null}
                              onClick={() => void moderate(review, "reject")}
                            >
                              {t("reviews.reject")}
                            </Button>
                            <Button
                              variant="danger"
                              isLoading={busyAction === `${review.id}:delete`}
                              disabled={busyAction !== null}
                              onClick={() => setReviewPendingDelete(review)}
                            >
                              {t("reviews.delete")}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="crm-panel__body crm-review-pagination">
              <Button
                variant="secondary"
                disabled={page.first || loading}
                onClick={() => {
                  setLoading(true);
                  setPageNumber((current) => Math.max(0, current - 1));
                }}
              >
                {t("reviews.previous")}
              </Button>
              <Text tone="muted" size="small">
                {t("reviews.page")} {page.number + 1} / {Math.max(page.totalPages, 1)}
              </Text>
              <Button
                variant="secondary"
                disabled={page.last || loading}
                onClick={() => {
                  setLoading(true);
                  setPageNumber((current) => current + 1);
                }}
              >
                {t("reviews.next")}
              </Button>
            </div>
          </>
        ) : (
          <div className="crm-panel__body crm-empty">
            <Text tone="muted">{t("reviews.empty")}</Text>
          </div>
        )}
      </section>

      <ConfirmDialog
        cancelLabel={t("common.cancel")}
        closeLabel={t("common.cancel")}
        confirmLabel={t("reviews.delete")}
        isLoading={reviewPendingDelete ? busyAction === `${reviewPendingDelete.id}:delete` : false}
        open={reviewPendingDelete !== null}
        title={t("reviews.confirmDelete")}
        onConfirm={confirmDeleteReview}
        onOpenChange={(open) => {
          if (!open && !busyAction) {
            setReviewPendingDelete(null);
          }
        }}
      />
    </section>
  );
}
