import InfoPage from "@/screens/InfoPages";
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
    return publicSeoMetadata(locale, ["delivery"], "Vympel — Delivery");
}

export default async function Page({params}: Props) {
    const {locale} = await params;

    return <InfoPage locale={locale} page="delivery"/>;
}
