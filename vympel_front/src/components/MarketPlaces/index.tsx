'use client'

import React from 'react';
import {MarketPlacesConfig} from "@/components/MarketPlaces/config";
import Card from "@/components/ui/shared/Card";
import Image from "next/image";
import {Text} from "@/components/ui/shared/text";
import {useTranslations} from "use-intl";
import ArrowRight from "@/assets/icons/ArrowRight";

const MarketPlaces = () => {
    const t = useTranslations("marketplaces");

    return (
        <div className="grid w-full min-w-0 grid-cols-1 gap-5 md:auto-rows-fr md:grid-cols-2 xl:gap-16">
            {
                MarketPlacesConfig.map(item => (
                    <a
                        href={item.link}
                        key={item.id}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t("openAria", {marketplace: item.name})}
                        className="group block h-full min-w-0 w-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-button-bg-action/40 focus-visible:ring-offset-2"
                    >
                        <Card
                            className="relative flex h-38 w-full items-center justify-center px-8 sm:h-50 lg:h-55.5">

                            <div
                                className="absolute inset-0 z-20 flex h-full w-full items-end justify-end rounded-2xl bg-card-marketplace-hover/60 p-5 opacity-100 transition-opacity md:p-7 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100">
                                <div className="flex items-center gap-4">
                                    <Text weight="semibold" size="bodyLg" colors="inverse">
                                        {t("go")}
                                    </Text>
                                    <ArrowRight className="h-auto w-6 [&>path]:fill-icon-white"/>
                                </div>
                            </div>

                            <Image
                                width={268}
                                height={70}
                                src={item.img}
                                alt={item.name}
                                sizes="(min-width: 768px) 45vw, 90vw"
                                className="h-auto max-h-18 w-full max-w-67 object-contain sm:max-h-22"
                            />
                        </Card>
                    </a>
                ))
            }
        </div>
    );
};

export default MarketPlaces;
