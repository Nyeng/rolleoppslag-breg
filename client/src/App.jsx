import { useState } from 'react';
import { fetchRoller } from './api.js';

const ORGNR_PATTERN = /^\d{9}$/;

export default function App() {
  const [orgnr, setOrgnr] = useState('');
  const [validationError, setValidationError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [data, setData] = useState(null);
  const [searchedOrgnr, setSearchedOrgnr] = useState('');

  function handleChange(e) {
    // Tillat kun siffer, maks 9.
    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
    setOrgnr(value);
    if (validationError) setValidationError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!ORGNR_PATTERN.test(orgnr)) {
      setValidationError('Organisasjonsnummeret må bestå av nøyaktig 9 siffer.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');
    setData(null);
    setSearchedOrgnr(orgnr);

    try {
      const result = await fetchRoller(orgnr);
      setData(result);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  }

  const rollegrupper = data?.rollegrupper ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <TestBanner />
      <Header />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <SearchForm
          orgnr={orgnr}
          onChange={handleChange}
          onSubmit={handleSubmit}
          loading={status === 'loading'}
          validationError={validationError}
        />

        <div className="mt-8">
          {status === 'loading' && <LoadingSkeleton />}

          {status === 'error' && (
            <Alert variant="danger" title="Kunne ikke hente roller">
              {errorMessage}
            </Alert>
          )}

          {status === 'success' && rollegrupper.length === 0 && (
            <Alert variant="info" title="Ingen roller funnet">
              Vi fant ingen registrerte roller for organisasjonsnummer{' '}
              {formatOrgnr(searchedOrgnr)}.
            </Alert>
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

function TestBanner() {
  return (
    <div
      role="status"
      className="bg-warningbg border-b-2 border-warning/40 text-warning"
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(138,90,0,0.06) 0, rgba(138,90,0,0.06) 12px, transparent 12px, transparent 24px)',
      }}
    >
      <div className="w-full max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-2.5 text-sm">
        <svg
          className="h-5 w-5 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.515 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <p className="font-medium">
          <span className="font-semibold">Testmiljø (TT02).</span> Dette er ikke
          produksjon – alle data er fiktive testdata fra Brreg PPE.
        </p>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-accent-800 text-white">
      <div className="w-full max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3">
          <p className="text-accent-200 text-sm font-medium tracking-wide uppercase">
            Enhetsregisteret
          </p>
          <span className="inline-flex items-center rounded-full bg-warning/90 text-white text-xs font-semibold px-2.5 py-0.5 tracking-wide">
            TEST · TT02
          </span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold">
          Rolleoppslag
        </h1>
        <p className="mt-2 text-accent-100 max-w-prose">
          Søk opp registrerte roller for en virksomhet ved hjelp av
          organisasjonsnummer.
        </p>
      </div>
    </header>
  );
}

function SearchForm({ orgnr, onChange, onSubmit, loading, validationError }) {
  const hasError = Boolean(validationError);
  return (
    <section className="bg-white rounded-xl shadow-card border border-neutral-200 p-6">
      <form onSubmit={onSubmit} noValidate>
        <label
          htmlFor="orgnr"
          className="block text-sm font-semibold text-neutral-800"
        >
          Organisasjonsnummer
        </label>
        <p id="orgnr-hint" className="text-sm text-neutral-500 mt-1">
          Skriv inn 9 siffer, f.eks. 310572071.
        </p>

        <div className="mt-3 flex flex-col sm:flex-row gap-3">
          <input
            id="orgnr"
            name="orgnr"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={orgnr}
            onChange={onChange}
            aria-describedby="orgnr-hint"
            aria-invalid={hasError}
            placeholder="9 siffer"
            className={[
              'flex-1 rounded-lg border px-4 py-2.5 text-base text-neutral-900',
              'placeholder:text-neutral-400 bg-white transition-colors',
              hasError
                ? 'border-danger focus:border-danger'
                : 'border-neutral-300 focus:border-accent-600',
            ].join(' ')}
          />
          <button
            type="submit"
            disabled={loading}
            className={[
              'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5',
              'text-base font-semibold text-white whitespace-nowrap transition-colors',
              loading
                ? 'bg-accent-400 cursor-not-allowed'
                : 'bg-accent-700 hover:bg-accent-800',
            ].join(' ')}
          >
            {loading && <Spinner small />}
            {loading ? 'Henter…' : 'Hent roller'}
          </button>
        </div>

        {hasError && (
          <p className="mt-2 text-sm font-medium text-danger" role="alert">
            {validationError}
          </p>
        )}
      </form>
    </section>
  );
}

function Results({ orgnr, rollegrupper }) {
  return (
    <section aria-live="polite">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold text-neutral-900">
          Roller for {formatOrgnr(orgnr)}
        </h2>
        <span className="text-sm text-neutral-500">
          {rollegrupper.length} rollegruppe
          {rollegrupper.length === 1 ? '' : 'r'}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {rollegrupper.map((gruppe, i) => (
          <RoleGroup key={(gruppe.type?.kode ?? 'g') + i} gruppe={gruppe} defaultOpen={i === 0} />
        ))}
      </div>
    </section>
  );
}

function RoleGroup({ gruppe, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const roller = gruppe.roller ?? [];
  const tittel = gruppe.type?.beskrivelse ?? gruppe.type?.kode ?? 'Rollegruppe';

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
      >
        <span className="flex items-center gap-3">
          <span className="font-semibold text-neutral-900">{tittel}</span>
          <span className="inline-flex items-center rounded-full bg-accent-50 text-accent-700 text-xs font-medium px-2.5 py-0.5">
            {roller.length} rolle{roller.length === 1 ? '' : 'r'}
          </span>
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <div className="border-t border-neutral-100 divide-y divide-neutral-100">
          {roller.map((rolle, i) => (
            <RoleItem key={i} rolle={rolle} />
          ))}
        </div>
      )}
    </div>
  );
}

function RoleItem({ rolle }) {
  const navn = rolle.type?.beskrivelse ?? rolle.type?.kode ?? 'Rolle';
  const innehaver = describeHolder(rolle);

  return (
    <div className="px-5 py-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="font-medium text-neutral-900">{innehaver.primary}</p>
        {innehaver.details.length > 0 && (
          <dl className="mt-2 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-sm">
            {innehaver.details.map((d) => (
              <DetailRow key={d.label} {...d} />
            ))}
          </dl>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="inline-flex items-center rounded-md bg-neutral-100 text-neutral-700 text-xs font-medium px-2.5 py-1">
          {navn}
        </span>
        <span className="text-[11px] text-neutral-400 font-mono">
          {rolle.type?.kode}
        </span>
        {rolle.fratraadt && <StatusTag>Fratrådt</StatusTag>}
        {rolle.avregistrert && <StatusTag>Avregistrert</StatusTag>}
        {rolle.person?.erDoed && <StatusTag>Død</StatusTag>}
        {rolle.enhet?.erSlettet && <StatusTag>Slettet</StatusTag>}
      </div>
    </div>
  );
}

function DetailRow({ label, value, copyable }) {
  return (
    <>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-neutral-900 flex items-center gap-2 min-w-0">
        <span className={copyable ? 'font-mono tabular-nums' : ''}>
          {value}
        </span>
        {copyable && <CopyButton value={value} label={label} />}
      </dd>
    </>
  );
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Utklippstavle ikke tilgjengelig – ignorer stille.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Kopier ${label}`}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-accent-700 hover:bg-accent-50 transition-colors"
    >
      {copied ? (
        <span className="text-success">Kopiert</span>
      ) : (
        <>
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M7 3a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V7.414A2 2 0 0014.414 6L12 3.586A2 2 0 0010.586 3H7z" />
            <path d="M3 7a2 2 0 012-2v9a2 2 0 002 2h6a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          Kopier
        </>
      )}
    </button>
  );
}

// Avgjør hvordan rolleinnehaver vises – enten en person eller en enhet.
function describeHolder(rolle) {
  if (rolle.person) {
    const n = rolle.person.navn ?? {};
    const fulltNavn = [n.fornavn, n.mellomnavn, n.etternavn]
      .filter(Boolean)
      .join(' ');
    const details = [];
    if (rolle.person.fodselsnummer) {
      details.push({
        label: 'Fødselsnummer',
        value: rolle.person.fodselsnummer,
        copyable: true,
      });
    }
    if (rolle.person.fodselsdato) {
      details.push({ label: 'Fødselsdato', value: rolle.person.fodselsdato });
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
        label: 'Org.nr',
        value: rolle.enhet.organisasjonsnummer,
        copyable: true,
      });
    }
    if (rolle.enhet.organisasjonsform?.beskrivelse) {
      details.push({
        label: 'Organisasjonsform',
        value: rolle.enhet.organisasjonsform.beskrivelse,
      });
    }
    return { primary: navn || 'Ukjent virksomhet', details };
  }
  return { primary: 'Ukjent', details: [] };
}

function StatusTag({ children }) {
  return (
    <span className="inline-flex items-center rounded-md bg-warningbg text-warning text-xs font-medium px-2 py-0.5">
      {children}
    </span>
  );
}

function Chevron({ open }) {
  return (
    <svg
      className={`h-5 w-5 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Spinner({ small }) {
  const size = small ? 'h-4 w-4' : 'h-6 w-6';
  return (
    <svg
      className={`${size} animate-spin ${small ? 'text-white' : 'text-accent-700'}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Henter roller…</span>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-neutral-200 shadow-card p-5"
        >
          <div className="h-5 w-40 bg-neutral-200 rounded animate-pulse" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-3/4 bg-neutral-100 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-neutral-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Alert({ variant = 'info', title, children }) {
  const styles = {
    danger: 'bg-dangerbg border-danger/30 text-neutral-900',
    info: 'bg-accent-50 border-accent-200 text-neutral-900',
  }[variant];

  const iconColor = variant === 'danger' ? 'text-danger' : 'text-accent-700';

  return (
    <div
      role="alert"
      className={`rounded-xl border px-5 py-4 flex gap-3 ${styles}`}
    >
      <svg
        className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor}`}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z"
          clipRule="evenodd"
        />
      </svg>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-neutral-700 mt-0.5">{children}</p>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="w-full max-w-3xl mx-auto px-4 py-6 text-sm text-neutral-500">
        Data hentes fra Brønnøysundregistrenes autoriserte API (PPE/test) via
        Maskinporten.
      </div>
    </footer>
  );
}

function formatOrgnr(orgnr) {
  if (!orgnr || orgnr.length !== 9) return orgnr;
  return `${orgnr.slice(0, 3)} ${orgnr.slice(3, 6)} ${orgnr.slice(6)}`;
}
