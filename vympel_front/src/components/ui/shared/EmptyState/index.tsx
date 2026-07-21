"use client";

import {Heart, PackageSearch, SearchX, ShoppingBag, Store, TimerReset} from "lucide-react";

import Button, {variants as buttonVariants} from "@/components/ui/shared/Button";
import {Heading} from "@/components/ui/shared/text/Heading";
import {Text} from "@/components/ui/shared/text";
import {Link} from "@/i18n/navigation";
import {cn} from "@/lib/utils";

export type StateAction = {
    label: string;
    href?: string;
    onClick?: () => void;
    ariaLabel?: string;
};

type EmptyStateVisual = "catalog" | "favorites" | "cart" | "similar" | "product" | "notFound" | "generic";

type EmptyStateProps = {
    title: string;
    description?: string;
    action?: StateAction;
    secondaryAction?: StateAction;
    visual?: EmptyStateVisual;
    compact?: boolean;
    className?: string;
};

const visualIcons = {
    catalog: SearchX,
    favorites: Heart,
    cart: ShoppingBag,
    similar: PackageSearch,
    product: Store,
    notFound: TimerReset,
    generic: PackageSearch,
};

const EmptyState = ({
                        title,
                        description,
                        action,
                        secondaryAction,
                        visual = "generic",
                        compact = false,
                        className,
                    }: EmptyStateProps) => {
    const Icon = visualIcons[visual];

    return (
        <section
            className={cn(
                "empty-state",
                compact && "empty-state-compact",
                className
            )}
        >
            <div className="empty-state-icon" aria-hidden="true">
                <Icon className="size-9"/>
            </div>

            <div className="flex max-w-172 flex-col items-center gap-4 text-center">
                <Heading
                    as="h2"
                    size={compact ? "h5" : "h2"}
                    weight="regular"
                    colors="headingPrimary"
                    className="leading-tight"
                >
                    {title}
                </Heading>

                {description ? (
                    <Text
                        size={compact ? "bodyMd" : "bodyLg"}
                        colors="muted"
                        className="max-w-150 leading-8"
                    >
                        {description}
                    </Text>
                ) : null}
            </div>

            {(action || secondaryAction) ? (
                <div className="empty-state-actions">
                    {action ? <StateActionButton action={action} tone="primary"/> : null}
                    {secondaryAction ? <StateActionButton action={secondaryAction} tone="secondary"/> : null}
                </div>
            ) : null}
        </section>
    );
};

type StateActionButtonProps = {
    action: StateAction;
    tone: "primary" | "secondary";
};

const StateActionButton = ({action, tone}: StateActionButtonProps) => {
    const variant = tone === "primary" ? "action" : "default";
    const textColor = tone === "primary" ? "inverse" : "headingSecondary";

    if (action.href) {
        return (
            <Link
                href={action.href}
                aria-label={action.ariaLabel}
                className={buttonVariants({variant, size: "md"})}
            >
                <Text as="span" colors={textColor} size="bodySm" weight="medium" className="leading-none">
                    {action.label}
                </Text>
            </Link>
        );
    }

    return (
        <Button
            variant={variant}
            size="md"
            onClick={action.onClick}
            aria-label={action.ariaLabel}
        >
            <Text as="span" colors={textColor} size="bodySm" weight="medium" className="leading-none">
                {action.label}
            </Text>
        </Button>
    );
};

export default EmptyState;
