// Four cards cover the widest SSR viewport (including its partly visible card).
// Mobile retains up to two extra bootstrap images; subsequent discovery adds one
// neighbour on each side. Already discovered resources stay mounted on return.
export const INITIAL_IMAGE_COUNT = 4;

export function adjacentImageIndexes(visible: readonly number[], count: number): number[] {
    const indexes = new Set<number>();
    for (const index of visible) {
        if (!Number.isInteger(index) || index < 0 || index >= count) continue;
        for (let neighbour = Math.max(0, index - 1); neighbour <= Math.min(count - 1, index + 1); neighbour++) {
            indexes.add(neighbour);
        }
    }
    return [...indexes];
}

export function imageIdentity(item: {id: number; imageUrl?: string | null; img?: string | null}): string {
    return JSON.stringify([item.id, item.imageUrl ?? item.img ?? null]);
}
