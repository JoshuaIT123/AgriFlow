import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  Egg,
  Flower2,
  Handshake,
  Leaf,
  LockKeyhole,
  Milk,
  Package,
  Repeat,
  Scale,
  ShieldCheck,
  Smartphone,
  Sprout,
  Wallet,
  Wheat,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    image: "/images/steps/post-harvest.jpg",
    alt: "A farmer carrying a harvest of fresh crops",
    title: "Post your harvest",
    text: "Farmers list what they grow with quantity and a fair price per kilo.",
    icon: Sprout,
    accent: "from-emerald-500 to-emerald-700",
  },
  {
    image: "/images/steps/agree-price.jpg",
    alt: "Fresh produce being sold at a market",
    title: "Agree a price",
    text: "Buyers browse the marketplace and make an offer. Farmers accept directly in-app.",
    icon: Handshake,
    accent: "from-lime-500 to-emerald-600",
  },
  {
    image: "/images/steps/get-paid.jpg",
    alt: "Counting money for a completed sale",
    title: "Get paid on delivery",
    text: "Money is held securely in escrow and released to the farmer's payout channel the moment delivery is confirmed.",
    icon: Wallet,
    accent: "from-emerald-600 to-teal-700",
  },
];

const PRODUCTS = [
  {
    image: "/images/products/crops.jpg",
    alt: "Freshly harvested crops and tubers",
    name: "Crops & tubers",
    icon: Wheat,
    text: "Irish potatoes, sweet potatoes, cassava, maize and beans — sold by the kilo.",
  },
  {
    image: "/images/products/milk.jpg",
    alt: "Fresh milk from the farm",
    name: "Milk & dairy",
    icon: Milk,
    text: "Fresh milk, yogurt and cheese — sold per litre, straight from the farm.",
  },
  {
    image: "/images/products/livestock.jpg",
    alt: "Cattle grazing on the farm",
    name: "Livestock",
    icon: Sprout,
    text: "Cattle, goats and sheep — sold per head, ready for the next market.",
  },
  {
    image: "/images/products/poultry.jpg",
    alt: "Chickens and fresh eggs",
    name: "Poultry & eggs",
    icon: Egg,
    text: "Free-range chickens and eggs by the dozen, raised locally.",
  },
  {
    image: "/images/products/honey.jpg",
    alt: "A jar of raw honey",
    name: "Honey & beekeeping",
    icon: Flower2,
    text: "Raw honey and hive products, a growing source of farm income.",
  },
  {
    image: "/images/products/vegetables.jpg",
    alt: "Fresh vegetables and fruit",
    name: "Vegetables & fruit",
    icon: Leaf,
    text: "Tomatoes, cabbages, avocados, passion fruit and more off the vine.",
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Secure escrow",
    text: "Buyer funds are held safely and only released to the farmer when delivery is confirmed.",
    tile: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Smartphone,
    title: "Flexible payments",
    text: "Payouts land on Mobile Money today — bank transfer, cards and more channels plug in as new APIs come online.",
    tile: "bg-sky-100 text-sky-700",
  },
  {
    icon: Clock3,
    title: "72h auto-release",
    text: "Every deal is finalised for the farmer within 72 hours, even if confirmation slips.",
    tile: "bg-amber-100 text-amber-700",
  },
  {
    icon: Repeat,
    title: "Recurring arrangements",
    text: "Regular buyers and farmers can set up standing supply agreements for steady income.",
    tile: "bg-violet-100 text-violet-700",
  },
  {
    icon: Scale,
    title: "Fair pricing",
    text: "Farmers set their own prices and see exactly what buyers will pay. No hidden middlemen.",
    tile: "bg-rose-100 text-rose-700",
  },
  {
    icon: LockKeyhole,
    title: "Built to be trusted",
    text: "Lightning-quick settlement, clear status at every step, designed around how farmers already trade.",
    tile: "bg-teal-100 text-teal-700",
  },
];

const STATS = [
  { value: "100%", label: "of funds secured in escrow" },
  { value: "72h", label: "max time to settle" },
  { value: "3+", label: "payout networks, growing" },
];

export default function Home() {
  return (
    <div className="bg-background text-foreground antialiased">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#" className="flex items-center gap-2.5">
            <Image
              src="/images/logo.png"
              alt="AgriFlow logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl object-cover shadow-sm"
              priority
            />
            <span className="leading-tight">
              <span className="block text-[15px] font-bold tracking-tight">
                AgriFlow
              </span>
              <span className="block text-[11px] font-medium text-muted-foreground">
                Farming, paid on delivery
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a
              href="#products"
              className="transition-colors hover:text-foreground"
            >
              What farmers sell
            </a>
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Features
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-farmers.jpg"
            alt="Farmers working together in the field"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#06281a]/95 via-[#0b3d24]/85 to-[#0b3d24]/70" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-center px-4 py-20 sm:px-6 md:py-28">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur">
            Escrow-secured · Flexible payouts · Lightning-powered
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl">
            The marketplace{" "}
            <span className="text-lime-300">that pays farmers</span> on
            delivery.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
            AgriFlow connects farmers directly to buyers — post produce, compare
            offers, negotiate in-app, and get paid. Every payment is secured in
            escrow and released the moment delivery is confirmed, through Mobile
            Money today and more payout options as new partners come online.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/register">
              <Button variant="lime" size="lg" className="text-emerald-950">
                Get started free
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Sign in
              </Button>
            </Link>
            <Link href="/ussd">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Smartphone size={18} />
                Try USSD (*789#)
              </Button>
            </Link>
          </div>

          <div className="mt-14 grid w-full max-w-2xl grid-cols-3 gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur sm:p-6">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="text-center sm:text-left"
              >
                <div className="text-2xl font-bold text-white sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 text-xs leading-snug text-white/70">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            From harvest to payment in three steps
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            A simple, transparent flow that protects both farmers and buyers at
            every stage.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={step.image}
                    alt={step.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <span className="absolute right-5 top-5 rounded-full bg-black/50 px-3 py-1 font-mono text-xs font-bold text-white backdrop-blur">
                    Step {i + 1}
                  </span>
                </div>
                <div className="p-7">
                  <div
                    className={`mb-4 inline-grid size-11 place-items-center rounded-xl bg-gradient-to-br ${step.accent} text-white shadow-sm`}
                  >
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* What farmers sell */}
      <section id="products" className="border-y border-border bg-card/40 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                What farmers sell
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                From crops to milk — everything a farmer can list
              </h2>
              <p className="mt-4 text-muted-foreground">
                Farmers post what they grow or raise, set a fair price, and let
                buyers make an offer. A few of the products moving through the
                marketplace today.
              </p>
            </div>
            <BadgeCheck
              size={20}
              className="hidden shrink-0 text-primary md:block"
              aria-hidden
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.name}
                  className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={p.image}
                      alt={p.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute left-4 top-4 grid size-9 place-items-center rounded-full bg-white/90 text-primary shadow-sm backdrop-blur">
                      <Icon size={17} />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-base font-bold tracking-tight">
                      {p.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {p.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Marketplace preview */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="relative h-72 overflow-hidden rounded-3xl shadow-lg md:h-96">
            <Image
              src="/images/market.jpg"
              alt="A vibrant open-air produce market"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              The marketplace
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              A live market in your pocket
            </h2>
            <p className="mt-4 text-muted-foreground">
              Browse fresh produce posted by farmers everywhere, compare prices,
              and make an offer in seconds. Farmers see every offer and decide
              what&apos;s right for them.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Real-time produce listings with price per kilo",
                "Direct offers, negotiation and transparent acceptance",
                "Everything tracked: product → offer → deal → payment",
                "Payouts through the channel that works for the farmer",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] text-white">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/register" className="mt-8 inline-block">
              <Button variant="outline" size="lg">
                Explore the marketplace
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-y border-border bg-card/40 py-20 md:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Features
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to trade with confidence
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built around trust, transparency and instant settlement — designed
              for how farmers and buyers actually work.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-3xl border border-border bg-card p-7 shadow-sm"
                >
                  <div
                    className={`mb-5 inline-grid size-12 place-items-center rounded-2xl ${f.tile}`}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 className="text-base font-bold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
        <div className="overflow-hidden rounded-[2rem] bg-emerald-950 text-white shadow-xl">
          <div className="relative">
            <div className="absolute inset-0 opacity-15">
              <Image
                src="/images/farmer2.jpg"
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -right-24 -top-24 size-72 rounded-full bg-lime-300/15 blur-3xl" />
            <div className="relative mx-auto max-w-2xl px-6 py-16 text-center md:py-20">
              <Package
                size={28}
                className="mx-auto mb-5 text-lime-300"
                aria-hidden
              />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to grow your farm income?
              </h2>
              <p className="mt-4 text-white/80">
                Join AgriFlow today. Whether you grow or you buy, get paid and
                paid on time — securely, simply, in the way that works best for
                you.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/register">
                  <Button variant="lime" size="lg" className="text-emerald-950">
                    Create your free account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    I already have an account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}