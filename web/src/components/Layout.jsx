const TABS = [
  { id: "search", label: "Search", icon: "M21 21l-5.2-5.2m2.7-6.3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "filters", label: "Filters", icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.6a1 1 0 01-.3.7l-6.2 6.2v5a1 1 0 01-.4.8l-4 3A1 1 0 018 21.5v-8.6L1.8 6.7A1 1 0 011.5 6V4z" },
  { id: "sales", label: "Sales", icon: "M12 8c-1.7 0-3 .9-3 2s1.3 2 3 2 3 .9 3 2-1.3 2-3 2m0-8V6m0 8v2M5 12h14" },
];

export default function Layout({ children, tab, onTabChange }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 py-3">
        <h1 className="text-lg font-bold tracking-tight text-amber-400">
          Snout
        </h1>
      </header>

      {/* Content */}
      <main className="flex-1 pb-16">{children}</main>

      {/* Footer */}
      <div className="fixed bottom-[49px] left-0 right-0 z-10 border-t border-slate-800 bg-slate-900/95 backdrop-blur px-4 py-1.5 text-center text-[0.65rem] text-slate-600">
        <a
          href="https://buymeacoffee.com/stephenbeale"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-amber-400 transition-colors"
        >
          Buy me a coffee
        </a>
        <span className="mx-1.5 text-slate-700">|</span>
        Finding good deals? Earn cashback with{" "}
        <a
          href="QUIDCO_REFERRAL_URL"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-amber-400 transition-colors"
        >
          Quidco
        </a>
        <span className="ml-1 text-slate-600/60 text-[0.55rem]">(referral link)</span>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                tab === t.id
                  ? "text-amber-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={t.icon}
                />
              </svg>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
