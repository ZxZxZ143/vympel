import HomePage from "@/screens/HomePage";
import {LocaleEnum} from "@/i18n/routing";
import {getTranslations} from "next-intl/server";
import {publicSeoMetadata} from "@/lib/seo";

export const revalidate = 30;

type Props = {
    params: Promise<{
        locale: LocaleEnum;
    }>
}

export async function generateMetadata({params}: Props) {
    const {locale} = await params;
    return publicSeoMetadata(locale);
}

export default async function Home({params}: Props) {
    const {locale} = await params;
    const t = await getTranslations({locale: locale, namespace: "title"});

    return (
        <HomePage
            titles={{
                new: t("new"),
                brands: t("brands"),
                case: t("case"),
                categories: t("categories"),
                accessories: t("accessories"),
                philosophy: t("philosophy"),
                marketplaces: t("marketplaces"),
            }}
            locale={locale}
        />
    );
}
