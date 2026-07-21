"use client";

import SmartSearch, {type SmartSearchVariant} from "@/components/ui/shared/SmartSearch";

type Props = {
    className?: string;
    mobileIconOnly?: boolean;
    variant?: Extract<SmartSearchVariant, "catalog" | "product">;
};

const ProductSearchForm = ({className, mobileIconOnly = false, variant = "product"}: Props) => (
    <SmartSearch className={className} mobileIconOnly={mobileIconOnly} variant={variant}/>
);

export default ProductSearchForm;
