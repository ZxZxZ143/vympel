import {ICategory} from "@/api/types/CategoryTypes";
import {routes} from "@/config/routes";

export function buildCategoryLink(
    categories: ICategory[] | undefined,
    startCategoryId: number
): string {
    if (!categories?.length) return routes.catalog();

    const categoryMap = new Map<number, ICategory>(
        categories.map((category) => [category.id, category])
    );

    let currentCategory = categoryMap.get(startCategoryId);
    if (!currentCategory) return routes.catalog();

    const visited = new Set<number>();

    while (currentCategory) {
        if (visited.has(currentCategory.id)) {
            console.error("Cycle detected in categories:", currentCategory);
            break;
        }

        visited.add(currentCategory.id);

        if (currentCategory.code) {
            return routes.category(currentCategory.code);
        }

        if (currentCategory.parentId == null) {
            break;
        }

        currentCategory = categoryMap.get(currentCategory.parentId);
    }

    return routes.catalog();
}
