import React, {FC} from "react";
import {cn} from "@/lib/utils";
import {Link} from "@/i18n/navigation";
import CmsResponsiveImage from "@/components/ui/shared/CmsResponsiveImage";

export type BannerItemProps = {
    url: string;
    mobileUrl?: string;
    fallbackUrl?: string;
    alt: string;
    link?: string | null;
    external?: boolean;
    newTab?: boolean;
    title?: string | null;
    subtitle?: string | null;
    buttonText?: string | null;
    className?: string;
};

const BannerItem: FC<BannerItemProps> = ({
                                             className,
                                             url,
                                             mobileUrl,
                                             fallbackUrl = "/Romanson_banner.webp",
                                             alt,
                                             link,
                                             external = false,
                                             newTab = false,
                                             title,
                                             subtitle,
                                             buttonText,
                                         }) => {
    const hasText = Boolean(title?.trim() || subtitle?.trim() || buttonText?.trim());
    const content = (
        <span className="responsive-home-banner-frame block">
            <CmsResponsiveImage
                desktopSrc={url}
                mobileSrc={mobileUrl}
                fallbackSrc={fallbackUrl}
                alt=""
                priority
                decorative
                pictureClassName="absolute inset-0"
                className="responsive-home-banner-backdrop absolute inset-0 h-full w-full"
            />
            <CmsResponsiveImage
                desktopSrc={url}
                mobileSrc={mobileUrl}
                fallbackSrc={fallbackUrl}
                alt={alt}
                priority
                pictureClassName="absolute inset-0"
                className="responsive-home-banner-image absolute inset-0 h-full w-full"
            />
            {hasText ? (
                <span className="absolute inset-0 z-20 flex items-end px-5 pb-8 text-white sm:px-10 sm:pb-12 lg:px-16 lg:pb-16">
                    <span className="grid max-w-[520px] gap-3">
                        {title ? <span className="font-heading text-4xl leading-none sm:text-6xl">{title}</span> : null}
                        {subtitle ? <span className="text-base leading-relaxed sm:text-xl">{subtitle}</span> : null}
                        {buttonText ? (
                            <span className="mt-2 w-max max-w-full rounded-full bg-white px-5 py-3 text-sm font-medium text-connectButton sm:text-base">
                                {buttonText}
                            </span>
                        ) : null}
                    </span>
                </span>
            ) : null}
        </span>
    );

    return (
        <figure className={cn("w-full overflow-hidden", className)}>
            {link ? (
                external ? (
                    <a
                        href={link}
                        aria-label={alt}
                        className="block"
                        target={newTab ? "_blank" : undefined}
                        rel={newTab ? "noopener noreferrer" : undefined}
                    >
                        {content}
                    </a>
                ) : (
                    <Link href={link} aria-label={alt} className="block">
                        {content}
                    </Link>
                )
            ) : content}
        </figure>
    );
};

export default BannerItem;
