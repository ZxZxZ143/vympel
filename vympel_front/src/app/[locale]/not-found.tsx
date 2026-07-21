import {getTranslations} from "next-intl/server";

import EmptyState from "@/components/ui/shared/EmptyState";
import {routes} from "@/config/routes";

export default async function NotFoundPage() {
    const stateT = await getTranslations("states");

    return (
        <main className="mx-auto max-w-360 responsive-page-x py-20 sm:py-24">
            <EmptyState
                visual="notFound"
                title={stateT("notFound.title")}
                description={stateT("notFound.description")}
                action={{
                    label: stateT("actions.goHome"),
                    href: routes.home(),
                }}
                secondaryAction={{
                    label: stateT("actions.goCatalog"),
                    href: routes.catalog({page: 1}),
                }}
            />
        </main>
    );
}
