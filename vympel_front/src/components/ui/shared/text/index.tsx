import React, { FC, PropsWithChildren, HTMLAttributes, ElementType } from "react";
import { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {TextVariants} from "@/components/ui/shared/text/type";

export type TextProps = {
    as?: ElementType;
    className?: string;
} & VariantProps<typeof TextVariants> &
    HTMLAttributes<HTMLElement>;

export const Text: FC<PropsWithChildren<TextProps>> = ({
                                                           as: Component = "p",
                                                           className,
                                                           children,

                                                           colors,
                                                           size,
                                                           font,
                                                           weight,

                                                           ...props
                                                       }) => {
    return (
        <Component
            className={cn(
                TextVariants({
                    colors,
                    size,
                    font,
                    weight,
                }),
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
};
