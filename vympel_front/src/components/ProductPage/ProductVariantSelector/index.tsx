"use client";

import {useState} from "react";
import {useTranslations} from "use-intl";

import {IProductModelVariantGroup} from "@/api/types/ProductTypes";
import {routes} from "@/config/routes";
import {Link} from "@/i18n/navigation";
import {cn} from "@/lib/utils";
import ProductImageFallback from "@/components/ui/shared/ProductImageFallback";
import ResponsiveProductImage from "@/components/ui/shared/ResponsiveProductImage";
import {Text} from "@/components/ui/shared/text";

// 60px tiles: a 320px ceiling covers DPR 3; DPR 1-2 select the 160px derivative.
const VARIANT_TILE_SIZES = "60px";
const VARIANT_TILE_MAXIMUM_WIDTH = 320;

type Props = {
    currentProductId: number;
    group?: IProductModelVariantGroup | null;
};

const ProductVariantSelector = ({currentProductId, group}: Props) => {
    const t = useTranslations("product.variants");

    if (!group || group.total < 2 || group.variants.length < 2) {
        return null;
    }

    return (
        <section className="mt-5 min-w-0" aria-label={t("groupAria", {model: group.model})}>
            <Text as="span" size="bodySm" colors="productMuted" weight="medium">
                {t("label")}
            </Text>
            <ul
                className="variant-selector-scroll mt-3 flex max-w-full list-none gap-3 overflow-x-auto p-0 pb-2"
            >
                {group.variants.map((variant) => {
                    const selected = variant.id === currentProductId;
                    return (
                        <li key={variant.id} className="shrink-0">
                            <Link
                                href={routes.product(variant.id)}
                                aria-label={t("optionAria", {name: variant.name})}
                                aria-current={selected ? "page" : undefined}
                                className={cn(
                                    "product-variant-tile relative flex size-15 shrink-0 items-center justify-center overflow-hidden bg-primary-bg p-1 focus:outline-none",
                                    selected && "product-variant-tile--selected"
                                )}
                            >
                                <VariantImage imageUrl={variant.mainImage?.url}/>
                            </Link>
                        </li>
                    );
                })}
            </ul>
            {group.truncated ? (
                <Text size="tiny" colors="muted" className="mt-1">
                    {t("limited", {shown: group.variants.length, total: group.total})}
                </Text>
            ) : null}
        </section>
    );
};

const VariantImage = ({imageUrl}: {imageUrl?: string | null}) => {
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const validUrl = typeof imageUrl === "string" && imageUrl.trim().length > 0 && failedUrl !== imageUrl;

    return validUrl ? (
        <ResponsiveProductImage
            src={imageUrl}
            alt=""
            sizes={VARIANT_TILE_SIZES}
            maximumWidth={VARIANT_TILE_MAXIMUM_WIDTH}
            className="absolute inset-0 size-full object-contain text-transparent"
            onError={() => setFailedUrl(imageUrl)}
        />
    ) : (
        <ProductImageFallback compact className="size-full border-0"/>
    );
};

export default ProductVariantSelector;
