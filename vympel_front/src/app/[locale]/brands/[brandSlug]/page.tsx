import BrandPage from "@/screens/BrandPage";
import {LocaleEnum} from "@/i18n/routing";
import {getBrandPageData} from "@/config/brandPages";
import {notFound} from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{
        locale: LocaleEnum;
        brandSlug: string;
    }>;
};

export default async function Page({params}: Props) {
    const {locale, brandSlug} = await params;
    const brand = getBrandPageData(brandSlug, locale);

    if (!brand) {
        notFound();
    }

    return <BrandPage locale={locale} brandSlug={brandSlug} initialBrand={brand}/>;
}
