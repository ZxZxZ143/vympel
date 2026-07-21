import FavoritesPage from "@/screens/FavoritesPage";
import {LocaleEnum} from "@/i18n/routing";
import {privatePageMetadata} from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{
        locale: LocaleEnum;
    }>;
};

export const metadata = privatePageMetadata("Vympel — Favorites");

export default async function Page({params}: Props) {
    const {locale} = await params;

    return <FavoritesPage locale={locale}/>;
}
