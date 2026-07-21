"use client"

import React, { FC, PropsWithChildren, useId } from "react"
import {H2} from "@/components/ui/shared/text/Heading"
import { useTranslations } from "use-intl"
import { Text } from "@/components/ui/shared/text"
import { cn } from "@/lib/utils"
import ArrowRight from "@/assets/icons/ArrowRight"
import ProgressLink from "@/components/ui/shared/ProgressLink";

type Props = {
    link?: string
    className?: string

    headingId?: string
}

const Title: FC<PropsWithChildren<Props>> = ({ link, children, className, headingId }) => {
    const t = useTranslations("title")
    const moreLabel = t("more")

    const autoId = useId()
    const id = headingId ?? `section-title-${autoId}`

    const titleText = typeof children === "string" ? children : ""
    const moreAria = titleText ? `${moreLabel}: ${titleText}` : moreLabel

    const isExternal = typeof link === "string" && /^https?:\/\//i.test(link)

    return (
        <header className={cn("flex w-full flex-wrap items-center justify-between gap-4", className)}>
            <H2 id={id} size="h4" font="mono" className="leading-tight">
                {children}
            </H2>

            {link ? (
                <ProgressLink
                    href={link}
                    aria-label={moreAria}
                    title={moreAria}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className={cn(
                        "group inline-flex min-h-11 items-center gap-3 sm:gap-4",
                        "rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                    )}
                >
                    <Text as="span" colors="headingSecondary" size="bodyLg" className="text-sm sm:text-base">
                        {moreLabel}
                    </Text>

                    <ArrowRight
                        aria-hidden="true"
                        className={cn(
                            "h-auto w-5 text-text-heading-secondary sm:w-6",
                            "transition-transform duration-300 ease-out",
                            "group-hover:translate-x-1 group-focus-visible:translate-x-1"
                        )}
                    />
                </ProgressLink>
            ) : null}
        </header>
    )
}

export default Title
