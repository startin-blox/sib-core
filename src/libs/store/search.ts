export interface SearchFilter {
  fields: string[];
  value: string;
  method: string;
}

export function formatAttributesToSearchFilter(elementAttributes: { name: string, value: string }[]): SearchFilter | undefined {
  const attributes = new Map(Array.from(elementAttributes).map(({ name, value }) => [name, value]))
  const fields = attributes.get('search-fields');
  const value = attributes.get('search-value')?.trim();
  const method = attributes.get('search-method')?.trim();
  if (!fields || !value) return;
  return {
    fields: fields.split(",").map((field) => field.trim()),
    value: value,
    method: method ? method : 'ibasic'
  }
}

export function appendSearchFilterToIri(filter: SearchFilter, iri: string): string {
  const fields = filter.fields.map(encodeURIComponent).join(',');
  const value = encodeURIComponent(filter.value);
  const first = iri.includes('?') ? '&' : '?';
  return `${iri}${first}search-fields=${fields}&search-terms=${value}&search-method=${filter.method}`;
}