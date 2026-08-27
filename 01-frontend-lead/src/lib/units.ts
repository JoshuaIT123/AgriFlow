import type { Unit } from "./types";

const DEFAULT_UNIT: Unit = "kg";

/** Resolve a product's unit, defaulting to "kg" for backward compatibility. */
export function unitOf(unit?: Unit | null): Unit {
  return unit ?? DEFAULT_UNIT;
}

/** Short display label for a unit, e.g. "kg", "per head", "per litre". */
export function unitLabel(unit: Unit | undefined | null): string {
  switch (unitOf(unit)) {
    case "head":
      return "per head";
    case "litre":
      return "per litre";
    case "crate":
      return "per crate";
    case "dozen":
      return "per dozen";
    case "bunch":
      return "per bunch";
    case "unit":
      return "each";
    case "kg":
    default:
      return "per kg";
  }
}

/** Short symbol for a unit, e.g. "kg", "hd", "L". */
export function unitSymbol(unit: Unit | undefined | null): string {
  switch (unitOf(unit)) {
    case "head":
      return "hd";
    case "litre":
      return "L";
    case "crate":
      return "crate";
    case "dozen":
      return "dozen";
    case "bunch":
      return "bunch";
    case "unit":
      return "ea";
    case "kg":
    default:
      return "kg";
  }
}

/** Localized unit label used by the i18n translate function. */
export function unitKey(unit: Unit | undefined | null): string {
  switch (unitOf(unit)) {
    case "head":
      return "unit.head";
    case "litre":
      return "unit.litre";
    case "crate":
      return "unit.crate";
    case "dozen":
      return "unit.dozen";
    case "bunch":
      return "unit.bunch";
    case "unit":
      return "unit.each";
    case "kg":
    default:
      return "unit.kg";
  }
}

/** Product row icon, chosen by category so livestock/dairy look right. */
export function productIcon(category?: string | null, unit?: Unit | null): string {
  const c = (category || "").toLowerCase();
  if (c.includes("livestock") || unitOf(unit) === "head") return "🐄";
  if (c.includes("poultry")) return "🐔";
  if (c.includes("dairy") || unitOf(unit) === "litre") return "🥛";
  return "🌾";
}
