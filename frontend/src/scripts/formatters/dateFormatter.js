const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatShortDate(value) {
  const parts = shortDateFormatter.formatToParts(new Date(value));
  const getPart = (type) => parts.find((part) => part.type === type).value;

  return `${getPart("day")} ${getPart("month").replace(".", "")} ${getPart("year")}`;
}
