import type {Metadata} from "next";
import {Suspense} from "react";
import {Inter, Judson, Montaga, Montserrat} from "next/font/google";
import "../globals.css";
import Header from "@/components/ui/layout/Header";
import {NextIntlClientProvider} from "next-intl";
import {routing} from "@/i18n/routing";
import {notFound} from "next/navigation";
import {getMessages, setRequestLocale} from "next-intl/server";
import {Toaster} from "@/components/ui/sonner";
import NProgressProvider from "@/components/Providers/NProgressProvider";
import Footer from "@/components/ui/layout/Footer";
import {TooltipProvider} from "@/components/ui/tooltip";
import MobileBottomNavigation from "@/components/ui/layout/MobileBottomNavigation";
import {CustomerRequestDialogProvider} from "@/components/CustomerRequestDialog/CustomerRequestDialogProvider";
import {CatalogOverlayProvider} from "@/components/CatalogPage/CatalogOverlayProvider";
import TelemetryProvider from "@/components/Providers/TelemetryProvider";
import {toHtmlLanguage} from "@/i18n/htmlLanguage";

const fontSans = Inter({
    variable: "--font-family-sans",
    subsets: ["latin", "cyrillic"],
});

const fontMono = Judson({
    variable: "--font-family-mono",
    subsets: ["latin", "vietnamese"],
    weight: ["400", "700"],
});

const fontHeading = Montaga({
    variable: "--font-family-heading",
    subsets: ["latin"],
    weight: ["400"],
});

const fontFooter = Montserrat({
    variable: "--font-family-footer",
    subsets: ["latin", "cyrillic", "cyrillic-ext"],
    weight: ["400", "700", "200", "500", "600", "300"],
})

export const metadata: Metadata = {
    title: "Vympel",
    description: "Каталог часов и аксессуаров Vympel",
};

export function generateStaticParams() {
    return routing.locales.map((locale) => ({locale}));
}

export default async function RootLayout(props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const {children, params} = props;
    const {locale} = await params;

    if (!routing.locales.includes(locale as never)) notFound();

    setRequestLocale(locale);

    const messages = await getMessages();


    return (
        <html lang={toHtmlLanguage(locale)} data-scroll-behavior="smooth">
        <body
            className={`${fontSans.variable} ${fontMono.variable} ${fontHeading.variable} ${fontFooter.variable} antialiased`}
        >
        <div className="w-full">
            <NextIntlClientProvider locale={locale} messages={messages}>
                <TelemetryProvider>
                <TooltipProvider>
                    <CustomerRequestDialogProvider>
                        <CatalogOverlayProvider>
                            <NProgressProvider>
                                <Header/>
                                {children}
                                <Toaster/>
                                <Footer />
                                <Suspense fallback={null}>
                                    <MobileBottomNavigation/>
                                </Suspense>
                            </NProgressProvider>
                        </CatalogOverlayProvider>
                    </CustomerRequestDialogProvider>
                </TooltipProvider>
                </TelemetryProvider>
            </NextIntlClientProvider>
        </div>
        </body>
        </html>
    );
}
