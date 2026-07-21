import React, {FC} from 'react';
import Card from "@/components/ui/shared/Card";
import {H3} from "@/components/ui/shared/text/Heading";
import {Link} from "@/i18n/navigation";
import Image from "next/image";
import {cn} from "@/lib/utils";

export type CategoriesItemProps = {
    link: string;
    title: string;
    className?: string;
    imageClassName?: string;
    img: string;
}

const CategoriesItem: FC<CategoriesItemProps> = ({className, imageClassName, img, title, link}) => {
    return (
        <Link href={link} className={cn("w-full", className)}>
            <Card className="relative flex min-h-58 w-full items-end justify-start p-5 whitespace-pre-wrap sm:min-h-82.75 sm:p-8">
                <H3 colors="secondary" weight="light" className="z-20 max-w-[70%] break-words text-xl leading-tight sm:max-w-1/2 sm:text-xl">{title.toUpperCase().replace(" ", "\n")}</H3>
                <Image
                    src={img}
                    alt=""
                    width="400"
                    height="400"
                    className={cn(imageClassName, "absolute w-auto max-w-[70%] object-cover sm:max-w-3/4")}
                />
            </Card>
        </Link>
    );
};

export default CategoriesItem;
