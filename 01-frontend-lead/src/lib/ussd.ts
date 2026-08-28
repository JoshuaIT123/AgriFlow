import type { Locale } from "./types";

/*
 * USSD session model for the demo.
 *
 * A real gateway is stateless per request: the network sends the accumulated
 * input string and the service replies with either CON (menu continues) or
 * END (session closes). This mirrors that shape so the flow shown on stage is
 * the same flow a gateway would drive - only the transport is faked.
 */

export type UssdKind = "CON" | "END";

export interface UssdScreen {
  kind: UssdKind;
  title: string;
  body: string[];
  /** Set when the screen hands off to the web app. */
  handoff?: boolean;
}

export interface UssdState {
  /** Menu path so far, e.g. ["1", "2"]. */
  path: string[];
  locale: Locale | null;
}

const T = {
  en: {
    welcome: "AgriFlow",
    chooseLang: ["1. English", "2. Kinyarwanda"],
    main: "AgriFlow Main Menu",
    mainItems: [
      "1. Sell produce",
      "2. Market prices",
      "3. My offers",
      "4. Wallet balance",
      "5. Open AgriFlow app",
    ],
    sell: "Choose produce",
    sellItems: ["1. Irish potatoes", "2. Maize", "3. Beans", "4. Coffee"],
    qty: "Enter quantity (kg)",
    price: "Enter price per kg (RWF)",
    listed: "Listed on AgriFlow.",
    listedBody: [
      "Buyers in Kigali can",
      "see it now.",
      "SMS confirmation sent.",
    ],
    prices: "Market prices today",
    priceItems: [
      "Irish potatoes 1,800/kg",
      "Maize          1,200/kg",
      "Beans          2,000/kg",
      "Coffee         6,000/kg",
    ],
    offers: "Offer received",
    offerItems: [
      "Cafe du Rift",
      "100kg coffee @ 6,200",
      "Total: 620,000 RWF",
      "",
      "1. Accept   2. Reject",
    ],
    accepted: "Offer accepted.",
    acceptedBody: [
      "Buyer will pay over",
      "Bitcoin Lightning.",
      "Funds held until you",
      "confirm delivery.",
    ],
    rejected: "Offer rejected.",
    rejectedBody: ["The buyer has been", "notified."],
    wallet: "Wallet balance",
    walletItems: [
      "Available: 610,000 RWF",
      "In escrow:  240,000 RWF",
      "",
      "Paid via Lightning.",
    ],
    handoff: "Opening AgriFlow...",
    handoffBody: ["Continue on the app", "for the full marketplace."],
    invalid: "Invalid choice.",
    invalidBody: ["Please try again."],
    back: "0. Back",
  },
  rw: {
    welcome: "AgriFlow",
    chooseLang: ["1. Icyongereza", "2. Ikinyarwanda"],
    main: "Urutonde rwa AgriFlow",
    mainItems: [
      "1. Kugurisha umusaruro",
      "2. Ibiciro by'isoko",
      "3. Ibyifuzo byanjye",
      "4. Amafaranga",
      "5. Fungura porogaramu",
    ],
    sell: "Hitamo umusaruro",
    sellItems: ["1. Ibirayi", "2. Ibigori", "3. Ibishyimbo", "4. Ikawa"],
    qty: "Andika ingano (kg)",
    price: "Andika igiciro kuri kg (RWF)",
    listed: "Byashyizwe ku isoko.",
    listedBody: [
      "Abaguzi bo mu Kigali",
      "barabibona nonaha.",
      "SMS yoherejwe.",
    ],
    prices: "Ibiciro by'uyu munsi",
    priceItems: [
      "Ibirayi     1,800/kg",
      "Ibigori     1,200/kg",
      "Ibishyimbo  2,000/kg",
      "Ikawa       6,000/kg",
    ],
    offers: "Icyifuzo cyakiriwe",
    offerItems: [
      "Cafe du Rift",
      "100kg ikawa @ 6,200",
      "Byose: 620,000 RWF",
      "",
      "1. Emera   2. Anga",
    ],
    accepted: "Icyifuzo cyemewe.",
    acceptedBody: [
      "Umuguzi azishyura",
      "hakoreshejwe Lightning.",
      "Amafaranga abikwa kugeza",
      "wemeje ko byatanzwe.",
    ],
    rejected: "Icyifuzo cyanzwe.",
    rejectedBody: ["Umuguzi yamenyeshejwe."],
    wallet: "Amafaranga yawe",
    walletItems: [
      "Ahari:    610,000 RWF",
      "Abitswe:  240,000 RWF",
      "",
      "Yishyuwe na Lightning.",
    ],
    handoff: "Gufungura AgriFlow...",
    handoffBody: ["Komeza kuri porogaramu", "kugira ngo ubone byose."],
    invalid: "Amahitamo atariyo.",
    invalidBody: ["Ongera ugerageze."],
    back: "0. Subira inyuma",
  },
} as const;

export const USSD_CODE = "*789#";

/**
 * Resolves the accumulated input into a screen.
 *
 * Kept as one pure function of (locale, path) so any step can be replayed or
 * rewound - useful on stage when a demo needs to jump back a level.
 */
export function resolveScreen(state: UssdState): UssdScreen {
  const { path, locale } = state;

  if (!locale) {
    return {
      kind: "CON",
      title: T.en.welcome,
      body: ["Choose language /", "Hitamo ururimi", "", ...T.en.chooseLang],
    };
  }

  const t = T[locale];
  const [first, ...rest] = path;

  if (path.length === 0) {
    return { kind: "CON", title: t.main, body: [...t.mainItems] };
  }

  switch (first) {
    case "1": {
      // Sell: crop -> quantity -> price -> confirmation
      if (rest.length === 0) {
        return { kind: "CON", title: t.sell, body: [...t.sellItems, "", t.back] };
      }
      if (rest.length === 1) return { kind: "CON", title: t.qty, body: [] };
      if (rest.length === 2) return { kind: "CON", title: t.price, body: [] };
      const crop = t.sellItems[Number(rest[0]) - 1] ?? t.sellItems[0];
      return {
        kind: "END",
        title: t.listed,
        body: [crop.replace(/^\d+\.\s*/, ""), `${rest[1]}kg @ ${rest[2]} RWF`, "", ...t.listedBody],
      };
    }

    case "2":
      return { kind: "CON", title: t.prices, body: [...t.priceItems, "", t.back] };

    case "3": {
      if (rest.length === 0) {
        return { kind: "CON", title: t.offers, body: [...t.offerItems, "", t.back] };
      }
      if (rest[0] === "1") {
        return { kind: "END", title: t.accepted, body: [...t.acceptedBody] };
      }
      if (rest[0] === "2") {
        return { kind: "END", title: t.rejected, body: [...t.rejectedBody] };
      }
      return { kind: "CON", title: t.invalid, body: [...t.invalidBody, "", t.back] };
    }

    case "4":
      return { kind: "CON", title: t.wallet, body: [...t.walletItems, "", t.back] };

    case "5":
      return { kind: "END", title: t.handoff, body: [...t.handoffBody], handoff: true };

    default:
      return { kind: "CON", title: t.invalid, body: [...t.invalidBody, "", t.back] };
  }
}

/** True when the current step expects free text rather than a menu choice. */
export function expectsFreeText(state: UssdState): boolean {
  return state.locale !== null && state.path[0] === "1" && state.path.length >= 2 && state.path.length <= 3;
}
