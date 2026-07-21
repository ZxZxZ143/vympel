export interface ICategory {
    id: number;
    name: string;
    code: string;
    parentId: number | null;
}

export interface ICategoryWithParent {
    id: number;
    name: string;
    code: string;
    parent: ICategoryWithParent | null;
}