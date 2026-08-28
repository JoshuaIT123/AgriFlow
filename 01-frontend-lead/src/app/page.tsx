import Link from "next/link";
import Image from "next/image";
import { LandingClient } from "./landing-client";

const NAV = {
  how: "How it works",
  features: "Features",
  signin: "Sign in",
  start: "Get started",
};

const STEPS = [
  {
    image: "/images/steps/post-harvest.jpg",
    alt: "A farmer carrying a harvest of fresh crops",
    title: "Post your harvest",
    text: "Farmers list what they grow with quantity, quality and a fair price per kilo.",
  },
  {
    image: "/images/steps/agree-price.jpg",
    alt: "Fresh produce being sold at a market",
    title: "Agree a price",
    text: "Buyers browse the marketplace and make an offer. Farmers accept directly in-app.",
  },
  {
    image: "/images/steps/get-paid.jpg",
    alt: "Counting money for a completed sale",
    title: "Get paid on delivery",
    text: "Money is held securely in escrow and released to the farmer the moment delivery is confirmed.",
  },
];

const FEATURES = [
  {
    image: "/images/features/escrow.jpg",
    alt: "A secure vault",
    title: "Secure escrow",
    text: "Buyer funds are held safely and only released to the farmer when delivery is confirmed.",
  },
  {
    image: "/images/features/mobile-money.jpg",
    alt: "A mobile phone for mobile money",
    title: "Mobile Money",
    text: "Payments land straight on MTN & Airtel Mobile Money — no bank account needed.",
  },
  {
    image: "/images/features/auto-release.jpg",
    alt: "A clock counting down",
    title: "72h auto-release",
    text: "Every deal is finalised for the farmer within 72 hours, even if confirmation slips.",
  },
  {
    image: "/images/features/recurring.jpg",
    alt: "A calendar for recurring orders",
    title: "Recurring arrangements",
    text: "Regular buyers and farmers can set up standing supply agreements for steady income.",
  },
  {
    image: "/images/features/fair-pricing.jpg",
    alt: "Price tags on fresh produce",
    title: "Fair pricing",
    text: "Farmers set their own prices and see exactly what buyers will pay. No hidden middlemen.",
  },
  {
    image: "/images/features/built-for-farmers.jpg",
    alt: "Farmers working together in a field",
    title: "Built for farmers",
    text: "Designed around how farmers and buyers already work together.",
  },
];

const STATS = [
  { value: "100%", label: "of funds secured in escrow" },
  { value: "72h", label: "max time to settle" },
  { value: "2", label: "Mobile Money networks" },
];

const PRODUCTS = [
  {
    image: "/images/products/crops.jpg",
    alt: "Freshly harvested crops and tubers",
    name: "Crops & tubers",
    text: "Irish potatoes, sweet potatoes, cassava, maize and beans — sold by the kilo.",
  },
  {
    image: "/images/products/milk.jpg",
    alt: "Fresh milk from the farm",
    name: "Milk & dairy",
    text: "Fresh milk, yogurt and cheese — sold per litre, straight from the farm.",
  },
  {
    image: "/images/products/livestock.jpg",
    alt: "Cattle grazing on the farm",
    name: "Livestock",
    text: "Cattle, goats and sheep — sold per head, ready for the next market.",
  },
  {
    image: "/images/products/poultry.jpg",
    alt: "Chickens and fresh eggs",
    name: "Poultry & eggs",
    text: "Free-range chickens and eggs by the dozen, raised locally.",
  },
  {
    image: "/images/products/honey.jpg",
    alt: "A jar of raw honey",
    name: "Honey & beekeeping",
    text: "Raw honey and hive products, a growing source of farm income.",
  },
  {
    image: "/images/products/vegetables.jpg",
    alt: "Fresh vegetables and fruit",
    name: "Vegetables & fruit",
    text: "Tomatoes, cabbages, avocados, passion fruit and more off the vine.",
  },
];

export default function Home() {
  return (
    <div className="bg-[#f6f8f5] text-[#15241c] antialiased">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="#" className="flex items-center gap-2.5">
            <Image
              src="/images/logo.png"
              alt="AgriFlow logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl"
              priority
            />
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold">AgriFlow</span>
              <span className="block text-[11px] text-[#54705f]">
                Farming, paid on delivery
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[#3c5244] md:flex">
            <a href="#how" className="hover:text-[#1f7a4d]">
              {NAV.how}
            </a>
            <a href="#features" className="hover:text-[#1f7a4d]">
              {NAV.features}
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-black/10 px-1.5 py-1">
              <LandingClient />
            </div>
            <Link
              href="/login"
              className="hidden rounded-lg border border-[#1f7a4d] px-3.5 py-2 text-sm font-semibold text-[#1f7a4d] hover:bg-[#e3f1e8] sm:inline-block"
            >
              {NAV.signin}
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#1f7a4d] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#165c39]"
            >
              {NAV.start}
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
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b3d24]/80 via-[#0b3d24]/60 to-[#0b3d24]/85" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-center px-4 py-28 sm:px-6 md:py-40">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
            Built for farmers, made simple
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
            Paying farmers directly,{" "}
            <span className="text-lime-300">on delivery.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
            AgriFlow connects farmers and buyers. Post your produce, agree a
            fair price, and get paid securely through Mobile Money the moment
            your delivery is confirmed.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-lime-300 px-6 py-3 text-sm font-bold text-[#0b3d24] shadow-lg transition hover:bg-lime-200"
            >
              Get started free →
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
            <Link
              href="/ussd"
              className="rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              📱 Try USSD (*789#)
            </Link>
          </div>

          <div className="mt-14 grid w-full max-w-2xl grid-cols-3 gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur sm:p-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center sm:text-left">
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
      <section id="how" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#1f7a4d]">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            From harvest to payment in three steps
          </h2>
          <p className="mt-4 text-[#54705f]">
            A simple, transparent flow that protects both farmers and buyers at
            every stage.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="relative overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm"
            >
              <span className="absolute right-5 top-5 z-10 text-4xl font-black text-white/40">
                0{i + 1}
              </span>
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={step.image}
                  alt={step.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-7">
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#54705f]">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What farmers sell */}
      <section id="products" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1f7a4d]">
              What farmers sell
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              From crops to milk — everything a farmer can list
            </h2>
            <p className="mt-4 text-[#54705f]">
              Farmers post what they grow or raise, set a fair price, and let
              buyers make an offer. A few of the products moving through the
              marketplace today:
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((p) => (
              <div
                key={p.name}
                className="group overflow-hidden rounded-2xl border border-black/5 bg-[#fafbf9] transition hover:border-[#1f7a4d]/30 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-base font-semibold">{p.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#54705f]">
                    {p.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1f7a4d]">
              Features
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Everything you need to trade with confidence
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group overflow-hidden rounded-2xl border border-black/5 bg-[#fafbf9] transition hover:border-[#1f7a4d]/30 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={f.image}
                    alt={f.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#54705f]">
                    {f.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace preview */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="relative h-72 overflow-hidden rounded-3xl md:h-96">
            <Image
              src="/images/market.jpg"
              alt="A vibrant open-air produce market"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#1f7a4d]">
              The marketplace
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              A live market in your pocket
            </h2>
            <p className="mt-4 text-[#54705f]">
              Browse fresh produce posted by farmers everywhere, compare prices,
              and make an offer in seconds. Farmers see every offer and decide
              what&apos;s right for them.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Real-time produce listings with price per kilo",
                "Direct offers and transparent acceptance",
                "Everything tracked: product → offer → deal → payment",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#1f7a4d] text-[11px] text-white">
                    ✓
                  </span>
                  <span className="text-[#3c5244]">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-8 inline-block rounded-xl border border-[#1f7a4d] px-6 py-3 text-sm font-bold text-[#1f7a4d] transition hover:bg-[#e3f1e8]"
            >
              Explore the marketplace →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-[#0b3d24] text-white">
          <div className="relative">
            <div className="absolute inset-0 opacity-20">
              <Image
                src="/images/farmer2.jpg"
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
            <div className="relative mx-auto max-w-2xl px-6 py-16 text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Ready to grow your farm income?
              </h2>
              <p className="mt-4 text-white/80">
                Join AgriFlow today. Whether you grow or you buy, get paid and
                paid on time — securely, simply, in Mobile Money.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/register"
                  className="rounded-xl bg-lime-300 px-6 py-3 text-sm font-bold text-[#0b3d24] transition hover:bg-lime-200"
                >
                  Create your free account
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold transition hover:bg-white/10"
                >
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="AgriFlow logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg"
            />
            <span className="text-sm font-semibold">AgriFlow</span>
            <span className="text-[#54705f]">· Farming, paid on delivery</span>
          </div>
          <span className="text-sm text-[#54705f]">
            © {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  );
}
