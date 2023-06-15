export interface ServerPaginationOptions {
    offset: number;
    limit: number;
}

export function formatAttributesToServerPaginationOptions(
    elementAttributes: { name: string, value: number }[]
): ServerPaginationOptions | undefined {
    console.log(elementAttributes);
    const attributes = new Map(Array.from(elementAttributes).map(({ name, value }) => [name, value]))
    console.log(attributes);
    const limit = attributes.get('limit');
    const offset = attributes.get('offset');
    if (!offset || !limit) return;
    console.log("Not returned");
    return {
        limit: limit,
        offset: offset,
    }
}

export function appendServerPaginationToIri(iri: string, options: ServerPaginationOptions): string {
    console.log(iri, options);
    const first = iri.includes('?') ? '&' : '?';
    const limit = options.limit;
    const offset = options.offset;
    return `${iri}${first}limit=${limit}&offset=${offset}`;
}