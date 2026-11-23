const COMPACT_UNITS = [
  { value: 1_000_000_000, suffix: "B" },
  { value: 1_000_000, suffix: "M" },
  { value: 1_000, suffix: "K" },
];

const decimalFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });


export function formatCompactCount(count) {
  const unit = COMPACT_UNITS.find(({ value }) => count >= value);
  if (!unit) return decimalFormatter.format(count);

  const truncated = Math.floor(count / (unit.value / 10)) / 10;
  return `+${decimalFormatter.format(truncated)}${unit.suffix}`;
}
