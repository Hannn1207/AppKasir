/**
 * Maps product names to emoji icons for display in the POS interface.
 */

const defaultIconMap: Record<string, string> = {
  burger: '🍔',
  nasi: '🍚',
  mie: '🍜',
  ayam: '🍗',
  pizza: '🍕',
  kopi: '☕',
  teh: '🍵',
  jus: '🥤',
  boba: '🧋',
  es: '🧊',
  kue: '🍰',
  roti: '🍞',
  sate: '🍢',
  soto: '🥣',
  default: '🍽️',
};

/**
 * Returns an emoji icon for a given product name.
 * Matches by checking if the product name contains any known keyword.
 * Falls back to the default plate emoji if no match is found.
 *
 * @param name - Product name to look up
 * @returns Emoji string
 */
export function getProductIcon(name: string): string {
  const lower = name.toLowerCase();
  return (
    Object.entries(defaultIconMap).find(([key]) => lower.includes(key))?.[1] ??
    defaultIconMap.default
  );
}
