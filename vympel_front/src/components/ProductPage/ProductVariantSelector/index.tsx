"use client";

import {useState} from "react";
import Image from "next/image";
import {useTranslations} from "use-intl";

import {IProductModelVariantGroup} from "@/api/types/ProductTypes";
import {routes} from "@/config/routes";
import {Link} from "@/i18n/navigation";
import {cn} from "@/lib/utils";
import ProductImageFallback from "@/components/ui/shared/ProductImageFallback";
import {Text} from "@/components/ui/shared/text";

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
                                    "relative flex size-15 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-primary-bg p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                                    selected
                                        ? "border-black ring-1 ring-black"
                                        : "border-border-default hover:border-black/60"
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
        <Image
            src={imageUrl}
            alt=""
            fill
            unoptimized
            sizes="60px"
            className="object-contain"
            onError={() => setFailedUrl(imageUrl)}
        />
    ) : (
        <ProductImageFallback compact className="size-full border-0"/>
    );
};

export default ProductVariantSelector;
