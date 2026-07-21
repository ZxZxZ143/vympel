"use client";

import {useEffect, useRef, useState} from "react";
import {UserRound} from "lucide-react";
import {useTranslations} from "use-intl";

import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {Text} from "@/components/ui/shared/text";
import {cn} from "@/lib/utils";

type Props = {
    className?: string;
    iconClassName?: string;
    labelClassName?: string;
    showLabel?: boolean;
    side?: "top" | "right" | "bottom" | "left";
};

const ProfileUnavailableButton = ({
    className,
    iconClassName,
    labelClassName,
    showLabel = false,
    side = "top",
}: Props) => {
    const t = useTranslations("nav");
    const [open, setOpen] = useState(false);
    const closeTimerRef = useRef<number | null>(null);

    useEffect(() => () => {
        if (closeTimerRef.current !== null) {
            window.clearTimeout(closeTimerRef.current);
        }
    }, []);

    const showTooltip = () => {
        setOpen(true);

        if (closeTimerRef.current !== null) {
            window.clearTimeout(closeTimerRef.current);
        }

        closeTimerRef.current = window.setTimeout(() => {
            setOpen(false);
        }, 2200);
    };

    return (
        <Tooltip open={open} onOpenChange={setOpen}>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    aria-disabled="true"
                    aria-label={t("profileSoonTitle")}
                    className={cn(
                        "inline-flex items-center justify-center gap-1 rounded-sm text-text-muted transition-vympel-fast hover:text-text-heading-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40",
                        className
                    )}
                    onClick={showTooltip}
                    onTouchStart={showTooltip}
                >
                    <UserRound aria-hidden="true" className={cn("size-6", iconClassName)}/>
                    {showLabel ? (
                        <Text as="span" size="caption" className={cn("leading-none", labelClassName)}>
                            {t("profile")}
                        </Text>
                    ) : null}
                </button>
            </TooltipTrigger>
            <TooltipContent side={side} className="max-w-60">
                <Text as="span" size="caption" weight="medium" className="block text-toast-title">
                    {t("profileSoonTitle")}
                </Text>
                <Text as="span" size="caption" className="mt-1 block text-toast-description">
                    {t("profileSoonDescription")}
                </Text>
            </TooltipContent>
        </Tooltip>
    );
};

export default ProfileUnavailableButton;
