import {variants as buttonVariants} from "@/components/ui/shared/Button";
import {Heading} from "@/components/ui/shared/text/Heading";
import {Text} from "@/components/ui/shared/text";
import {Link} from "@/i18n/navigation";
import {cn} from "@/lib/utils";
import {CONTACT_LINKS} from "@/config/routes";
import CmsResponsiveImage from "@/components/ui/shared/CmsResponsiveImage";
import CustomerRequestButton from "@/components/CustomerRequestDialog/CustomerRequestButton";

type Props = {
    className?: string;
    imageSrc?: string;
    imageMobileSrc?: string;
    imageFallbackSrc?: string;
    title: string;
    buttonText: string;
    sideText: string[];
    buttonHref?: string | null;
    buttonExternal?: boolean;
    buttonNewTab?: boolean;
    requestSource?: string;
    showButton?: boolean;
};

const ContactBanner = ({
    className,
    imageSrc = "/contact_banner.png",
    imageMobileSrc,
    imageFallbackSrc = "/contact_banner.png",
    title,
    buttonText,
    sideText,
    buttonHref = CONTACT_LINKS.whatsapp,
    buttonExternal = true,
    buttonNewTab = true,
    requestSource,
    showButton = true,
}: Props) => {
    const buttonClassName = cn(buttonVariants({variant: "connectBanner", size: "connectBanner"}), "px-6 py-3 sm:px-connect-banner-button-x sm:py-connect-banner-button-y");
    const resolvedButtonHref = buttonHref?.trim();
    const shouldRenderButton = showButton && Boolean(resolvedButtonHref && buttonText.trim());
    const buttonContent = (
        <Text as="span" colors="connectButton" size="bodyLg" weight="regular" className="text-sm leading-none sm:text-base">
            {buttonText}
        </Text>
    );

    return (
        <section
        className={cn(
            "relative w-full overflow-hidden bg-connect-overlay rounded-2xl",
            className
        )}
    >
        <CmsResponsiveImage
            desktopSrc={imageSrc}
            mobileSrc={imageMobileSrc}
            fallbackSrc={imageFallbackSrc}
            alt=""
            decorative
            pictureClassName="absolute inset-0"
            className="absolute inset-0 h-full w-full object-cover origin-top-left"
        />
        <div className="absolute inset-0 bg-connect-overlay/45" aria-hidden="true"/>
        <div className="relative flex flex-col gap-5 px-5 py-6 sm:gap-connect-banner-heading-button-gap sm:pl-connect-banner-left sm:pr-connect-banner-right sm:pt-connect-banner-top sm:pb-connect-banner-bottom lg:flex-row lg:items-start">
            <div className="flex-2 min-w-0 flex flex-col items-start gap-connect-banner-heading-button-gap">
                <Heading
                    as="h2"
                    colors="inverse"
                    size="h1xl"
                    weight="medium"
                    className="min-w-0 whitespace-pre-line break-words text-3xl leading-tight tracking-normal sm:text-5xl sm:leading-20"
                >
                    {title}
                </Heading>
                {shouldRenderButton && requestSource ? (
                    <CustomerRequestButton
                        source={requestSource}
                        title="request"
                        className={buttonClassName}
                    >
                        {buttonContent}
                    </CustomerRequestButton>
                ) : shouldRenderButton && buttonExternal ? (
                    <a
                        href={resolvedButtonHref!}
                        target={buttonNewTab ? "_blank" : undefined}
                        rel={buttonNewTab ? "noopener noreferrer" : undefined}
                        className={buttonClassName}
                    >
                        {buttonContent}
                    </a>
                ) : shouldRenderButton ? (
                    <Link href={resolvedButtonHref!} className={buttonClassName}>
                        {buttonContent}
                    </Link>
                ) : null}
            </div>
            <div className="flex-3 flex min-w-0 flex-col gap-4 pt-0 pb-0 sm:gap-8 sm:pt-connect-banner-side-top sm:pb-connect-banner-side-bottom lg:justify-self-end">
                {
                    sideText.map((text, index) => (
                        <Text
                            key={index}
                            colors="connectSide"
                            size="bodyMd"
                            weight="medium"
                            className="break-words text-sm leading-relaxed sm:text-md"
                        >
                            {text}
                        </Text>
                    ))
                }
            </div>
        </div>
    </section>
    );
};

export default ContactBanner;
