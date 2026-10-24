import BrandPage from "@/screens/BrandPage";
import {LocaleEnum} from "@/i18n/routing";
import {getBrandPageData} from "@/config/brandPages";
import {notFound, permanentRedirect} from "next/navigation";
import {loadBrandProducts} from "@/lib/brandPageData";
import {pageSearch, positivePage} from "@/lib/paginationUrl";
import {toUrlSearchParams, type NextSearchParams} from "@/lib/catalogQuery";
import {routes} from "@/config/routes";
import {publicSeoMetadata} from "@/lib/seo";
import {brandSeoContent} from "@/lib/seoContent";

export const dynamic = "force-dynamic";

type Props = {
    searchParams: Promise<NextSearchParams>;
    params: Promise<{
        locale: LocaleEnum;
        brandSlug: string;
    }>;
};

export async function generateMetadata({params, searchParams}: Props) {
    const {locale, brandSlug} = await params;
    const brand = getBrandPageData(brandSlug, locale);
    if (!brand) return {robots: {index: false, follow: false}};
    const page = positivePage(toUrlSearchParams(await searchParams).get("page"));
    const {result} = await loadBrandProducts(locale, brand.slug, page);
    return publicSeoMetadata(locale, ["brands", brand.slug], brandSeoContent(locale, brand.displayName, brand.description), {
        canonicalSearch: page > 1 ? `page=${page}` : "",
        indexable: result.status === "success",
    });
}

export default async function Page({params, searchParams}: Props) {
    const {locale, brandSlug} = await params;
    const brand = getBrandPageData(brandSlug, locale);

    if (!brand) {
        notFound();
    }

    const raw = toUrlSearchParams(await searchParams);
    const page = positivePage(raw.get("page"));
    const normalized = pageSearch(raw, page).toString();
    if (raw.toString() !== normalized) {
        permanentRedirect(routes.withLocale(locale, `/brands/${brand.slug}${normalized ? `?${normalized}` : ""}`));
    }
    const productsData = await loadBrandProducts(locale, brand.slug, page);
    if (productsData.result.status === "out_of_range") notFound();
    if (productsData.result.status === "transient_error") console.error(productsData.result.error);
    return <BrandPage locale={locale} brandSlug={brand.slug} initialBrand={brand} productsData={productsData}/>;
}
