import BrandPage from "@/screens/BrandPage";
import {LocaleEnum} from "@/i18n/routing";
import {getBrandPageData} from "@/config/brandPages";
import {notFound} from "next/navigation";
import {publicSeoMetadata} from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{
        locale: LocaleEnum;
        brandSlug: string;
    }>;
};

export async function generateMetadata({params}: Props) {
    const {locale, brandSlug} = await params;
    const brand = getBrandPageData(brandSlug, locale);
    if (!brand) return {robots: {index: false, follow: false}};
    return publicSeoMetadata(locale, ["brands", brand.slug], `${brand.displayName} — Vympel`);
}

export default async function Page({params}: Props) {
    const {locale, brandSlug} = await params;
    const brand = getBrandPageData(brandSlug, locale);

    if (!brand) {
        notFound();
    }

    return <BrandPage locale={locale} brandSlug={brandSlug} initialBrand={brand}/>;
}
