import React, {FC, HTMLAttributes, PropsWithChildren} from 'react';
import {TextVariants} from "@/components/ui/shared/text/type";
import {cn} from "@/lib/utils";
import {VariantProps} from "class-variance-authority";

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type HeadingProps = {
    as?: HeadingLevel;
    className?: string;
} & VariantProps<typeof TextVariants> &
    HTMLAttributes<HTMLHeadingElement>;

export const Heading: FC<PropsWithChildren<HeadingProps>> = ({
                                                                 as = "h2",
                                                                 className,
                                                                 children,

                                                                 colors = "headingPrimary",
                                                                 size,
                                                                 weight = "regular",
                                                                 font = "sans",

                                                                 ...props
                                                             }) => {
    const Tag = as;

    const defaultSizeByTag: Record<HeadingLevel, NonNullable<HeadingProps["size"]>> = {
        h1: "h1",
        h2: "h2",
        h3: "h3",
        h4: "h4",
        h5: "h5",
        h6: "h6",
    };

    return (
        <Tag
            className={cn(
                TextVariants({
                    colors,
                    size: size ?? defaultSizeByTag[as],
                    weight,
                    font,
                }),
                className
            )}
            {...props}
        >
            {children}
        </Tag>
    );
};

export const Index: FC<PropsWithChildren<Omit<HeadingProps, "as">>> = (props) => (
    <Heading as="h1" {...props} />
);

export const H2: FC<PropsWithChildren<Omit<HeadingProps, "as">>> = (props) => (
    <Heading as="h2" {...props} />
);

export const H3: FC<PropsWithChildren<Omit<HeadingProps, "as">>> = (props) => (
    <Heading as="h3" {...props} />
);

export const H4: FC<PropsWithChildren<Omit<HeadingProps, "as">>> = (props) => (
    <Heading as="h4" {...props} />
);

export const H5: FC<PropsWithChildren<Omit<HeadingProps, "as">>> = (props) => (
    <Heading as="h5" {...props} />
);

export const H6: FC<PropsWithChildren<Omit<HeadingProps, "as">>> = (props) => (
    <Heading as="h6" {...props} />
);