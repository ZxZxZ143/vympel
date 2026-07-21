import {Star} from "lucide-react";

import {cn} from "@/lib/utils";

type Props = {
    value: number;
    ariaLabel: string;
    className?: string;
    starClassName?: string;
};

const RatingStars = ({value, ariaLabel, className, starClassName}: Props) => {
    const filledStars = Math.round(Math.max(0, Math.min(value, 5)));

    return (
        <span
            role="img"
            aria-label={ariaLabel}
            className={cn("inline-flex items-center gap-1 text-text-product-secondary", className)}
        >
            {Array.from({length: 5}, (_, index) => (
                <Star
                    key={index}
                    aria-hidden="true"
                    className={cn(
                        "size-4",
                        index < filledStars ? "fill-current" : "text-border-default",
                        starClassName
                    )}
                />
            ))}
        </span>
    );
};

export default RatingStars;
