import React, {FC, PropsWithChildren} from 'react';
import Title from "@/components/ui/shared/Title";
import {cn} from "@/lib/utils";

type Props = {
    title: string;
    link?: string;
    className?: string;
    titleClassName?: string;
    spacing?: "section" | "subsection" | "none";
}

const SectionWithTitle: FC<PropsWithChildren<Props>> = ({
                                                           title,
                                                           link,
                                                           children,
                                                           className,
                                                           titleClassName,
                                                           spacing = "section",
                                                       }) => {
    return (
        <div className={cn(
            spacing === "section" && "responsive-section-gap",
            spacing === "subsection" && "responsive-subsection-gap",
            className
        )}>
            <Title link={link} className={cn("mb-7 sm:mb-9", titleClassName)}>
                {
                    title
                }
            </Title>
            {children}
        </div>
    );
};

export default SectionWithTitle;
