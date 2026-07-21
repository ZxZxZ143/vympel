"use client";

import {CircleAlert} from "lucide-react";

import Button, {variants as buttonVariants} from "@/components/ui/shared/Button";
import {Heading} from "@/components/ui/shared/text/Heading";
import {Text} from "@/components/ui/shared/text";
import {Link} from "@/i18n/navigation";
import {cn} from "@/lib/utils";

export type ErrorStateAction = {
    label: string;
    href?: string;
    onClick?: () => void;
    ariaLabel?: string;
};

type ErrorStateProps = {
    title: string;
    description?: string;
    retryLabel?: string;
    retryAriaLabel?: string;
    onRetry?: () => void;
    action?: ErrorStateAction;
    secondaryAction?: ErrorStateAction;
    compact?: boolean;
    className?: string;
};

const ErrorState = ({
                        title,
                        description,
                        retryLabel,
                        retryAriaLabel,
                        onRetry,
                        action,
                        secondaryAction,
                        compact = false,
                        className,
                    }: ErrorStateProps) => {
    const retryAction = retryLabel
        ? {
            label: retryLabel,
            ariaLabel: retryAriaLabel,
            onClick: onRetry ?? (() => window.location.reload()),
        }
        : undefined;

    return (
        <section
            className={cn(
                "error-state",
                compact && "empty-state-compact",
                className
            )}
        >
            <div className="error-state-icon" aria-hidden="true">
                <CircleAlert className="size-9"/>
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

            {(retryAction || action || secondaryAction) ? (
                <div className="empty-state-actions">
                    {retryAction ? <StateActionButton action={retryAction} tone="primary"/> : null}
                    {action ? <StateActionButton action={action} tone={retryAction ? "secondary" : "primary"}/> : null}
                    {secondaryAction ? <StateActionButton action={secondaryAction} tone="secondary"/> : null}
                </div>
            ) : null}
        </section>
    );
};

type StateActionButtonProps = {
    action: ErrorStateAction;
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

export default ErrorState;
