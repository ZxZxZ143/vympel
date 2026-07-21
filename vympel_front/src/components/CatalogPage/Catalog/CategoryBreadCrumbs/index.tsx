import {ICategory, ICategoryWithParent} from "@/api/types/CategoryTypes";
import {Fragment, FC} from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import ProgressLink from "@/components/ui/shared/ProgressLink";
import {getTranslations} from "next-intl/server";
import {Text} from "@/components/ui/shared/text";
import {PublicApiController} from "@/api/controllers/PublicController";
import {LocaleEnum} from "@/i18n/routing";
import {buildCategoryLink} from "@/utils/CreateCategoryLink";
import {routes} from "@/config/routes";
import {PUBLIC_BREADCRUMB_SEPARATOR} from "@/config/publicBreadcrumb";

type Props = {
    categoryCode: string | undefined;
    locale: LocaleEnum;
    initialCategory: ICategoryWithParent | null;
}

const CategoryBreadCrumbs: FC<Props> = async ({categoryCode, locale, initialCategory}) => {
    const t = await getTranslations("catalog");

    let categories: ICategoryWithParent | null = initialCategory;

    if (categoryCode && !categories) {
        try {
            categories = await PublicApiController.getCategoryByCode(categoryCode, locale);
        } catch (error: unknown) {
            console.error(error);
        }
    }

    const categoriesList: ICategory[] = [];

    let currentCategory: ICategoryWithParent | null = categories;

    while (currentCategory) {
        categoriesList.push({
            id: currentCategory.id,
            name: currentCategory.name,
            code: currentCategory.code,
            parentId: currentCategory.parent?.id ?? null
        });

        currentCategory = currentCategory.parent;
    }

    categoriesList.reverse();

    return (
        <div className="mt-8 overflow-x-auto px-0 sm:px-8 xl:px-16.5">
            <Breadcrumb aria-label={t("breadcrumbsAria")}>
                <BreadcrumbList className="public-breadcrumb flex-nowrap gap-2 whitespace-nowrap pb-2">
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <ProgressLink href={routes.home()}>
                                <Text size="bodySm" colors="primary" weight="light" className="text-breadcrumb leading-none">
                                    {t("home")}
                                </Text>
                            </ProgressLink>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>
                        <Text size="bodySm" colors="primary" weight="light" className="text-breadcrumb">
                            {PUBLIC_BREADCRUMB_SEPARATOR}
                        </Text>
                    </BreadcrumbSeparator>
                    {
                        categoriesList.map((currentCategory) => (
                            <Fragment key={currentCategory.id}>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <ProgressLink href={buildCategoryLink(categoriesList, currentCategory.id)}>
                                            <Text size="bodySm" colors="primary" weight="light" className="text-breadcrumb leading-none">
                                                {currentCategory.name}
                                            </Text>
                                        </ProgressLink>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Text size="bodySm" colors="primary" weight="light" className="text-breadcrumb">
                                        {PUBLIC_BREADCRUMB_SEPARATOR}
                                    </Text>
                                </BreadcrumbSeparator>
                            </Fragment>
                        ))
                    }
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Text size="bodySm" colors="primary" weight="light" className="text-breadcrumb leading-none">
                                {t("allGoods")}
                            </Text>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    );
};

export default CategoryBreadCrumbs;
