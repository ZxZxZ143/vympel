import {ICategory} from "@/api/types/CategoryTypes";

export type CategoryNode = ICategory & {
    children: CategoryNode[];
};

export function normalizeCategoryCode(code: string | null | undefined) {
    return code?.toLowerCase().replaceAll("_", "-") ?? null;
}

export function buildCategoryTree(categories: ICategory[]): CategoryNode[] {
    const nodes = new Map<number, CategoryNode>();
    const roots: CategoryNode[] = [];

    categories.forEach((category) => {
        nodes.set(category.id, {
            ...category,
            children: [],
        });
    });

    nodes.forEach((node) => {
        if (node.parentId != null && nodes.has(node.parentId)) {
            nodes.get(node.parentId)?.children.push(node);
            return;
        }

        roots.push(node);
    });

    const sortNodes = (items: CategoryNode[]) => {
        items.sort((a, b) => a.name.localeCompare(b.name));
        items.forEach((item) => sortNodes(item.children));
    };

    sortNodes(roots);
    return roots;
}
