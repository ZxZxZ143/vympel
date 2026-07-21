import {NextRequest, NextResponse} from "next/server";
import createMiddleware from "next-intl/middleware";
import {routing} from "@/i18n/routing";

const intlMiddleware = createMiddleware({
    ...routing,
    localeDetection: false,
});

const LOCALE_LIKE = /^[a-zA-Z]{2}$/;
const isSupportedLocale = (value: string): value is (typeof routing.locales)[number] => {
    return routing.locales.includes(value as (typeof routing.locales)[number]);
};

export default function proxy(req: NextRequest) {
    const {pathname} = req.nextUrl;
    const segments = pathname.split("/").filter(Boolean);
    const first = segments[0];

    if (first && LOCALE_LIKE.test(first) && !isSupportedLocale(first)) {
        const rest = segments.slice(1).join("/");
        const url = req.nextUrl.clone();
        url.pathname = rest ? `/${rest}` : `/`;
        return NextResponse.redirect(url);
    }

    return intlMiddleware(req);
}

export const config = {
    matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
