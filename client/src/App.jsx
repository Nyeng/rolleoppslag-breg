import { useState, useEffect, useRef } from 'react';
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
  OBS: 'Observatør',
  SAM: 'Sameier',
};


// Fargekoding per rollegruppe — muted retro-farger for kort-header.
const ROLLE_FARGE = {
  DAGL: { bg: '#3d6b7a', text: '#f0ebe0' },  // Muted teal
  STYR: { bg: '#5a6b3a', text: '#f0ebe0' },  // Muted olive
  REVI: { bg: '#5e3d6b', text: '#f0ebe0' },  // Muted plum
  REGN: { bg: '#7a5c2e', text: '#f0ebe0' },  // Muted ochre
  DELT: { bg: '#4a5a6a', text: '#f0ebe0' },  // Slate blue
  SIGN: { bg: '#6a4a4a', text: '#f0ebe0' },  // Dusty rose
  PROK: { bg: '#5a5a3a', text: '#f0ebe0' },  // Dark khaki
  INNH: { bg: '#6b4a3a', text: '#f0ebe0' },  // Sienna
};


function rolleNavn(type) {
  if (!type) return 'UKJENT';
  return ROLLE_BESKRIVELSER[type.kode] || type.beskrivelse || type.kode || 'UKJENT';
}

function rolleFarge(kode) {
  return ROLLE_FARGE[kode] || { bg: 'var(--surface)', text: 'var(--accent)' };
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
    return saved === 'light' || saved === 'dark' ? saved : 'light';
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
  const resultsRef = useRef(null);

  // Scroll til resultater når de dukker opp.
  useEffect(() => {
    if ((status === 'success' || status === 'error') && resultsRef.current) {
      setTimeout(() => {
        const el = resultsRef.current;
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }, 50);
    }
  }, [status]);

  return (
    <div className="min-h-screen flex flex-col">
      <CrtScanline />
      <TestBanner theme={theme} onTheme={(t) => setTheme(t)} />

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

        <div ref={resultsRef} className="mt-8 space-y-5 scroll-mt-4">
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
            <Results rollegrupper={rollegrupper} />
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

function TestBanner({ theme, onTheme }) {
  return (
    <div className="w-full border-b border-line">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between gap-2 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="text-accent phosphor">*</span>
          <p className="text-fg-dim tracking-wide">
            <span className="text-accent phosphor font-bold">TESTMILJØ TT02</span>
            {' '}— FIKTIVE DATA (BRREG PPE)
          </p>
          <span className="text-accent phosphor">*</span>
        </div>
        <ModeToggle theme={theme} onTheme={onTheme} />
      </div>
    </div>
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
        className={`px-2.5 py-1 text-xs font-bold tracking-wider transition-colors ${active
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
      <h1 className="font-display text-2xl sm:text-3xl text-accent phosphor leading-none">
        FINN ROLLER TILKNYTTET EN VIRKSOMHET
      </h1>
      <p className="mt-3 text-fg-dim text-sm sm:text-base max-w-2xl">
        Skriv inn et organisasjonsnummer (9 siffer) og kjør oppslag mot
        Enhetsregisteret.
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
                <span>[ HENT ROLLER ]</span>
              )}
            </button>
          </div>

          {hasError && (
            <p className="mt-3 text-sm text-accent phosphor font-bold" role="alert">
              ! {validationError}
            </p>
          )}
        </Panel>
      </form>

      <p className="mt-3 text-sm text-fg-faint">
        {idle && !hasError && (
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
      <p className="font-display text-lg sm:text-xl text-accent phosphor leading-tight">
        {navn}
      </p>
      {orgform && (
        <p className="mt-1 text-sm font-bold text-fg phosphor">{orgform}</p>
      )}
      <div className="mt-2 space-y-0.5 text-sm">
        {adresseLinje && <Field label="Sted" value={adresseLinje} />}
        {naering && <Field label="Næring" value={naering} />}
        {stiftet && <Field label="Stiftet" value={stiftet} />}
      </div>
    </Panel>
  );
}

function Results({ rollegrupper }) {
  let featuredIdx = 0;
  rollegrupper.forEach((g, i) => {
    if ((g.roller?.length ?? 0) > (rollegrupper[featuredIdx]?.roller?.length ?? 0)) {
      featuredIdx = i;
    }
  });

  return (
    <section aria-live="polite">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 [grid-auto-flow:dense]">
        {rollegrupper.map((gruppe, i) => (
          <RecordCard
            key={(gruppe.type?.kode ?? 'g') + i}
            gruppe={gruppe}
            featured={i === featuredIdx}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}

function RecordCard({ gruppe, featured, index }) {
  const roller = gruppe.roller ?? [];
  const kode = gruppe.type?.kode;
  const tittel = rolleNavn(gruppe.type).toUpperCase();
  const farge = rolleFarge(kode);

  return (
    <div
      className={`panel animate-boot-up overflow-hidden ${featured ? 'sm:col-span-2' : ''}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div
        className="flex items-center justify-between gap-2 px-4 py-2.5"
        style={{ backgroundColor: farge.bg, color: farge.text }}
      >
        <p className="font-bold tracking-wide">
          {tittel}
        </p>
        <span className="shrink-0 text-xs opacity-75">
          {roller.length} {roller.length === 1 ? 'rolle' : 'roller'}
        </span>
      </div>

      <div className={`p-4 ${featured ? 'grid sm:grid-cols-2 gap-4' : 'space-y-4'}`}>
        {roller.map((rolle, i) => (
          <RecordRow key={i} rolle={rolle} gruppeKode={kode} />
        ))}
      </div>
    </div>
  );
}

function RecordRow({ rolle, gruppeKode }) {
  const innehaver = describeHolder(rolle);
  const rolleLabel = rolleNavn(rolle.type).toUpperCase();
  const erStyreleder = gruppeKode === 'STYR' && rolle.type?.kode === 'LEDE';

  // Vis "Hent daglig leder"-knapp for revisor/regnskapsfører-virksomheter.
  const kanHenteDagl =
    rolle.enhet?.organisasjonsnummer &&
    ['REVI', 'REGN'].includes(gruppeKode);

  return (
    <div className="text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-bold text-fg phosphor">
          {erStyreleder && <span className="text-accent mr-1" title="Styrets leder">★</span>}
          {innehaver.primary}
        </p>
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
      className={`shrink-0 text-[11px] font-bold tracking-wide px-1.5 transition-colors ${copied
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
        BRØNNØYSUNDREGISTRENE · AUTORISERT API (PPE/TEST) · MASKINPORTEN
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
