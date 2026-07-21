import React, {FC, PropsWithChildren} from 'react';
import {cn} from "@/lib/utils";
import CmsResponsiveImage from "@/components/ui/shared/CmsResponsiveImage";

type Props = {
    image: string;
    mobileImage?: string;
    fallbackImage?: string;
    alt?: string;
    imageClassName?: string;
    contentClassName?: string;
}

const BannerWithFlorContent: FC<PropsWithChildren<Props>> = ({
                                                                 image,
                                                                 mobileImage,
                                                                 fallbackImage,
                                                                 alt,
                                                                 imageClassName,
                                                                 contentClassName,
                                                                 children,
                                                             }) => {
    return (
        <div className="relative w-full">
            <div className="w-full">
                <CmsResponsiveImage
                    desktopSrc={image}
                    mobileSrc={mobileImage}
                    fallbackSrc={fallbackImage ?? image}
                    alt={alt ?? ""}
                    decorative={!alt}
                    priority
                    pictureClassName="block w-full"
                    className={cn("responsive-page-banner-image", imageClassName)}
                />
            </div>
            <div className="absolute bottom-0 left-0 w-full responsive-page-x">
                <div className={cn(
                    "relative mx-auto max-w-360 rounded-t-2xl bg-primary-bg px-4 py-4 sm:px-9.5 sm:py-7.5",
                    contentClassName
                )}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BannerWithFlorContent;
