"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { crmApi } from "@/shared/api/client";
import { getCrmErrorMessage } from "@/shared/api/errors";
import { Page, Product, ProductStatus } from "@/shared/api/types";
import { useNotifications } from "@/shared/feedback/NotificationProvider";
import { useI18n } from "@/shared/i18n/useI18n";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { subscribeToProductListChanges } from "@/features/products/productListRefresh";

type ProductSearchFormValues = {
  search: string;
};

const PAGE_SIZE = 12;

type ProductQuickEditFormValues = {
  price: string;
  stock: string;
};

export function ProductListView() {
  const { locale, t, messages } = useI18n();
  const notifications = useNotifications();
  const [page, setPage] = useState<Page<Product> | null>(null);
  const { handleSubmit, register } = useForm<ProductSearchFormValues>({
    defaultValues: {
      search: "",
    },
  });
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const nextPage = await crmApi.products({
        lang: locale,
        page: pageIndex,
        size: PAGE_SIZE,
        search: submittedSearch,
        status,
      });
      setPage(nextPage);
      setError(false);
    } catch {
      setError(true);
      notifications.error(t("products.listRefreshError"));
    }
  }, [locale, notifications, pageIndex, status, submittedSearch, t]);

  useEffect(() => {
    let alive = true;

    crmApi
      .products({
        lang: locale,
        page: pageIndex,
        size: PAGE_SIZE,
        search: submittedSearch,
        status,
      })
      .then((nextPage) => {
        if (alive) {
          setPage(nextPage);
          setError(false);
        }
      })
      .catch(() => {
        if (alive) {
          setError(true);
          notifications.error(t("products.listRefreshError"));
        }
      });

    return () => {
      alive = false;
    };
  }, [locale, notifications, pageIndex, status, submittedSearch, t]);

  useEffect(
    () => subscribeToProductListChanges(() => {
      void loadProducts();
    }),
    [loadProducts]
  );

  const submitSearch = (values: ProductSearchFormValues) => {
    setPageIndex(0);
    setSubmittedSearch(values.search.trim());
  };

  const changeStatus = (nextStatus: string) => {
    setPageIndex(0);
    setStatus(nextStatus as ProductStatus | "");
  };

  const replaceProduct = (product: Product) => {
    setPage((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        content: current.content.map((item) => (item.id === product.id ? product : item)),
      };
    });
  };

  if (error) {
    return <Text className="crm-form-error">{t("common.error")}</Text>;
  }

  return (
    <section className="crm-page">
      <Text tone="muted">{t("products.subtitle")}</Text>

      <section className="crm-panel">
        <div className="crm-panel__header">
          <form className="crm-product-list-controls" onSubmit={handleSubmit(submitSearch)}>
            <div className="crm-inline-actions">
              <input
                {...register("search")}
                className="crm-input"
                aria-label={t("common.search")}
                placeholder={t("products.searchPlaceholder")}
              />
              <select
                className="crm-select"
                aria-label={t("products.status")}
                value={status}
                onChange={(event) => changeStatus(event.target.value)}
              >
                <option value="">{t("products.allStatuses")}</option>
                <option value="ACTIVE">{messages.products.statuses.ACTIVE}</option>
                <option value="DRAFT">{messages.products.statuses.DRAFT}</option>
                <option value="ARCHIVED">{messages.products.statuses.ARCHIVED}</option>
              </select>
              <Button type="submit" variant="secondary">
                {t("common.search")}
              </Button>
            </div>
          </form>
          <div className="crm-inline-actions">
            <Link href="/products/new">
              <Button>{t("products.addProduct")}</Button>
            </Link>
            <Link href="/products/bulk">
              <Button variant="secondary">{t("products.bulkAddProduct")}</Button>
            </Link>
          </div>
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
                  <th>{t("products.name")}</th>
                  <th>{t("products.model")}</th>
                  <th>{t("products.price")}</th>
                  <th>{t("products.stockQuantity")}</th>
                  <th>{t("products.status")}</th>
                  <th>{t("products.kaspi")}</th>
                  <th>{t("products.wildberries")}</th>
                  <th>{t("common.edit")}</th>
                </tr>
              </thead>
              <tbody>
                {page.content.map((product) => (
                  <ProductRow
                    key={`${product.id}-${product.price}-${product.stockQuantity}`}
                    product={product}
                    locale={locale}
                    statusLabel={messages.products.statuses[product.status] ?? product.status}
                    onProductChange={replaceProduct}
                    onProductsRefresh={loadProducts}
                    t={t}
                  />
                ))}
              </tbody>
            </table>
            <div className="crm-pagination">
              <Text tone="muted" size="caption">
                {t("products.found")}: {page.totalElements}. {t("products.page")} {page.number + 1} {t("products.of")} {Math.max(page.totalPages, 1)}
              </Text>
              <div className="crm-inline-actions">
                <Button
                  variant="secondary"
                  disabled={page.first}
                  onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
                >
                  {t("products.previous")}
                </Button>
                <Button
                  variant="secondary"
                  disabled={page.last}
                  onClick={() => setPageIndex((current) => current + 1)}
                >
                  {t("products.next")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}

function ProductRow({
  product,
  locale,
  statusLabel,
  onProductChange,
  onProductsRefresh,
  t,
}: {
  product: Product;
  locale: string;
  statusLabel: string;
  onProductChange: (product: Product) => void;
  onProductsRefresh: () => Promise<void>;
  t: (key: string) => string;
}) {
  const notifications = useNotifications();
  const { getValues, register, reset, setValue } = useForm<ProductQuickEditFormValues>({
    defaultValues: {
      price: toInputValue(product.price),
      stock: toInputValue(product.stockQuantity),
    },
  });
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    reset({
      price: toInputValue(product.price),
      stock: toInputValue(product.stockQuantity),
    });
  }, [product.id, product.price, product.stockQuantity, reset]);

  const updatePrice = async () => {
    if (busy) {
      return;
    }

    const nextPrice = parseNonNegativeInteger(getValues("price"));
    if (nextPrice === null) {
      notifications.error(t("products.priceError"));
      return;
    }

    setBusy("price");
    try {
      const nextProduct = await crmApi.updatePrice(product.id, nextPrice, locale);
      setValue("price", toInputValue(nextProduct.price));
      onProductChange(nextProduct);
      await onProductsRefresh();
      notifications.success(t("products.priceUpdated"));
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("products.priceUpdateError")));
    } finally {
      setBusy(null);
    }
  };

  const updateStock = async () => {
    if (busy) {
      return;
    }

    const nextStock = parseNonNegativeInteger(getValues("stock"));
    if (nextStock === null) {
      notifications.error(t("products.stockError"));
      return;
    }

    setBusy("stock");
    try {
      const nextProduct = await crmApi.updateStock(product.id, nextStock, locale);
      setValue("stock", toInputValue(nextProduct.stockQuantity));
      onProductChange(nextProduct);
      await onProductsRefresh();
      notifications.success(t("products.stockUpdated"));
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("products.stockUpdateError")));
    } finally {
      setBusy(null);
    }
  };

  const archive = async () => {
    if (busy) {
      return;
    }

    setBusy("archive");
    try {
      const nextProduct = await crmApi.archiveProduct(product.id, locale);
      onProductChange(nextProduct);
      await onProductsRefresh();
      notifications.success(t("products.archived"));
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("products.archiveError")));
    } finally {
      setBusy(null);
    }
  };

  return (
    <tr>
      <td>
        <Text as="span" size="small">
          {product.name}
        </Text>
        <Text tone="muted" size="caption">
          {product.sku}
        </Text>
      </td>
      <td>{product.model}</td>
      <td>
        <div className="crm-inline-actions">
          <input {...register("price")} className="crm-input" type="number" min="0" disabled={busy !== null} />
          <Button variant="secondary" isLoading={busy === "price"} disabled={busy !== null && busy !== "price"} onClick={updatePrice}>
            {t("products.quickSave")}
          </Button>
        </div>
      </td>
      <td>
        <div className="crm-inline-actions">
          <input {...register("stock")} className="crm-input" type="number" min="0" disabled={busy !== null} />
          <Button variant="secondary" isLoading={busy === "stock"} disabled={busy !== null && busy !== "stock"} onClick={updateStock}>
            {t("products.quickSave")}
          </Button>
        </div>
      </td>
      <td>
        <span className="crm-chip">{statusLabel}</span>
      </td>
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
      <td>
        <div className="crm-inline-actions">
          <Link href={`/products/${product.id}`}>
            <Button variant="secondary">{t("common.edit")}</Button>
          </Link>
          <Button variant="danger" isLoading={busy === "archive"} disabled={busy !== null && busy !== "archive"} onClick={archive}>
            {t("common.delete")}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function toInputValue(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function parseNonNegativeInteger(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}
