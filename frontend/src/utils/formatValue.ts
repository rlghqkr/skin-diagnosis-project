export function formatValue(value: number, decimals = 2): string {
  return Number(value).toFixed(decimals);
}
