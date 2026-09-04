/* eslint-disable @next/next/no-img-element -- CRM previews render dynamic MinIO URLs. */
"use client";

import { useState } from "react";
import Link from "next/link";

import { ProductModelVariantGroup } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/useI18n";
import { Text } from "@/shared/ui/Text";
import { cx } from "@/shared/utils/cx";

export function ProductModelVariantStrip({
  currentProductId,
  group,
  compact = false,
}: {
  currentProductId: number;
  group?: ProductModelVariantGroup | null;
  compact?: boolean;
}) {
  const { t } = useI18n();

  if (!group || group.total < 2 || group.variants.length < 2) {
    return null;
  }

  return (
    <div
      className={cx("crm-model-variants", compact && "crm-model-variants--compact")}
      aria-label={`${t("products.modelFamily")}: ${group.model}`}
    >
      <Text as="span" tone="muted" size="caption" className="crm-model-variants__summary">
        {group.total} {t("products.variantsCount")}
      </Text>
      <ul className="crm-model-variants__rail">
        {group.variants.map((variant) => {
          const selected = variant.id === currentProductId;
          return (
            <li key={variant.id} className="crm-model-variants__item">
              <Link
                href={`/products/${variant.id}`}
                aria-label={`${t("products.openVariant")}: ${variant.name}`}
                aria-current={selected ? "page" : undefined}
                title={`${variant.name} · ${variant.status}`}
                className={cx(
                  "crm-model-variants__tile",
                  selected && "crm-model-variants__tile--selected"
                )}
              >
                <VariantImage imageUrl={variant.mainImage?.url}/>
              </Link>
            </li>
          );
        })}
      </ul>
      {group.truncated ? (
        <Text tone="muted" size="caption">
          {t("products.variantsLimited")}
        </Text>
      ) : null}
    </div>
  );
}

function VariantImage({ imageUrl }: { imageUrl?: string | null }) {
  const { t } = useI18n();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const validUrl = typeof imageUrl === "string" && imageUrl.trim().length > 0 && failedUrl !== imageUrl;

  return validUrl ? (
    <img src={imageUrl} alt="" onError={() => setFailedUrl(imageUrl)} />
  ) : (
    <span className="crm-model-variants__fallback" aria-hidden="true" title={t("products.photosEmpty")}>
      —
    </span>
  );
}
