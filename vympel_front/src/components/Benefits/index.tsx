'use client'

import React, {FC} from "react";
import {useTranslations} from "use-intl";
import {getBenefitsConfig} from "@/components/Benefits/config";
import BenefitsItem from "@/components/Benefits/Item";
import {cn} from "@/lib/utils";

type Props = {
    className?: string;
}

const Benefits: FC<Props> = ({className}) => {
    const t = useTranslations("benefits")
    const benefitsConfig = getBenefitsConfig(t)

    return (
        <section aria-labelledby="benefits-title" className={cn(
            "mt-11 w-full",
            className
        )}>
            <h2 id="benefits-title" className="sr-only">
                Benefits
            </h2>

            <ul className="grid w-full gap-5 lg:grid-cols-2 xl:grid-cols-3 xl:gap-3">
                {benefitsConfig.map((benefit) => (
                    <BenefitsItem
                        key={benefit.id}
                        icon={benefit.icon}
                        text={benefit.text}
                        subtext={benefit.subtext}
                        className={benefit.className}
                    />
                ))}
            </ul>
        </section>
    );
};

export default Benefits;
