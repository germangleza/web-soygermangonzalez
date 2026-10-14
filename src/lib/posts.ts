/** Orden de publicaciones: más recientes primero; mismo día → campo `order` (menor primero). */
export function byNewest<T extends { data: { pubDate: Date; order: number } }>(a: T, b: T): number {
  return b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.data.order - b.data.order;
}
