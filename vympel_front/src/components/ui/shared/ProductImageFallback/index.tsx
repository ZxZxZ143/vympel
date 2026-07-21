"use client";

import {ImageOff} from "lucide-react";
import {useTranslations} from "use-intl";

import {Text} from "@/components/ui/shared/text";
import {cn} from "@/lib/utils";

type ProductImageFallbackProps = {
    className?: string;
    compact?: boolean;
};

const ProductImageFallback = ({className, compact = false}: ProductImageFallbackProps) => {
    const t = useTranslations("productImageFallback");

    return (
        <div
            aria-label={t("label")}
            className={cn(
                "product-image-fallback",
                compact && "product-image-fallback--compact",
                className
            )}
        >
            <span className="product-image-fallback__icon" aria-hidden="true">
                <ImageOff className={compact ? "size-4" : "size-7"}/>
            </span>
            <Text
                as="span"
                size={compact ? "tiny" : "bodySm"}
                colors="muted"
                weight="medium"
                className="text-center leading-tight"
            >
                {t("label")}
            </Text>
        </div>
    );
};

export default ProductImageFallback;
