"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { crmApi } from "@/shared/api/client";
import { getCrmErrorMessage } from "@/shared/api/errors";
import { CustomerRequest, CustomerRequestStatus, Page } from "@/shared/api/types";
import { useNotifications } from "@/shared/feedback/NotificationProvider";
import { useI18n } from "@/shared/i18n/useI18n";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Heading } from "@/shared/ui/Heading";
import { Text } from "@/shared/ui/Text";
import { cx } from "@/shared/utils/cx";

type RequestFilterFormValues = {
  search: string;
  status: CustomerRequestStatus | "ALL";
};

type RequestDetailFormValues = {
  status: CustomerRequestStatus;
  adminComment: string;
};

const defaultFilters: RequestFilterFormValues = {
  search: "",
  status: "NEW",
};

function formatDate(value: string | null, locale: string, fallback: string) {
  if (!value) return fallback;
  return new Date(value).toLocaleString(locale);
}

function getStatusChip(status: CustomerRequestStatus) {
  return cx(
    "crm-chip",
    status === "DONE" && "crm-chip--success",
    status === "NEW" && "crm-chip--warning",
    status === "CANCELLED" && "crm-chip--danger"
  );
}

export function RequestProcessingView() {
  const { locale, messages, t } = useI18n();
  const notifications = useNotifications();
  const { handleSubmit, register, reset } = useForm<RequestFilterFormValues>({
    defaultValues: defaultFilters,
  });
  const detailForm = useForm<RequestDetailFormValues>({
    defaultValues: {
      status: "NEW",
      adminComment: "",
    },
  });

  const [filters, setFilters] = useState(defaultFilters);
  const [pageNumber, setPageNumber] = useState(0);
  const [page, setPage] = useState<Page<CustomerRequest> | null>(null);
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CustomerRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const statuses = Object.keys(messages.requests.statuses) as CustomerRequestStatus[];

  const fetchRequests = useCallback(() => {
    return Promise.all([
      crmApi.requests({
        page: pageNumber,
        size: 20,
        status: filters.status,
        search: filters.search || undefined,
      }),
      crmApi.newRequestCount(),
    ]);
  }, [filters, pageNumber]);

  useEffect(() => {
    let active = true;

    fetchRequests()
      .then(([nextPage, count]) => {
        if (!active) return;
        setPage(nextPage);
        setNewCount(count.count);
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
  }, [fetchRequests]);

  const refreshRequests = useCallback(async () => {
    setLoading(true);
    try {
      const [nextPage, count] = await fetchRequests();
      setPage(nextPage);
      setNewCount(count.count);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchRequests]);

  const submitFilters = (values: RequestFilterFormValues) => {
    setLoading(true);
    setPageNumber(0);
    setFilters({
      search: values.search.trim(),
      status: values.status,
    });
  };

  const clearFilters = () => {
    setLoading(true);
    reset(defaultFilters);
    setPageNumber(0);
    setFilters(defaultFilters);
  };

  const syncSelectedRequest = (request: CustomerRequest) => {
    setSelectedRequest(request);
    detailForm.reset({
      status: request.status,
      adminComment: request.adminComment ?? "",
    });
  };

  const replaceRequest = (request: CustomerRequest) => {
    syncSelectedRequest(request);
    setPage((current) =>
      current
        ? {
            ...current,
            content: current.content.map((item) => (item.id === request.id ? request : item)),
          }
        : current
    );
  };

  const openDetails = async (requestId: number) => {
    setDetailLoading(true);
    setDetailError(false);
    try {
      const request = await crmApi.request(requestId);
      syncSelectedRequest(request);
    } catch {
      setDetailError(true);
      notifications.error(t("requests.detailLoadError"));
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (statusOverride?: CustomerRequestStatus) => {
    if (!selectedRequest || busyAction) return;

    const nextStatus = statusOverride ?? detailForm.getValues("status");
    const actionKey = statusOverride ? `status:${selectedRequest.id}:${nextStatus}` : `status:${selectedRequest.id}`;
    setBusyAction(actionKey);

    try {
      const request = await crmApi.updateRequestStatus(selectedRequest.id, nextStatus);
      replaceRequest(request);
      notifications.success(t("requests.statusUpdated"));
      await refreshRequests();
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("requests.updateError")));
    } finally {
      setBusyAction(null);
    }
  };

  const saveComment = async () => {
    if (!selectedRequest || busyAction) return;

    setBusyAction(`comment:${selectedRequest.id}`);

    try {
      const adminComment = detailForm.getValues("adminComment").trim();
      const request = await crmApi.updateRequestComment(selectedRequest.id, adminComment || null);
      replaceRequest(request);
      notifications.success(t("requests.commentSaved"));
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("requests.updateError")));
    } finally {
      setBusyAction(null);
    }
  };

  const cancelRequest = async () => {
    if (!selectedRequest || busyAction) return;

    setBusyAction(`cancel:${selectedRequest.id}`);

    try {
      const request = await crmApi.cancelRequest(selectedRequest.id);
      replaceRequest(request);
      notifications.success(t("requests.cancelled"));
      await refreshRequests();
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("requests.updateError")));
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <section className="crm-page">
      <Text tone="muted">{t("requests.subtitle")}</Text>

      <div className="crm-grid crm-grid--metrics">
        <article className="crm-metric">
          <Text tone="muted" size="small">{t("requests.newRequests")}</Text>
          <span className="crm-metric__value">{newCount}</span>
        </article>
      </div>

      <section className="crm-panel">
        <div className="crm-panel__header">
          <Heading as="h2" size="title">{t("requests.filters")}</Heading>
        </div>
        <form className="crm-panel__body crm-request-filters" onSubmit={handleSubmit(submitFilters)}>
          <label className="crm-field">
            <span className="crm-label">{t("requests.search")}</span>
            <input
              {...register("search")}
              className="crm-input"
              placeholder={t("requests.searchPlaceholder")}
            />
          </label>
          <label className="crm-field">
            <span className="crm-label">{t("requests.status")}</span>
            <select {...register("status")} className="crm-select">
              <option value="ALL">{t("common.all")}</option>
              {statuses.map((status) => (
                <option key={status} value={status}>{messages.requests.statuses[status]}</option>
              ))}
            </select>
          </label>
          <div className="crm-inline-actions crm-request-filters__actions">
            <Button type="submit">{t("requests.applyFilters")}</Button>
            <Button type="button" variant="secondary" onClick={clearFilters}>
              {t("requests.resetFilters")}
            </Button>
          </div>
        </form>
      </section>

      <div className="crm-request-layout">
        <section className="crm-panel">
          <div className="crm-panel__header">
            <Heading as="h2" size="title">{t("requests.title")}</Heading>
            {page ? <Text tone="muted" size="small">{t("requests.total")}: {page.totalElements}</Text> : null}
          </div>

          {loadError ? (
            <div className="crm-panel__body">
              <Text className="crm-form-error">{t("requests.loadError")}</Text>
              <Button className="crm-request-retry" variant="secondary" onClick={() => void refreshRequests()}>
                {t("requests.retry")}
              </Button>
            </div>
          ) : loading && !page ? (
            <div className="crm-panel__body"><Text tone="muted">{t("common.loading")}</Text></div>
          ) : page?.content.length ? (
            <>
              <div className="crm-table-wrap">
                <table className="crm-table crm-request-table">
                  <thead>
                    <tr>
                      <th>{t("requests.contact")}</th>
                      <th>{t("requests.message")}</th>
                      <th>{t("requests.source")}</th>
                      <th>{t("requests.createdAt")}</th>
                      <th>{t("requests.status")}</th>
                      <th>{t("requests.processed")}</th>
                      <th>{t("requests.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.content.map((request) => (
                      <tr
                        key={request.id}
                        className={cx(request.status === "NEW" && "crm-request-row--new")}
                      >
                        <td>
                          <div className="crm-request-contact">
                            <Text as="span" size="small">{request.name || t("requests.noName")}</Text>
                            {request.email ? <Text tone="muted" size="caption">{request.email}</Text> : null}
                            {request.phone ? <Text tone="muted" size="caption">{request.phone}</Text> : null}
                            {!request.email && !request.phone ? (
                              <Text tone="muted" size="caption">{t("requests.noContact")}</Text>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <Text size="small" className="crm-request-message">
                            {request.message || t("requests.noMessage")}
                          </Text>
                        </td>
                        <td>{request.source || t("requests.noSource")}</td>
                        <td>{formatDate(request.createdAt, locale, "")}</td>
                        <td>
                          <span className={getStatusChip(request.status)}>
                            {messages.requests.statuses[request.status]}
                          </span>
                        </td>
                        <td>
                          <Text size="small">
                            {request.processedBy || t("requests.notProcessed")}
                          </Text>
                          {request.processedAt ? (
                            <Text tone="muted" size="caption">
                              {formatDate(request.processedAt, locale, "")}
                            </Text>
                          ) : null}
                        </td>
                        <td>
                          <Button
                            variant="secondary"
                            isLoading={detailLoading && selectedRequest?.id === request.id}
                            disabled={detailLoading}
                            onClick={() => void openDetails(request.id)}
                          >
                            {t("requests.openDetails")}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="crm-panel__body crm-request-pagination">
                <Button
                  variant="secondary"
                  disabled={page.first || loading}
                  onClick={() => {
                    setLoading(true);
                    setPageNumber((current) => Math.max(0, current - 1));
                  }}
                >
                  {t("requests.previous")}
                </Button>
                <Text tone="muted" size="small">
                  {t("requests.page")} {page.number + 1} / {Math.max(page.totalPages, 1)}
                </Text>
                <Button
                  variant="secondary"
                  disabled={page.last || loading}
                  onClick={() => {
                    setLoading(true);
                    setPageNumber((current) => current + 1);
                  }}
                >
                  {t("requests.next")}
                </Button>
              </div>
            </>
          ) : (
            <div className="crm-panel__body crm-empty">
              <Text tone="muted">{t("requests.empty")}</Text>
            </div>
          )}
        </section>

        <section className="crm-panel crm-request-details">
          <div className="crm-panel__header">
            <Heading as="h2" size="title">{t("requests.details")}</Heading>
          </div>
          <div className="crm-panel__body">
            {detailError ? (
              <Text className="crm-form-error">{t("requests.detailLoadError")}</Text>
            ) : !selectedRequest ? (
              <Text tone="muted">{t("requests.selectRequest")}</Text>
            ) : (
              <div className="crm-request-detail-grid">
                <div className="crm-request-detail-block">
                  <Text tone="muted" size="caption">{t("requests.contact")}</Text>
                  <Text>{selectedRequest.name || t("requests.noName")}</Text>
                  {selectedRequest.email ? <Text tone="muted" size="small">{selectedRequest.email}</Text> : null}
                  {selectedRequest.phone ? <Text tone="muted" size="small">{selectedRequest.phone}</Text> : null}
                </div>
                <div className="crm-request-detail-block">
                  <Text tone="muted" size="caption">{t("requests.createdAt")}</Text>
                  <Text>{formatDate(selectedRequest.createdAt, locale, "")}</Text>
                </div>
                <div className="crm-request-detail-block">
                  <Text tone="muted" size="caption">{t("requests.source")}</Text>
                  <Text>{selectedRequest.source || t("requests.noSource")}</Text>
                </div>
                <div className="crm-request-detail-block">
                  <Text tone="muted" size="caption">{t("requests.message")}</Text>
                  <Text className="crm-request-message">{selectedRequest.message || t("requests.noMessage")}</Text>
                </div>
                <div className="crm-request-detail-block">
                  <Text tone="muted" size="caption">{t("requests.processed")}</Text>
                  <Text>{selectedRequest.processedBy || t("requests.notProcessed")}</Text>
                  {selectedRequest.processedAt ? (
                    <Text tone="muted" size="small">
                      {formatDate(selectedRequest.processedAt, locale, "")}
                    </Text>
                  ) : null}
                </div>

                <label className="crm-field">
                  <span className="crm-label">{t("requests.status")}</span>
                  <select {...detailForm.register("status")} className="crm-select">
                    {statuses.map((status) => (
                      <option key={status} value={status}>{messages.requests.statuses[status]}</option>
                    ))}
                  </select>
                </label>
                <div className="crm-inline-actions crm-request-detail-actions">
                  <Button
                    isLoading={busyAction === `status:${selectedRequest.id}`}
                    disabled={busyAction !== null}
                    onClick={() => void updateStatus()}
                  >
                    {t("requests.saveStatus")}
                  </Button>
                  <Button
                    variant="secondary"
                    isLoading={busyAction === `status:${selectedRequest.id}:DONE`}
                    disabled={busyAction !== null}
                    onClick={() => void updateStatus("DONE")}
                  >
                    {t("requests.markDone")}
                  </Button>
                  <Button
                    variant="danger"
                    isLoading={busyAction === `cancel:${selectedRequest.id}`}
                    disabled={busyAction !== null || selectedRequest.status === "CANCELLED"}
                    onClick={() => setCancelConfirmOpen(true)}
                  >
                    {t("requests.cancelRequest")}
                  </Button>
                </div>
                <label className="crm-field">
                  <span className="crm-label">{t("requests.adminComment")}</span>
                  <textarea
                    {...detailForm.register("adminComment")}
                    className="crm-textarea crm-request-comment"
                  />
                </label>
                <Button
                  className="crm-request-save-comment"
                  isLoading={busyAction === `comment:${selectedRequest.id}`}
                  disabled={busyAction !== null}
                  onClick={() => void saveComment()}
                >
                  {t("requests.saveComment")}
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        cancelLabel={t("common.cancel")}
        closeLabel={t("common.cancel")}
        confirmLabel={t("requests.cancelRequest")}
        isLoading={selectedRequest ? busyAction === `cancel:${selectedRequest.id}` : false}
        open={cancelConfirmOpen}
        title={t("requests.confirmCancel")}
        onConfirm={async () => {
          await cancelRequest();
          setCancelConfirmOpen(false);
        }}
        onOpenChange={(open) => {
          if (!open && !busyAction) {
            setCancelConfirmOpen(false);
          }
        }}
      />
    </section>
  );
}
