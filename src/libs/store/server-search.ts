export interface ServerSearchOptions {
  fields: string[];
  value: string;
  method: string;
}

export function formatAttributesToServerSearchOptions(
  elementAttributes: { name: string, value: string }[]
): ServerSearchOptions | undefined {
  const attributes = new Map(Array.from(elementAttributes).map(({ name, value }) => [name, value]))
  const fields = attributes.get('server-search-fields');
  const value = attributes.get('server-search-value')?.trim();
  const method = attributes.get('server-search-method')?.trim();
  if (!fields || !value) return;
  return {
    fields: fields.split(",").map((field) => field.trim()),
    value: value,
    method: method ? method : 'ibasic'
  }
}

export function appendServerSearchToIri(options: ServerSearchOptions, iri: string): string {
  const first = iri.includes('?') ? '&' : '?';
  const fields = options.fields.map(encodeURIComponent).join(',');
  const value = encodeURIComponent(options.value);
  const method = encodeURIComponent(options.method);
  return `${iri}${first}search-fields=${fields}&search-terms=${value}&search-method=${method}`;
}