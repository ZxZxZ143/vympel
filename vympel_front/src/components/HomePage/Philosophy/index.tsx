'use client'

import React from 'react';
import {useTranslations} from "use-intl";
import Image from "next/image";
import {H3} from "@/components/ui/shared/text/Heading";
import {Text} from "@/components/ui/shared/text";

const Philosophy = () => {
    const t = useTranslations("philosophy");

    return (
        <div className="grid w-full grid-cols-1 gap-8 rounded-3xl border border-border-default/60 bg-surface-card px-5 py-7 shadow-[0_18px_60px_rgb(0_0_0_/_0.04)] sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-x-8 lg:gap-y-14 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <div className="order-1 flex flex-col">
                <H3
                    colors="headingSecondary"
                    size="h2"
                    weight="light"
                    className="mb-5 whitespace-pre-wrap text-3xl leading-tight sm:mb-9 sm:text-4xl"
                >
                    {t("title")}
                </H3>

                <Text
                    colors="secondary"
                    className="text-sm leading-7 sm:text-sm sm:leading-8"
                >
                    {t("start")}
                </Text>
            </div>

            <div className="order-2 flex justify-center rounded-3xl bg-primary-bg p-2 lg:-mt-6 lg:justify-end lg:bg-transparent lg:p-0">
                <Image
                    width={731}
                    height={731}
                    src="/philosophy_1.webp"
                    alt={t("redWatchAlt")}
                    className="h-auto w-full max-w-146 object-contain"
                />
            </div>

            <div className="order-4 flex justify-center rounded-3xl bg-primary-bg p-2 lg:order-3 lg:-mt-12 lg:justify-start lg:bg-transparent lg:p-0">
                <Image
                    width={731}
                    height={731}
                    src="/philosophy_2.png"
                    alt={t("blackWatchAlt")}
                    className="h-auto w-full max-w-124 object-contain"
                />
            </div>

            <div className="order-3 flex items-end lg:order-4">
                <Text
                    colors="secondary"
                    className="max-w-118 text-sm leading-7 sm:text-sm sm:leading-8 lg:pb-8"
                >
                    {t("end")}
                </Text>
            </div>
        </div>
    );
};

export default Philosophy;
