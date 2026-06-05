import { useState, useEffect } from 'react';
import { fetchRoller } from './api.js';
import {
  Search,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  Building2,
  Users,
  UserRound,
  Landmark,
  Calculator,
  Contact,
  KeyRound,
  ShieldCheck,
  TriangleAlert,
  FlaskConical,
  LoaderCircle,
  Hash,
  CalendarDays,
  Fingerprint,
  Activity,
  Sun,
  Moon,
} from 'lucide-react';

const ORGNR_PATTERN = /^\d{9}$/;

// Distinkte aksentpaletter – hver rollegruppe får sin egen farge.
const PALETTES = [
  { ring: '#34d399', glow: '52,211,153', text: 'text-emerald-300' },
  { ring: '#a78bfa', glow: '139,92,246', text: 'text-violet-300' },
  { ring: '#22d3ee', glow: '34,211,238', text: 'text-cyan-300' },
  { ring: '#fbbf24', glow: '251,191,36', text: 'text-amber-300' },
  { ring: '#f472b6', glow: '244,114,182', text: 'text-pink-300' },
  { ring: '#60a5fa', glow: '96,165,250', text: 'text-blue-300' },
];

const KODE_ICON = {
  DAGL: UserRound,
  STYR: Landmark,
  LEDE: ShieldCheck,
  NEST: ShieldCheck,
  MEDL: Users,
  VARA: Users,
  DELT: Users,
  REGN: Calculator,
  REVI: Calculator,
  KONT: Contact,
  KOMP: Contact,
  INNH: KeyRound,
};

const iconForKode = (kode) => KODE_ICON[kode] || Building2;
const paletteFor = (i) => PALETTES[i % PALETTES.length];

export default function App() {
  const [orgnr, setOrgnr] = useState('');
  const [validationError, setValidationError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [data, setData] = useState(null);
  const [searchedOrgnr, setSearchedOrgnr] = useState('');
  const [theme, setTheme] = useState(() => {
    const saved =
      typeof localStorage !== 'undefined' && localStorage.getItem('theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* ignorer */
    }
  }, [theme]);

  function handleChange(e) {
    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
    setOrgnr(value);
    if (validationError) setValidationError('');
  }

  // Felles søkelogikk – uendret oppførsel, bare parameterisert.
  async function runSearch(value) {
    if (!ORGNR_PATTERN.test(value)) {
      setValidationError('Organisasjonsnummeret må bestå av nøyaktig 9 siffer.');
      return;
    }
    setStatus('loading');
    setErrorMessage('');
    setData(null);
    setSearchedOrgnr(value);
    try {
      const result = await fetchRoller(value);
      setData(result);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    runSearch(orgnr);
  }

  function handleTry(value) {
    setOrgnr(value);
    setValidationError('');
    runSearch(value);
  }

  const rollegrupper = data?.rollegrupper ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <TestStrip />
      <SiteHeader theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <Hero
          orgnr={orgnr}
          onChange={handleChange}
          onSubmit={handleSubmit}
          loading={status === 'loading'}
          validationError={validationError}
          onTry={handleTry}
          showHint={status === 'idle'}
        />

        <div className="mt-10">
          {status === 'loading' && <LoadingState />}

          {status === 'error' && (
            <StateCard
              tone="danger"
              icon={TriangleAlert}
              title="Kunne ikke hente roller"
            >
              {errorMessage}
            </StateCard>
          )}

          {status === 'success' && rollegrupper.length === 0 && (
            <StateCard
              tone="info"
              icon={Search}
              title="Ingen roller funnet"
            >
              Vi fant ingen registrerte roller for organisasjonsnummer{' '}
              <span className="font-mono text-fg">{formatOrgnr(searchedOrgnr)}</span>.
            </StateCard>
          )}

          {status === 'success' && rollegrupper.length > 0 && (
            <Results orgnr={searchedOrgnr} rollegrupper={rollegrupper} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ───────────────────────── Chrome ───────────────────────── */

function TestStrip() {
  return (
    <div className="w-full border-b border-line bg-amber-400/[0.06] backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2.5 text-xs sm:text-sm">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
        </span>
        <FlaskConical className="h-4 w-4 text-amber-400 shrink-0" />
        <p className="text-fg-muted">
          <span className="font-semibold text-amber-300">Testmiljø · TT02.</span>{' '}
          Ikke produksjon – alle data er fiktive testdata fra Brreg PPE.
        </p>
      </div>
    </div>
  );
}

function SiteHeader({ theme, onToggleTheme }) {
  return (
    <header className="w-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-glow-violet">
            <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] uppercase tracking-[0.2em] text-fg-faint">
              Enhetsregisteret
            </p>
            <p className="text-base font-extrabold text-fg">Rolleoppslag</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Bytt til lyst tema' : 'Bytt til mørkt tema'}
          className="ring-glow group relative grid h-10 w-10 place-items-center rounded-xl glass hover:bg-[var(--surface-hover)]"
        >
          {theme === 'dark' ? (
            <Sun className="h-[18px] w-[18px] text-amber-300 transition-transform group-hover:rotate-45" />
          ) : (
            <Moon className="h-[18px] w-[18px] text-violet-500 transition-transform group-hover:-rotate-12" />
          )}
        </button>
      </div>
    </header>
  );
}

/* ───────────────────────── Hero + søk ───────────────────────── */

function Hero({ orgnr, onChange, onSubmit, loading, validationError, onTry, showHint }) {
  const hasError = Boolean(validationError);
  return (
    <section className="relative pt-8 sm:pt-14">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs font-medium text-fg-muted">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          Maskinporten · autorisert API
        </span>
        <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-fg">
          Finn roller bak en{' '}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
            virksomhet
          </span>
        </h1>
        <p className="mt-4 text-fg-muted text-base sm:text-lg">
          Slå opp daglig leder, styre, deltakere og regnskapsfører med ett
          organisasjonsnummer.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        className="mt-8 max-w-2xl mx-auto"
      >
        <div className="group relative rounded-2xl">
          {/* Fokusglød rundt hele søkefeltet */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-violet-500/50 via-fuchsia-500/40 to-cyan-400/50 opacity-0 blur-md transition-opacity duration-300 group-focus-within:opacity-100"
          />
          <div className="relative flex flex-col sm:flex-row items-stretch gap-2 rounded-2xl glass p-2">
            <div className="flex flex-1 items-center gap-3 px-3">
              <Search className="h-5 w-5 shrink-0 text-fg-faint" />
              <input
                id="orgnr"
                name="orgnr"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={orgnr}
                onChange={onChange}
                aria-invalid={hasError}
                placeholder="9-sifret organisasjonsnummer"
                className="w-full bg-transparent py-3 text-lg font-mono tracking-[0.15em] text-fg placeholder:text-fg-faint placeholder:tracking-normal placeholder:font-sans focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3 font-semibold text-white transition-transform active:scale-[0.97] disabled:opacity-70 disabled:active:scale-100"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500" />
              <span className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
              <span className="absolute -inset-y-8 -left-1/2 w-1/3 rotate-12 bg-white/25 blur-md opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100 group-hover/btn:animate-shimmer" />
              <span className="relative flex items-center gap-2 whitespace-nowrap">
                {loading ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-0.5" />
                )}
                {loading ? 'Henter…' : 'Hent roller'}
              </span>
            </button>
          </div>
        </div>

        {hasError && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-medium text-rose-400" role="alert">
            <TriangleAlert className="h-4 w-4" />
            {validationError}
          </p>
        )}

        {showHint && !hasError && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-fg-faint">
            <span>Prøv et testnummer:</span>
            <button
              type="button"
              onClick={() => onTry('310343013')}
              className="font-mono rounded-md border border-line px-2 py-0.5 text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              310 343 013
            </button>
          </div>
        )}
      </form>
    </section>
  );
}

/* ───────────────────────── Resultater ───────────────────────── */

function Results({ orgnr, rollegrupper }) {
  const totalRoller = rollegrupper.reduce(
    (sum, g) => sum + (g.roller?.length ?? 0),
    0,
  );
  // Største gruppe blir "featured" i bento-rutenettet.
  let featuredIdx = 0;
  rollegrupper.forEach((g, i) => {
    if ((g.roller?.length ?? 0) > (rollegrupper[featuredIdx].roller?.length ?? 0)) {
      featuredIdx = i;
    }
  });

  return (
    <section aria-live="polite" className="animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-fg-faint">
            Resultat
          </p>
          <h2 className="mt-1 text-2xl font-bold text-fg">
            Roller for{' '}
            <span className="font-mono text-violet-300">{formatOrgnr(orgnr)}</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Stat label="grupper" value={rollegrupper.length} />
          <Stat label="roller" value={totalRoller} />
        </div>
      </div>

      <div className="mt-6">
        <RelationshipMap orgnr={orgnr} rollegrupper={rollegrupper} />
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 [grid-auto-flow:dense]">
        {rollegrupper.map((gruppe, i) => (
          <RoleGroupCard
            key={(gruppe.type?.kode ?? 'g') + i}
            gruppe={gruppe}
            palette={paletteFor(i)}
            featured={i === featuredIdx}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl glass px-3.5 py-2 text-center">
      <p className="text-lg font-bold leading-none text-fg">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-fg-faint">
        {label}
      </p>
    </div>
  );
}

function RelationshipMap({ orgnr, rollegrupper }) {
  const n = rollegrupper.length;
  const rx = n <= 2 ? 26 : 37;
  const ry = 33;
  const nodes = rollegrupper.map((g, i) => {
    const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
    return {
      x: 50 + rx * Math.cos(angle),
      y: 50 + ry * Math.sin(angle),
      gruppe: g,
      palette: paletteFor(i),
    };
  });

  return (
    <div className="relative h-[320px] sm:h-[380px] overflow-hidden rounded-3xl glass ring-glow p-4">
      <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-fg-faint">
        <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
        Relasjonskart
      </div>

      {/* Forbindelseslinjer */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <radialGradient id="hub" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.35)" />
            <stop offset="100%" stopColor="rgba(139,92,246,0)" />
          </radialGradient>
        </defs>
        <circle cx="50%" cy="50%" r="120" fill="url(#hub)" />
        {nodes.map((node, i) => (
          <line
            key={i}
            x1="50%"
            y1="50%"
            x2={`${node.x}%`}
            y2={`${node.y}%`}
            stroke={node.palette.ring}
            strokeWidth="1.5"
            strokeOpacity="0.45"
            strokeDasharray="2 6"
            strokeLinecap="round"
            className="animate-dash-flow"
          />
        ))}
      </svg>

      {/* Sentralnode: virksomheten */}
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="ring-glow flex flex-col items-center gap-1 rounded-2xl bg-surface/90 px-5 py-3 shadow-glow-violet">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <p className="font-mono text-sm font-semibold text-fg">
            {formatOrgnr(orgnr)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-fg-faint">
            Virksomhet
          </p>
        </div>
      </div>

      {/* Rollegruppe-noder */}
      {nodes.map((node, i) => {
        const Icon = iconForKode(node.gruppe.type?.kode);
        const count = node.gruppe.roller?.length ?? 0;
        return (
          <div
            key={i}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 animate-float"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            <div className="flex items-center gap-2 rounded-full glass px-3 py-1.5 ring-glow">
              <span
                className="grid h-6 w-6 place-items-center rounded-full"
                style={{
                  backgroundColor: `rgba(${node.palette.glow},0.16)`,
                  color: node.palette.ring,
                }}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-semibold text-fg max-w-[7rem] truncate">
                {node.gruppe.type?.beskrivelse ?? node.gruppe.type?.kode}
              </span>
              <span
                className="rounded-full px-1.5 text-[10px] font-bold"
                style={{
                  backgroundColor: `rgba(${node.palette.glow},0.16)`,
                  color: node.palette.ring,
                }}
              >
                {count}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RoleGroupCard({ gruppe, palette, featured, index }) {
  const Icon = iconForKode(gruppe.type?.kode);
  const roller = gruppe.roller ?? [];
  const tittel = gruppe.type?.beskrivelse ?? gruppe.type?.kode ?? 'Rollegruppe';

  return (
    <div
      className={`ring-glow group relative overflow-hidden rounded-2xl glass p-5 animate-fade-up hover:-translate-y-1 ${
        featured ? 'sm:col-span-2' : ''
      }`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Fargeglød i hjørnet */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-40 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
        style={{ background: `radial-gradient(circle, rgba(${palette.glow},0.55), transparent 70%)` }}
      />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
            style={{
              backgroundColor: `rgba(${palette.glow},0.14)`,
              color: palette.ring,
              border: `1px solid rgba(${palette.glow},0.3)`,
            }}
          >
            <Icon className="h-[22px] w-[22px]" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-bold text-fg">{tittel}</h3>
            <p className="text-xs text-fg-faint">
              {roller.length} {roller.length === 1 ? 'rolle' : 'roller'}
            </p>
          </div>
        </div>
        <KodeBadge kode={gruppe.type?.kode} palette={palette} />
      </div>

      <div className={`relative mt-4 ${featured ? 'grid sm:grid-cols-2 gap-3' : 'space-y-3'}`}>
        {roller.map((rolle, i) => (
          <RoleEntry key={i} rolle={rolle} palette={palette} />
        ))}
      </div>
    </div>
  );
}

function RoleEntry({ rolle, palette }) {
  const innehaver = describeHolder(rolle);
  const rolleNavn = rolle.type?.beskrivelse ?? rolle.type?.kode ?? 'Rolle';

  return (
    <div className="rounded-xl border border-line bg-[var(--input-bg)] p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-fg leading-tight">{innehaver.primary}</p>
        <span className="shrink-0 rounded-md bg-[var(--surface-hover)] px-2 py-0.5 text-[11px] font-medium text-fg-muted">
          {rolleNavn}
        </span>
      </div>

      {innehaver.details.length > 0 && (
        <dl className="mt-2.5 space-y-1.5">
          {innehaver.details.map((d) => (
            <DetailRow key={d.label} {...d} palette={palette} />
          ))}
        </dl>
      )}

      {(rolle.fratraadt || rolle.avregistrert || rolle.person?.erDoed || rolle.enhet?.erSlettet) && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {rolle.fratraadt && <StatusPill>Fratrådt</StatusPill>}
          {rolle.avregistrert && <StatusPill>Avregistrert</StatusPill>}
          {rolle.person?.erDoed && <StatusPill>Død</StatusPill>}
          {rolle.enhet?.erSlettet && <StatusPill>Slettet</StatusPill>}
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, copyable, palette }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 shrink-0 text-fg-faint" />
      <dt className="text-fg-faint">{label}</dt>
      <dd className="ml-auto flex items-center gap-1.5 min-w-0">
        <span className={copyable ? 'font-mono tabular-nums text-fg' : 'text-fg-muted'}>
          {value}
        </span>
        {copyable && <CopyButton value={value} label={label} palette={palette} />}
      </dd>
    </div>
  );
}

function CopyButton({ value, label, palette }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* utklippstavle ikke tilgjengelig */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Kopier ${label}`}
      className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-line transition-colors hover:bg-[var(--surface-hover)]"
      style={copied ? { color: '#34d399', borderColor: 'rgba(52,211,153,0.5)' } : { color: palette?.ring }}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 animate-fade-in" strokeWidth={3} />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function KodeBadge({ kode, palette }) {
  if (!kode) return null;
  return (
    <span
      className="shrink-0 rounded-md px-2 py-1 font-mono text-[11px] font-bold tracking-wider"
      style={{
        backgroundColor: `rgba(${palette.glow},0.14)`,
        color: palette.ring,
        border: `1px solid rgba(${palette.glow},0.3)`,
      }}
    >
      {kode}
    </span>
  );
}

function StatusPill({ children }) {
  return (
    <span className="inline-flex items-center rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
      {children}
    </span>
  );
}

/* ───────────────────────── Tilstander ───────────────────────── */

function LoadingState() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Henter roller…</span>
      <div className="h-[320px] sm:h-[380px] rounded-3xl glass mb-5">
        <Shimmer className="h-full w-full rounded-3xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl glass p-5">
            <div className="flex items-center gap-3">
              <Shimmer className="h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-3.5 w-2/3 rounded" />
                <Shimmer className="h-3 w-1/3 rounded" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Shimmer className="h-12 w-full rounded-xl" />
              <Shimmer className="h-12 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Shimmer({ className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-[var(--surface-hover)] ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

function StateCard({ tone = 'info', icon: Icon, title, children }) {
  const accent =
    tone === 'danger'
      ? { color: '#fb7185', glow: '251,113,133' }
      : { color: '#22d3ee', glow: '34,211,238' };
  return (
    <div className="mx-auto max-w-xl rounded-2xl glass ring-glow p-6 text-center animate-fade-up">
      <span
        className="mx-auto grid h-12 w-12 place-items-center rounded-2xl"
        style={{
          backgroundColor: `rgba(${accent.glow},0.14)`,
          color: accent.color,
          border: `1px solid rgba(${accent.glow},0.3)`,
        }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-lg font-bold text-fg">{title}</h3>
      <p className="mt-1.5 text-sm text-fg-muted">{children}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-sm text-fg-faint">
        Data hentes fra Brønnøysundregistrenes autoriserte API (PPE/test) via
        Maskinporten.
      </div>
    </footer>
  );
}

/* ───────────────────────── Data-mapping (uendret) ───────────────────────── */

function describeHolder(rolle) {
  if (rolle.person) {
    const n = rolle.person.navn ?? {};
    const fulltNavn = [n.fornavn, n.mellomnavn, n.etternavn]
      .filter(Boolean)
      .join(' ');
    const details = [];
    if (rolle.person.fodselsnummer) {
      details.push({
        icon: Fingerprint,
        label: 'Fødselsnr.',
        value: rolle.person.fodselsnummer,
        copyable: true,
      });
    }
    if (rolle.person.fodselsdato) {
      details.push({
        icon: CalendarDays,
        label: 'Født',
        value: rolle.person.fodselsdato,
      });
    }
    return { primary: fulltNavn || 'Ukjent person', details };
  }
  if (rolle.enhet) {
    const navn = Array.isArray(rolle.enhet.navn)
      ? rolle.enhet.navn.join(' ')
      : rolle.enhet.navn;
    const details = [];
    if (rolle.enhet.organisasjonsnummer) {
      details.push({
        icon: Hash,
        label: 'Org.nr',
        value: rolle.enhet.organisasjonsnummer,
        copyable: true,
      });
    }
    if (rolle.enhet.organisasjonsform?.beskrivelse) {
      details.push({
        icon: Building2,
        label: 'Form',
        value: rolle.enhet.organisasjonsform.beskrivelse,
      });
    }
    return { primary: navn || 'Ukjent virksomhet', details };
  }
  return { primary: 'Ukjent', details: [] };
}

function formatOrgnr(orgnr) {
  if (!orgnr || orgnr.length !== 9) return orgnr;
  return `${orgnr.slice(0, 3)} ${orgnr.slice(3, 6)} ${orgnr.slice(6)}`;
}
