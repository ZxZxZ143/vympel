import {getTranslations} from "next-intl/server";

import AboutInstagramSlider from "@/components/AboutPage/InstagramSlider";
import MarketPlaces from "@/components/MarketPlaces";
import Navigation from "@/components/ui/layout/Navigation";
import ContactBanner from "@/components/ui/shared/ContactBanner";
import Title from "@/components/ui/shared/Title";
import {Text} from "@/components/ui/shared/text";
import {Heading} from "@/components/ui/shared/text/Heading";
import {LocaleEnum} from "@/i18n/routing";
import {PublicApiController} from "@/api/controllers/PublicController";
import {cmsImageSources, cmsLink, cmsText, cmsTextList, findCmsBlock} from "@/utils/cmsContent";
import CmsResponsiveImage from "@/components/ui/shared/CmsResponsiveImage";

type Props = {
    locale: LocaleEnum;
};

const companyCardKeys = ["official", "expertise", "selection", "service"] as const;
const cooperationTextKeys = ["body1", "body2", "body3"] as const;

export default async function AboutPage({locale}: Props) {
    const t = await getTranslations({locale, namespace: "aboutPage"});
    const cmsPage = await PublicApiController.getCmsPage("about", locale).catch(() => null);
    const blocks = cmsPage?.blocks ?? [];
    const heroBanner = findCmsBlock(blocks, "about.heroBanner");
    const introBlock = findCmsBlock(blocks, "about.intro");
    const cooperationBanner = findCmsBlock(blocks, "about.cooperationBanner");
    const cooperationLink = cmsLink(cooperationBanner);
    const heroImages = cmsImageSources(heroBanner, locale, "/about-us-banner.webp");
    const cooperationImages = cmsImageSources(cooperationBanner, locale, "/contact_banner.png");
    const cooperationButtonHref = cooperationBanner
        ? cooperationLink?.href ?? null
        : undefined;

    return (
        <main className="mx-auto max-w-360">
            <Navigation/>
            <h1 className="sr-only">{t("title")}</h1>

            <section className="about-page-banner" aria-label={t("bannerAria")}>
                <CmsResponsiveImage
                    desktopSrc={heroImages.desktop}
                    mobileSrc={heroImages.mobile}
                    fallbackSrc={heroImages.fallback}
                    alt={cmsText(heroBanner?.translation?.altText, t("bannerAlt"))}
                    priority
                    pictureClassName="block w-full"
                    className="h-auto w-full"
                />
            </section>

            <div className="about-page-content">
                <section className="about-page-section about-intro-grid" aria-label={t("intro.aria")}>
                    <Text
                        size="h5"
                        weight="light"
                        colors="headingSecondary"
                        className="about-intro-lead"
                    >
                        {cmsText(introBlock?.translation?.title, t("intro.left"))}
                    </Text>
                    <Text
                        size="bodyMd"
                        weight="regular"
                        colors="secondary"
                        className="about-intro-body"
                    >
                        {cmsText(introBlock?.translation?.description, t("intro.right"))}
                    </Text>
                </section>

                <section className="about-page-section" aria-labelledby="about-company-title">
                    <Title headingId="about-company-title" className="mb-9">
                        {t("company.title")}
                    </Title>
                    <div className="about-company-grid">
                        {companyCardKeys.map((key, index) => (
                            <article key={key} className="about-company-card">
                                <div className="about-company-card-header">
                                    <Heading
                                        as="h3"
                                        size="productTitle"
                                        weight="regular"
                                        colors="primary"
                                        className="leading-normal"
                                    >
                                        {t(`company.cards.${key}.title`)}
                                    </Heading>
                                    <Text
                                        as="span"
                                        font="heading"
                                        colors="headingSecondary"
                                        className="about-company-card-number"
                                    >
                                        {String(index + 1).padStart(2, "0")}
                                    </Text>
                                </div>
                                <Text
                                    size="bodyMd"
                                    weight="regular"
                                    className="about-company-card-text"
                                >
                                    {t(`company.cards.${key}.text`)}
                                </Text>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="about-page-section" aria-labelledby="about-social-title">
                    <Title headingId="about-social-title" className="mb-9">
                        {t("social.title")}
                    </Title>
                    <AboutInstagramSlider/>
                </section>

                <section className="about-page-section" aria-labelledby="about-cooperation-title">
                    <Title headingId="about-cooperation-title" className="mb-9">
                        {t("cooperation.title")}
                    </Title>
                    <ContactBanner
                        imageSrc={cooperationImages.desktop}
                        imageMobileSrc={cooperationImages.mobile}
                        imageFallbackSrc={cooperationImages.fallback}
                        title={cmsText(cooperationBanner?.translation?.title, t("cooperation.bannerTitle"))}
                        buttonText={cmsText(cooperationBanner?.translation?.buttonText, t("cooperation.button"))}
                        sideText={cmsTextList(
                            cooperationBanner?.translation?.description,
                            cooperationTextKeys.map((key) => t(`cooperation.${key}`))
                        )}
                        buttonHref={cooperationButtonHref}
                        buttonExternal={cooperationLink?.external}
                        buttonNewTab={cooperationLink?.newTab}
                        requestSource="about_cooperation_banner"
                    />
                </section>

                <section className="about-page-section" aria-labelledby="about-marketplaces-title">
                    <Title headingId="about-marketplaces-title" className="mb-9">
                        {t("platforms.title")}
                    </Title>
                    <MarketPlaces/>
                </section>
            </div>
        </main>
    );
}
