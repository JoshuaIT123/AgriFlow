export function formatRwf(amount: number): string {
  return (
    "RWF " +
    amount.toLocaleString("en-US", { maximumFractionDigits: 0 })
  );
}

export function formatDate(
  iso: string,
  locale: string,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
): string {
  try {
    return new Date(iso).toLocaleDateString(locale, opts);
  } catch {
    return new Date(iso).toDateString();
  }
}

export function formatDateShort(iso: string, locale: string): string {
  return formatDate(iso, locale, { day: "numeric", month: "short", year: "numeric" });
}

export function hoursUntil(iso: string): number {
  return Math.max(0, (new Date(iso).getTime() - Date.now()) / 3600_000);
}

export function formatCountdown(label: string, hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  if (h <= 0 && m <= 0) return `${label} 0h`;
  if (h <= 0) return `${label} ${m}m`;
  return `${label} ${h}h ${m}m`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone;
  const visible = digits.slice(0, 4);
  const last = digits.slice(-2);
  return `${visible} •••• ${last}`;
}
