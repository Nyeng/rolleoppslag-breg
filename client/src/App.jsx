import { useState, useEffect } from 'react';
import { fetchRoller, fetchEnhet, fetchTilfeldig } from './api.js';

const ORGNR_PATTERN = /^\d{9}$/;

// Offisielle rollekoder fra Enhetsregisteret med norske beskrivelser.
// Brukes som fallback/override når API-et mangler eller gir kryptisk tekst.
const ROLLE_BESKRIVELSER = {
  // Rollegruppe-koder
  DAGL: 'Daglig leder',
  STYR: 'Styre',
  DELT: 'Deltakere',
  REGN: 'Regnskapsfører',
  REVI: 'Revisor',
  SIGN: 'Signatur',
  PROK: 'Prokura',
  KOMP: 'Komplementar',
  INNH: 'Innehaver',
  KONT: 'Kontaktperson',
  BEST: 'Bestyrende reder',
  REPR: 'Norsk representant',
  BOBE: 'Bostyrer',
  FFØR: 'Forretningsfører',
  // Individuelle rolletype-koder
  LEDE: 'Styrets leder',
  NEST: 'Nestleder',
  MEDL: 'Styremedlem',
  VARA: 'Varamedlem',
  DTPR: 'Deltaker med proratarisk ansvar',
  DTSO: 'Deltaker med solidarisk ansvar',
  OBS:  'Observatør',
  SAM:  'Sameier',
};


function rolleNavn(type) {
  if (!type) return 'UKJENT';
  return ROLLE_BESKRIVELSER[type.kode] || type.beskrivelse || type.kode || 'UKJENT';
}

export default function App() {
  const [orgnr, setOrgnr] = useState('');
  const [validationError, setValidationError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [data, setData] = useState(null);
  const [enhetInfo, setEnhetInfo] = useState(null);
  const [searchedOrgnr, setSearchedOrgnr] = useState('');
  const [loadingRandom, setLoadingRandom] = useState(false);
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

  async function runSearch(value) {
    if (!ORGNR_PATTERN.test(value)) {
      setValidationError('ORGANISASJONSNUMMER MÅ VÆRE NØYAKTIG 9 SIFFER');
      return;
    }
    setStatus('loading');
    setErrorMessage('');
    setData(null);
    setEnhetInfo(null);
    setSearchedOrgnr(value);

    const [rollerResult, enhetResult] = await Promise.allSettled([
      fetchRoller(value),
      fetchEnhet(value),
    ]);

    if (enhetResult.status === 'fulfilled') {
      setEnhetInfo(enhetResult.value);
    }

    if (rollerResult.status === 'fulfilled') {
      setData(rollerResult.value);
      setStatus('success');
    } else {
      setErrorMessage(rollerResult.reason?.message || 'Kunne ikke hente roller.');
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

  async function handleRandom() {
    setLoadingRandom(true);
    try {
      const randomOrgnr = await fetchTilfeldig();
      setOrgnr(randomOrgnr);
      setValidationError('');
      await runSearch(randomOrgnr);
    } catch {
      setValidationError('KLARTE IKKE HENTE TILFELDIG ORG. PRØV IGJEN.');
    } finally {
      setLoadingRandom(false);
    }
  }

  const rollegrupper = data?.rollegrupper ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <CrtScanline />
      <TestBanner />
      <SiteHeader
        theme={theme}
        onTheme={(t) => setTheme(t)}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <Prompt
          orgnr={orgnr}
          onChange={handleChange}
          onSubmit={handleSubmit}
          loading={status === 'loading'}
          validationError={validationError}
          onTry={handleTry}
          onRandom={handleRandom}
          loadingRandom={loadingRandom}
          idle={status === 'idle'}
        />

        <div className="mt-8 space-y-5">
          {status === 'loading' && <BootSequence orgnr={searchedOrgnr} />}

          {enhetInfo && status !== 'loading' && (
            <EnhetHeader enhet={enhetInfo} orgnr={searchedOrgnr} />
          )}

          {status === 'error' && (
            <Panel className="p-5 animate-boot-up">
              <p className="text-accent phosphor font-bold">! FEIL — KUNNE IKKE HENTE ROLLER</p>
              <p className="mt-2 text-fg-dim text-sm">{errorMessage}</p>
            </Panel>
          )}

          {status === 'success' && rollegrupper.length === 0 && (
            <Panel className="p-5 animate-boot-up">
              <p className="text-accent phosphor font-bold">∅ INGEN ROLLER FUNNET</p>
              <p className="mt-2 text-fg-dim text-sm">
                Ingen registrerte roller for ORG {formatOrgnr(searchedOrgnr)}.
              </p>
            </Panel>
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

/* ───────────────────── CRT-effekt: bevegelig skannlinje ───────────────────── */

function CrtScanline() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-24 animate-scan"
      style={{
        background:
          'linear-gradient(to bottom, transparent, rgba(255,176,0,0.06), transparent)',
      }}
    />
  );
}

/* ───────────────────────── Chrome ───────────────────────── */

function TestBanner() {
  return (
    <div className="w-full border-b border-line">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-1.5 flex items-center gap-2 text-xs sm:text-sm">
        <span className="text-accent phosphor animate-blink">*</span>
        <p className="text-fg-dim tracking-wide">
          <span className="text-accent phosphor font-bold">ADVARSEL: TESTMILJØ TT02</span>
          {' '}— IKKE PRODUKSJON · ALLE DATA ER FIKTIVE (BRREG PPE)
        </p>
        <span className="text-accent phosphor animate-blink">*</span>
      </div>
    </div>
  );
}

function SiteHeader({ theme, onTheme }) {
  return (
    <header className="w-full border-b border-line">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-end justify-between gap-4">
        <div>
          <pre className="text-accent phosphor leading-none font-display text-3xl sm:text-4xl select-none">
{`BRREG//ROLLEOPPSLAG`}
          </pre>
          <p className="mt-1 text-xs text-fg-faint tracking-[0.2em]">
            ENHETSREGISTERET · AUTORISERT API · v2.0
          </p>
        </div>

        <ModeToggle theme={theme} onTheme={onTheme} />
      </div>
    </header>
  );
}

function ModeToggle({ theme, onTheme }) {
  const Seg = ({ value, label }) => {
    const active = theme === value;
    return (
      <button
        type="button"
        onClick={() => onTheme(value)}
        aria-pressed={active}
        className={`px-2.5 py-1 text-xs font-bold tracking-wider transition-colors ${
          active
            ? 'bg-accent text-bg'
            : 'text-fg-faint hover:text-fg'
        }`}
      >
        {label}
      </button>
    );
  };
  return (
    <div className="flex items-center border border-line shrink-0">
      <Seg value="dark" label="CRT" />
      <span className="w-px self-stretch bg-[var(--border)]" />
      <Seg value="light" label="PAPIR" />
    </div>
  );
}

/* ───────────────────────── Prompt / søk ───────────────────────── */

function Prompt({ orgnr, onChange, onSubmit, loading, validationError, onTry, onRandom, loadingRandom, idle }) {
  const hasError = Boolean(validationError);
  return (
    <section className="pt-10 sm:pt-14">
      <h1 className="font-display text-4xl sm:text-5xl text-accent phosphor leading-none">
        FINN ROLLER BAK EN VIRKSOMHET
      </h1>
      <p className="mt-3 text-fg-dim text-sm sm:text-base max-w-2xl">
        Skriv inn et organisasjonsnummer (9 siffer) og kjør oppslag mot
        Enhetsregisteret. Daglig leder, styre, deltakere og regnskapsfører
        returneres som poster.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-7">
        <Panel className="p-4 sm:p-5">
          <label htmlFor="orgnr" className="block text-xs text-fg-faint tracking-[0.2em] mb-2">
            QUERY · ORGANISASJONSNUMMER
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex flex-1 items-center gap-2 border-b-2 border-[var(--border-strong)] pb-1">
              <span className="text-accent phosphor font-bold select-none">{'>'}</span>
              <input
                id="orgnr"
                name="orgnr"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={orgnr}
                onChange={onChange}
                aria-invalid={hasError}
                placeholder="_________"
                className="w-full bg-transparent text-2xl sm:text-3xl font-display tracking-[0.35em] text-fg phosphor placeholder:text-fg-faint focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="group shrink-0 border border-[var(--border-strong)] px-5 py-2.5 font-bold tracking-wider text-accent phosphor transition-colors hover:bg-accent hover:text-bg disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-accent"
            >
              {loading ? (
                <span className="cursor">KJØRER</span>
              ) : (
                <span>[ KJØR SØK ]</span>
              )}
            </button>
          </div>

          {hasError && (
            <p className="mt-3 text-sm text-accent phosphor font-bold animate-blink" role="alert">
              ! {validationError}
            </p>
          )}
        </Panel>
      </form>

      {!hasError && (
        <p className="mt-3 text-sm text-fg-faint">
          {idle && (
            <>
              HINT:{' '}
              <button
                type="button"
                onClick={() => onTry('310343013')}
                className="text-accent phosphor underline decoration-dotted underline-offset-4 hover:bg-accent hover:text-bg"
              >
                310343013
              </button>{' '}
              (testorg){' · '}
            </>
          )}
          <button
            type="button"
            onClick={onRandom}
            disabled={loadingRandom || loading}
            className="text-accent phosphor underline decoration-dotted underline-offset-4 hover:bg-accent hover:text-bg disabled:opacity-60"
          >
            {loadingRandom ? 'HENTER...' : 'TILFELDIG ORG →'}
          </button>
        </p>
      )}
    </section>
  );
}

/* ───────────────────────── Resultater ───────────────────────── */

function EnhetHeader({ enhet, orgnr }) {
  const navn = enhet.navn || '—';
  const orgform = enhet.organisasjonsform?.beskrivelse;
  const stiftet = enhet.stiftelsesdato;
  const adresse = enhet.forretningsadresse || enhet.postadresse;
  const adresseLinje = adresse
    ? [adresse.poststed, adresse.kommune]
        .filter(Boolean)
        .join(', ')
    : null;
  const naeringKode = enhet.naeringskode1;
  const naering = naeringKode
    ? `${naeringKode.kode} ${naeringKode.beskrivelse}`
    : null;

  return (
    <Panel className="p-4 sm:p-5 animate-boot-up">
      <p className="text-xs text-fg-faint tracking-[0.2em] mb-2">
        ENHET · {formatOrgnr(orgnr)}
      </p>
      <p className="font-display text-2xl sm:text-3xl text-accent phosphor leading-tight">
        {navn}
      </p>
      <div className="mt-2 space-y-0.5 text-sm">
        {orgform && <Field label="Form" value={orgform} />}
        {adresseLinje && <Field label="Sted" value={adresseLinje} />}
        {naering && <Field label="Næring" value={naering} />}
        {stiftet && <Field label="Stiftet" value={stiftet} />}
      </div>
    </Panel>
  );
}

function Results({ orgnr, rollegrupper }) {
  const [activeFilter, setActiveFilter] = useState(null); // null = vis alle

  const totalRoller = rollegrupper.reduce(
    (sum, g) => sum + (g.roller?.length ?? 0),
    0,
  );

  const filtered = activeFilter
    ? rollegrupper.filter((g) => g.type?.kode === activeFilter)
    : rollegrupper;

  let featuredIdx = 0;
  filtered.forEach((g, i) => {
    if ((g.roller?.length ?? 0) > (filtered[featuredIdx]?.roller?.length ?? 0)) {
      featuredIdx = i;
    }
  });

  // Unike rollekoder for filter-chips.
  const koder = rollegrupper.map((g) => g.type?.kode).filter(Boolean);

  return (
    <section aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-accent phosphor">
        <p className="font-bold tracking-wider">
          {'>>>'} RESULTAT · ORG {formatOrgnr(orgnr)}
        </p>
        <p className="text-sm text-fg-dim">
          {rollegrupper.length} GRUPPER / {totalRoller} ROLLER
        </p>
      </div>
      <Divider />

      {/* Rollekode-filter */}
      {koder.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <FilterChip
            label="ALLE"
            active={activeFilter === null}
            onClick={() => setActiveFilter(null)}
          />
          {koder.map((kode) => (
            <FilterChip
              key={kode}
              label={ROLLE_BESKRIVELSER[kode] || kode}
              active={activeFilter === kode}
              onClick={() =>
                setActiveFilter((prev) => (prev === kode ? null : kode))
              }
            />
          ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 [grid-auto-flow:dense]">
        {filtered.map((gruppe, i) => (
          <RecordCard
            key={(gruppe.type?.kode ?? 'g') + i}
            gruppe={gruppe}
            featured={i === featuredIdx}
            index={i}
          />
        ))}
      </div>

      <div className="mt-5">
        <NodeMap orgnr={orgnr} rollegrupper={rollegrupper} activeFilter={activeFilter} />
      </div>
    </section>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 text-xs font-bold tracking-wider border transition-colors ${
        active
          ? 'bg-accent text-bg border-[var(--border-strong)]'
          : 'text-fg-dim border-line hover:text-accent hover:border-[var(--border-strong)]'
      }`}
    >
      {label}
    </button>
  );
}

function NodeMap({ orgnr, rollegrupper, activeFilter }) {
  const n = rollegrupper.length;
  const rx = n <= 2 ? 26 : 37;
  const ry = 32;
  const nodes = rollegrupper.map((g, i) => {
    const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
    return {
      x: 50 + rx * Math.cos(angle),
      y: 50 + ry * Math.sin(angle),
      gruppe: g,
    };
  });

  return (
    <Panel className="relative h-[300px] sm:h-[360px] overflow-hidden p-3">
      <p className="absolute left-3 top-2 z-10 text-[11px] tracking-[0.2em] text-fg-faint">
        [ RELASJONSKART ]
      </p>

      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        {nodes.map((node, i) => {
          const kode = node.gruppe.type?.kode;
          const dimmed = activeFilter && kode !== activeFilter;
          return (
            <line
              key={i}
              x1="50%"
              y1="50%"
              x2={`${node.x}%`}
              y2={`${node.y}%`}
              stroke={dimmed ? 'var(--border)' : 'var(--accent)'}
              strokeWidth={activeFilter === kode ? '2' : '1'}
              strokeOpacity={dimmed ? '0.25' : '0.5'}
              strokeDasharray="3 4"
              className="transition-all duration-300"
            />
          );
        })}
      </svg>

      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="panel px-4 py-2">
          <p className="font-display text-2xl text-accent phosphor leading-none">
            {formatOrgnr(orgnr)}
          </p>
          <p className="text-[10px] tracking-[0.2em] text-fg-faint mt-1">VIRKSOMHET</p>
        </div>
      </div>

      {nodes.map((node, i) => {
        const kode = node.gruppe.type?.kode;
        const isActive = activeFilter === kode;
        const dimmed = activeFilter && !isActive;
        return (
          <div
            key={i}
            className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
              dimmed ? 'opacity-30' : 'opacity-100'
            }`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className={`panel px-2.5 py-1 text-center whitespace-nowrap ${
              isActive ? 'border-[var(--border-strong)] shadow-[var(--glow)]' : ''
            }`}>
              <span className="text-accent phosphor font-bold text-xs">
                {rolleNavn(node.gruppe.type)}
              </span>
              <span className="ml-1.5 text-fg-dim text-xs">×{node.gruppe.roller?.length ?? 0}</span>
            </div>
          </div>
        );
      })}
    </Panel>
  );
}

function RecordCard({ gruppe, featured, index }) {
  const roller = gruppe.roller ?? [];
  const tittel = rolleNavn(gruppe.type).toUpperCase();

  return (
    <div
      className={`panel animate-boot-up ${featured ? 'sm:col-span-2' : ''}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
        <p className="text-accent phosphor font-bold tracking-wide truncate">
          {tittel}
        </p>
        <span className="shrink-0 text-xs text-fg-faint">
          {roller.length} {roller.length === 1 ? 'rolle' : 'roller'}
        </span>
      </div>

      <div className={`p-4 ${featured ? 'grid sm:grid-cols-2 gap-4' : 'space-y-4'}`}>
        {roller.map((rolle, i) => (
          <RecordRow key={i} rolle={rolle} gruppeKode={gruppe.type?.kode} />
        ))}
      </div>
    </div>
  );
}

function RecordRow({ rolle, gruppeKode }) {
  const innehaver = describeHolder(rolle);
  const rolleLabel = rolleNavn(rolle.type).toUpperCase();

  // Vis "Hent daglig leder"-knapp for revisor/regnskapsfører-virksomheter.
  const kanHenteDagl =
    rolle.enhet?.organisasjonsnummer &&
    ['REVI', 'REGN'].includes(gruppeKode);

  return (
    <div className="text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-bold text-fg phosphor truncate">{innehaver.primary}</p>
        <span className="shrink-0 text-[11px] text-fg-faint">{rolleLabel}</span>
      </div>

      <div className="mt-1.5 space-y-0.5">
        {innehaver.details.map((d) => (
          <Field key={d.label} {...d} />
        ))}
      </div>

      {(rolle.fratraadt || rolle.avregistrert || rolle.person?.erDoed || rolle.enhet?.erSlettet) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {rolle.fratraadt && <StatusTag>FRATRÅDT</StatusTag>}
          {rolle.avregistrert && <StatusTag>AVREGISTRERT</StatusTag>}
          {rolle.person?.erDoed && <StatusTag>DØD</StatusTag>}
          {rolle.enhet?.erSlettet && <StatusTag>SLETTET</StatusTag>}
        </div>
      )}

      {kanHenteDagl && (
        <DagligLederLookup orgnr={rolle.enhet.organisasjonsnummer} />
      )}
    </div>
  );
}

function DagligLederLookup({ orgnr }) {
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [dagl, setDagl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function hent() {
    setState('loading');
    try {
      const data = await fetchRoller(orgnr);
      const daglGruppe = (data?.rollegrupper ?? []).find(
        (g) => g.type?.kode === 'DAGL',
      );
      const dagligLeder = daglGruppe?.roller?.[0];
      if (dagligLeder) {
        setDagl(dagligLeder);
        setState('done');
      } else {
        setErrorMsg('Ingen daglig leder funnet');
        setState('error');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Kunne ikke hente roller');
      setState('error');
    }
  }

  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={hent}
        className="mt-2 text-xs text-accent phosphor underline decoration-dotted underline-offset-4 hover:bg-accent hover:text-bg"
      >
        Vis daglig leder →
      </button>
    );
  }

  if (state === 'loading') {
    return (
      <p className="mt-2 text-xs text-fg-dim">
        <span className="cursor">Henter daglig leder</span>
      </p>
    );
  }

  if (state === 'error') {
    return (
      <p className="mt-2 text-xs text-fg-faint">{errorMsg}</p>
    );
  }

  const holder = describeHolder(dagl);
  return (
    <div className="mt-2 border-t border-line pt-2">
      <p className="text-[11px] text-fg-faint tracking-[0.15em] mb-1">DAGLIG LEDER</p>
      <p className="font-bold text-fg phosphor">{holder.primary}</p>
      <div className="mt-1 space-y-0.5">
        {holder.details.map((d) => (
          <Field key={d.label} {...d} />
        ))}
      </div>
    </div>
  );
}

// Dot-leader-rad i klassisk utskriftsstil: LABEL.......: verdi
function Field({ label, value, copyable }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-fg-faint uppercase text-xs shrink-0">{label}</span>
      <span className="flex-1 border-b border-dotted border-[var(--border)] translate-y-[-2px]" />
      <span className="shrink-0 tabular-nums text-fg">{value}</span>
      {copyable && <CopyButton value={value} label={label} />}
    </div>
  );
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignorer */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Kopier ${label}`}
      className={`shrink-0 text-[11px] font-bold tracking-wide px-1.5 transition-colors ${
        copied
          ? 'text-bg bg-[var(--accent-2)]'
          : 'text-accent hover:bg-accent hover:text-bg'
      }`}
    >
      {copied ? '[ OK ✓ ]' : '[COPY]'}
    </button>
  );
}

function StatusTag({ children }) {
  return (
    <span className="inline-block border border-[var(--border-strong)] px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-accent">
      &lt;{children}&gt;
    </span>
  );
}

/* ───────────────────────── Tilstander ───────────────────────── */

function BootSequence({ orgnr }) {
  const lines = [
    'INIT MASKINPORTEN-KLIENT',
    'SIGNERER JWT-GRANT (RS256)',
    'HENTER ACCESS TOKEN',
    `SPØR BRREG/ENHETSREGISTERET ORG ${formatOrgnr(orgnr)}`,
  ];
  return (
    <Panel className="p-5 font-mono text-sm">
      {lines.map((l, i) => (
        <p key={i} className="text-fg-dim animate-boot-up" style={{ animationDelay: `${i * 120}ms` }}>
          <span className="text-accent phosphor">{'>'}</span> {l}
          <span className="text-[var(--accent-2)]"> ........ OK</span>
        </p>
      ))}
      <p className="text-accent phosphor mt-1">
        <span>{'>'}</span> MOTTAR DATA<span className="cursor" />
      </p>
    </Panel>
  );
}

/* ───────────────────────── Diverse ───────────────────────── */

function Panel({ className = '', children }) {
  return <div className={`panel ${className}`}>{children}</div>;
}

function Divider() {
  return (
    <div
      aria-hidden
      className="mt-2 h-px w-full"
      style={{
        backgroundImage:
          'repeating-linear-gradient(to right, var(--border-strong) 0 6px, transparent 6px 12px)',
      }}
    />
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 text-xs text-fg-faint tracking-wide">
        BRØNNØYSUNDREGISTRENE · AUTORISERT API (PPE/TEST) · MASKINPORTEN ·{' '}
        <span className="cursor" />
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
        label: 'Fødselsnr',
        value: rolle.person.fodselsnummer,
        copyable: true,
      });
    }
    if (rolle.person.fodselsdato) {
      details.push({ label: 'Født', value: rolle.person.fodselsdato });
    }
    return { primary: fulltNavn || 'UKJENT PERSON', details };
  }
  if (rolle.enhet) {
    const navn = Array.isArray(rolle.enhet.navn)
      ? rolle.enhet.navn.join(' ')
      : rolle.enhet.navn;
    const details = [];
    if (rolle.enhet.organisasjonsnummer) {
      details.push({
        label: 'Org.nr',
        value: rolle.enhet.organisasjonsnummer,
        copyable: true,
      });
    }
    if (rolle.enhet.organisasjonsform?.beskrivelse) {
      details.push({
        label: 'Form',
        value: rolle.enhet.organisasjonsform.beskrivelse,
      });
    }
    return { primary: navn || 'UKJENT VIRKSOMHET', details };
  }
  return { primary: 'UKJENT', details: [] };
}

function formatOrgnr(orgnr) {
  if (!orgnr || orgnr.length !== 9) return orgnr;
  return `${orgnr.slice(0, 3)} ${orgnr.slice(3, 6)} ${orgnr.slice(6)}`;
}
