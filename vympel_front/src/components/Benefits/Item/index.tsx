import React, {FC, ReactNode} from 'react';
import {Text} from "@/components/ui/shared/text";
import {cn} from "@/lib/utils";

export type BenefitsItemProps = {
    className?: string;
    icon: ReactNode;
    text: string;
    subtext: ReactNode;
}

const BenefitsItem: FC<BenefitsItemProps> = ({subtext, text, icon, className}) => {
    return (
        <li className={cn(
            "flex h-full min-w-0 items-start justify-start gap-3 rounded-2xl border border-border-default/70 p-3 sm:items-center lg:gap-6 lg:border-0 lg:p-0",
            className
        )}>
            <div className="h-fit w-fit rounded-full border border-border-default p-3 sm:p-5">
                {
                    icon
                }
            </div>
            <div className="min-w-0">
                <Text colors="headingSecondary" size="bodyMd" className="leading-snug sm:text-md">{text}</Text>
                {
                    subtext
                }
            </div>
        </li>
    );
};

export default BenefitsItem;
