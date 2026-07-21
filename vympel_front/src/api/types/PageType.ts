export interface Page<T> {
    content: T[]
    empty: boolean
    first: boolean
    last: boolean
    number: number
    numberOfElements: number
    pageable: Pageable
    size: number
    sort: Sort
    totalElements: number
    totalPages: number
}

export interface Pageable {
    offset: number
    pageNumber: number
    pageSize: number
    paged: boolean
    sort: Sort
    unpaged: boolean
}

export interface Sort {
    empty: boolean
    sorted: boolean
    unsorted: boolean
}

export type PageResponseLike<T> = Page<T> | T[] | (Partial<Page<T>> & {
    items?: T[]
    page?: number
    totalItems?: number
})

type PageNormalizeOptions = {
    page?: number
    size?: number
}

const EMPTY_SORT: Sort = {empty: true, sorted: false, unsorted: true}

export function createEmptyPage<T>(options: PageNormalizeOptions = {}): Page<T> {
    return createPageFromItems([], options)
}

export function normalizePageResponse<T>(
    response: PageResponseLike<T> | null | undefined | unknown,
    options: PageNormalizeOptions = {}
): Page<T> {
    if (Array.isArray(response)) {
        return createPageFromItems(response as T[], options)
    }

    if (!isRecord(response)) {
        return createEmptyPage<T>(options)
    }

    const content = Array.isArray(response.content)
        ? response.content as T[]
        : Array.isArray(response.items)
            ? response.items as T[]
            : []
    const fallbackPage = normalizePageNumber(options.page)
    const responseNumber = numberOrUndefined(response.number)
    const responsePage = numberOrUndefined(response.page)
    const pageNumber = responseNumber ?? (
        responsePage == null ? fallbackPage : Math.max(responsePage - 1, 0)
    )
    const pageSize = positiveNumberOrUndefined(response.size)
        ?? positiveNumberOrUndefined(options.size)
        ?? content.length
    const totalElements = numberOrUndefined(response.totalElements)
        ?? numberOrUndefined(response.totalItems)
        ?? content.length
    const totalPages = numberOrUndefined(response.totalPages)
        ?? (pageSize > 0 ? Math.ceil(totalElements / pageSize) : content.length > 0 ? 1 : 0)
    const numberOfElements = numberOrUndefined(response.numberOfElements) ?? content.length
    const sort = sortOrEmpty(response.sort)
    const empty = booleanOrUndefined(response.empty) ?? (content.length === 0)
    const first = booleanOrUndefined(response.first) ?? (pageNumber <= 0)
    const last = booleanOrUndefined(response.last) ?? (
        totalPages <= 1 || pageNumber >= totalPages - 1
    )

    return {
        content,
        empty,
        first,
        last,
        number: pageNumber,
        numberOfElements,
        pageable: {
            offset: pageNumber * pageSize,
            pageNumber,
            pageSize,
            paged: true,
            sort,
            unpaged: false,
        },
        size: pageSize,
        sort,
        totalElements,
        totalPages,
    }
}

function createPageFromItems<T>(items: T[], options: PageNormalizeOptions): Page<T> {
    const pageNumber = normalizePageNumber(options.page)
    const pageSize = positiveNumberOrUndefined(options.size) ?? items.length
    const totalElements = items.length
    const totalPages = pageSize > 0 ? Math.ceil(totalElements / pageSize) : totalElements > 0 ? 1 : 0

    return {
        content: items,
        empty: items.length === 0,
        first: pageNumber <= 0,
        last: totalPages <= 1 || pageNumber >= totalPages - 1,
        number: pageNumber,
        numberOfElements: items.length,
        pageable: {
            offset: pageNumber * pageSize,
            pageNumber,
            pageSize,
            paged: true,
            sort: EMPTY_SORT,
            unpaged: false,
        },
        size: pageSize,
        sort: EMPTY_SORT,
        totalElements,
        totalPages,
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
}

function normalizePageNumber(value: number | undefined): number {
    return value == null || !Number.isFinite(value) ? 0 : Math.max(Math.trunc(value), 0)
}

function numberOrUndefined(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function positiveNumberOrUndefined(value: unknown): number | undefined {
    const number = numberOrUndefined(value)
    return number == null ? undefined : Math.max(Math.trunc(number), 0)
}

function booleanOrUndefined(value: unknown): boolean | undefined {
    return typeof value === "boolean" ? value : undefined
}

function sortOrEmpty(value: unknown): Sort {
    if (!isRecord(value)) {
        return EMPTY_SORT
    }

    return {
        empty: booleanOrUndefined(value.empty) ?? true,
        sorted: booleanOrUndefined(value.sorted) ?? false,
        unsorted: booleanOrUndefined(value.unsorted) ?? true,
    }
}
