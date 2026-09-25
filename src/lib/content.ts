export function isPublished(entry: { data: { draft: boolean } }, prod: boolean = import.meta.env.PROD): boolean {
  return prod ? !entry.data.draft : true;
}
