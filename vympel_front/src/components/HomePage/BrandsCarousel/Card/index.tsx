'use client'

import React, {FC} from 'react';
import Image from "next/image";
import {Text} from "@/components/ui/shared/text";
import {useTranslations} from "use-intl";
import {H3} from "@/components/ui/shared/text/Heading";
import {cn} from "@/lib/utils";
import ArrowRight from "@/assets/icons/ArrowRight";
import {Link} from "@/i18n/navigation";

export type BrandCarouselCardProps = {
    img: string;
    name: string;
    description: string;
    link: string;
    alt?: string;
}

const BrandCarouselCard: FC<BrandCarouselCardProps> = ({link, img, alt, name, description}) => {
    const t = useTranslations("brands")

    return (
        <div className="flex w-full flex-col lg:flex-row">
            <div className="min-h-54 flex-1 overflow-hidden bg-white sm:min-h-72 lg:h-max lg:max-h-121.25">
                <Image
                    src={img}
                    alt={alt || name}
                    width="600"
                    height="485"
                    className="h-full w-full object-cover lg:h-auto"
                />
            </div>

            <div className="flex min-h-54 flex-1 flex-col items-end justify-between border border-border-default p-5 sm:min-h-72 sm:p-8 lg:max-h-121.25 lg:p-9 lg:pb-7">
                <div className="w-full">
                    <Text colors="headingSecondary" weight="light">
                        {
                            t("brand")
                        }
                    </Text>

                    <H3 weight="light" className="mt-4 leading-tight sm:mt-6">
                        {
                            name
                        }
                    </H3>
                    <Text colors="muted" className="mt-5 leading-7 sm:mt-12 lg:mt-15 lg:leading-8">
                        {
                            description
                        }
                    </Text>
                </div>

                <Link
                    href={link}
                    className={cn(
                        "group mt-8 inline-flex min-h-11 items-center gap-4",
                        "rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                    )}
                >
                    <Text colors="headingSecondary" size="bodyLg">
                        {
                            t("more")
                        }
                    </Text>

                    <ArrowRight
                        aria-hidden="true"
                        className={cn(
                            "w-6 h-auto text-text-heading-secondary",
                            "transition-transform duration-300 ease-out",
                            "group-hover:translate-x-1 group-focus-visible:translate-x-1"
                        )}
                    />
                </Link>
            </div>
        </div>
    );
};

export default BrandCarouselCard;
