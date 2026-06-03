export function toDate(value: unknown, fallback = new Date()) {
  if (!value) return fallback;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? fallback : value;

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? fallback : date;
  }

  if (typeof value === "object" && value !== null) {
    const timestamp = value as { seconds?: number; _seconds?: number };
    const seconds = timestamp.seconds ?? timestamp._seconds;
    if (typeof seconds === "number") return new Date(seconds * 1000);
  }

  const date = new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? fallback : date;
}
