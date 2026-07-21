import React, { FC } from "react";
import { cn } from "@/lib/utils";

type LoaderProps = {
    className?: string;
    size?: "sm" | "md" | "lg";
};

const sizeMap = {
    sm: "h-4 w-4 border-2",
    md: "h-5 w-5 border-2",
    lg: "h-6 w-6 border-2",
};

const Loader: FC<LoaderProps> = ({ className, size = "md" }) => {
    return (
        <span
            className={cn(
                "inline-block animate-spin rounded-full border-current border-t-transparent",
                sizeMap[size],
                className
            )}
        />
    );
};

export default Loader;
