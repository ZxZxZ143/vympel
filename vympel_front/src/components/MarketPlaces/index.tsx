'use client'

import React from 'react';
import {MarketPlacesConfig} from "@/components/MarketPlaces/config";
import Card from "@/components/ui/shared/Card";
import Image from "next/image";
import {cn} from "@/lib/utils";
import {Text} from "@/components/ui/shared/text";
import {useTranslations} from "use-intl";
import ArrowRight from "@/assets/icons/ArrowRight";

const MarketPlaces = () => {
    const t = useTranslations("marketplaces");

    return (
        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-3 xl:gap-16">
            {
                MarketPlacesConfig.map(item => (
                    <a
                        href={item.link}
                        key={item.id}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full"
                    >
                        <Card
                            className={cn(
                                "relative flex h-38 w-full items-center justify-center px-8 sm:h-50 lg:h-55.5",
                                item.className
                            )}>

                            <div
                                className="absolute left-0 top-0 z-20 flex h-full w-full items-end justify-end rounded-2xl bg-card-marketplace-hover/17 p-7 opacity-0 transition hover:opacity-100">
                                <div className="flex items-center gap-4">
                                    <Text weight="semibold" size="bodyLg" colors="inverse">
                                        {t("go")}
                                    </Text>
                                    <ArrowRight className="[&>path]:fill-icon-white w-6 h-auto"/>
                                </div>
                            </div>

                            <Image
                                width={268}
                                height={70}
                                src={item.img}
                                alt={item.img.replace("/", "").replace(".png", "")}
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
