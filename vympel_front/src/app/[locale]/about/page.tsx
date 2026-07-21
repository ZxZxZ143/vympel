import AboutPage from "@/screens/AboutPage";
import {LocaleEnum} from "@/i18n/routing";
import {publicSeoMetadata} from "@/lib/seo";

export const revalidate = 30;

type Props = {
    params: Promise<{
        locale: LocaleEnum;
    }>;
};

export async function generateMetadata({params}: Props) {
    const {locale} = await params;
    return publicSeoMetadata(locale, ["about"], "Vympel — About");
}

export default async function About({params}: Props) {
    const {locale} = await params;

    return <AboutPage locale={locale}/>;
}
