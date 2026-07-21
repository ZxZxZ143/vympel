import AboutPage from "@/screens/AboutPage";
import {LocaleEnum} from "@/i18n/routing";

export const revalidate = 30;

type Props = {
    params: Promise<{
        locale: LocaleEnum;
    }>;
};

export default async function About({params}: Props) {
    const {locale} = await params;

    return <AboutPage locale={locale}/>;
}
