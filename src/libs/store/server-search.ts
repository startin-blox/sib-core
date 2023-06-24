export interface ServerSearchOptions {
  fields: string[];
  value: string;
  method?: string;
}

export function formatAttributesToServerSearchOptions(
  elementAttributes: Iterable<Attr>
): Partial<ServerSearchOptions> {
  const attributes = new Map(Array.from(elementAttributes).map(({ name, value }) => [name, value]));
  const fields = attributes.get('server-search-fields')?.split(",").map((field) => field.trim());
  const value = attributes.get('server-search-value')?.trim();
  const method = attributes.get('server-search-method')?.trim();
  return {
    fields: fields && fields.length > 0 ? fields : undefined,
    value: value ? value : undefined,
    method: method ? method : undefined
  }
}

export function mergeServerSearchOptions(
  attributesOptions?: Partial<ServerSearchOptions>,
  dynamicOptions?: Partial<ServerSearchOptions>
): ServerSearchOptions | undefined {
  const fields = attributesOptions?.fields ?? dynamicOptions?.fields;
  const value = dynamicOptions?.value ?? attributesOptions?.value;
  const method = attributesOptions?.method ?? dynamicOptions?.method;
  if (!fields || fields.length === 0 || !value) return;
  return { fields, value, method };
}

export function appendServerSearchToIri(iri: string, options: ServerSearchOptions): string {
  const first = iri.includes('?') ? '&' : '?';
  const fields = options.fields.map(encodeURIComponent).join(',');
  const value = encodeURIComponent(options.value);
  const method = encodeURIComponent(options.method ?? 'ibasic');
  return `${iri}${first}search-fields=${fields}&search-terms=${value}&search-method=${method}`;
}