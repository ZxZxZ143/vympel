import CartPage from "@/screens/CartPage";
import {LocaleEnum} from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{
        locale: LocaleEnum;
    }>;
};

export default async function Page({params}: Props) {
    const {locale} = await params;

    return <CartPage locale={locale}/>;
}
