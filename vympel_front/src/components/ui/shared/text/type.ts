import {cva, VariantProps} from "class-variance-authority";
import {ElementType, HTMLAttributes} from "react";

export type TextProps = {
    as?: ElementType,
    className?: string,
} & VariantProps<typeof TextVariants> & HTMLAttributes<HTMLElement>;

export const TextVariants = cva("", {
    variants: {
        colors: {
            primary: "text-text-primary",
            secondary: "text-text-secondary",
            muted: "text-text-muted",

            headingPrimary: "text-text-heading-primary",
            headingSecondary: "text-text-heading-secondary",

            inverse: "text-text-inverse",
            inverseMuted: "text-text-inverse-muted",

            placeholder: "text-text-placeholder",
            language: "text-text-language",
            productMuted: "text-text-product-muted",
            productSecondary: "text-text-product-secondary",
            connectButton: "text-connect-button-text",
            connectSide: "text-connect-side-text",

            copyright: "text-text-copyright"
        },

        size: {
            hero: "text-7xl",
            h1: "text-6xl",
            h1xl: "text-5xl",
            h2: "text-4xl",
            h3: "text-3xl",
            h4: "text-2xl",
            h5: "text-xl",
            h6: "text-lg",

            bodyXl: "text-md",
            bodyLg: "text-base",
            bodyMd: "text-sm",
            bodySm: "text-xs",
            bodyXs: "text-2xs",
            productTitle: "text-product-title",
            productMeta: "text-product-meta",

            caption: "text-3xs",
            label: "text-4xs",
            hint: "text-5xs",
            micro: "text-6xs",
            tiny: "text-7xs",
        },

        font: {
            sans: "font-sans",       // Inter
            heading: "font-heading", // Montaga
            footer: "font-footer",
            mono: "font-mono",       // Judson
        },

        weight: {
            light: "font-light",
            regular: "font-normal",   // 400
            medium: "font-medium",    // 500
            semibold: "font-semibold",// 600
            bold: "font-bold",        // 700
        },
    },

    defaultVariants: {
        colors: "primary",
        size: "bodyMd",
        font: "sans",
        weight: "regular",
    },
});
