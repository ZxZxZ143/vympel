import BrandsPage from "@/screens/BrandsPage";
import {LocaleEnum} from "@/i18n/routing";
import {publicSeoMetadata} from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{
        locale: LocaleEnum;
    }>;
};

export async function generateMetadata({params}: Props) {
    const {locale} = await params;
    return publicSeoMetadata(locale, ["brands"], "Vympel — Brands");
}

export default async function Page({params}: Props) {
    const {locale} = await params;

    return <BrandsPage locale={locale}/>;
}
