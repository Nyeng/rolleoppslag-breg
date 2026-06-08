import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import { loadConfig } from './config.js';
import { getMaskinportenToken } from './maskinporten.js';

const config = loadConfig();
const app = express();

// Serve frontend i produksjon (client/dist bygges av "npm run build").
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

const ORGNR_PATTERN = /^\d{9}$/;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Hovedendepunkt: henter roller for et organisasjonsnummer.
// React-appen kaller dette; serveren håndterer Maskinporten-auth
// og det autoriserte kallet mot Brreg PPE.
app.get('/api/roller/:orgnr', async (req, res) => {
  const { orgnr } = req.params;

  if (!ORGNR_PATTERN.test(orgnr)) {
    return res.status(400).json({
      error: 'Ugyldig organisasjonsnummer. Det må bestå av nøyaktig 9 siffer.',
    });
  }

  try {
    const token = await getMaskinportenToken(config.maskinporten);

    const url = `${config.brreg.baseUrl}/enheter/${orgnr}/roller`;
    const brregRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (brregRes.status === 404) {
      return res.status(404).json({
        error: `Fant ingen roller for organisasjonsnummer ${orgnr}.`,
      });
    }

    if (!brregRes.ok) {
      const detail = await brregRes.text();
      console.error(`Brreg svarte ${brregRes.status}: ${detail}`);
      return res.status(502).json({
        error: 'Kunne ikke hente data fra Brreg.',
      });
    }

    const data = await brregRes.json();
    return res.json(data);
  } catch (err) {
    console.error('Feil ved rollehenting:', err);
    return res.status(500).json({
      error: 'Det oppstod en uventet feil under henting av roller.',
    });
  }
});

// Hent basisinfo om en enhet fra det åpne (ikke-autoriserte) API-et.
// Trenger ikke Maskinporten-token.
app.get('/api/enhet/:orgnr', async (req, res) => {
  const { orgnr } = req.params;

  if (!ORGNR_PATTERN.test(orgnr)) {
    return res.status(400).json({
      error: 'Ugyldig organisasjonsnummer. Det må bestå av nøyaktig 9 siffer.',
    });
  }

  try {
    const url = `${config.brreg.openBaseUrl}/enheter/${orgnr}`;
    const brregRes = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (brregRes.status === 404) {
      return res.status(404).json({
        error: `Fant ikke organisasjonsnummer ${orgnr} i Enhetsregisteret.`,
      });
    }

    if (!brregRes.ok) {
      const detail = await brregRes.text();
      console.error(`Brreg (åpent) svarte ${brregRes.status}: ${detail}`);
      return res.status(502).json({
        error: 'Kunne ikke hente enhetsdata fra Brreg.',
      });
    }

    const data = await brregRes.json();
    return res.json(data);
  } catch (err) {
    console.error('Feil ved enhetsoppslag:', err);
    return res.status(500).json({
      error: 'Det oppstod en uventet feil under henting av enhet.',
    });
  }
});

// Hent en tilfeldig enhet fra PPE-databasen (åpent API).
app.get('/api/tilfeldig', async (_req, res) => {
  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const page = Math.floor(Math.random() * 500);
      const url = `${config.brreg.openBaseUrl}/enheter?size=1&page=${page}`;
      const brregRes = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!brregRes.ok) continue;

      const data = await brregRes.json();
      const enheter = data?._embedded?.enheter;

      if (enheter && enheter.length > 0) {
        return res.json({
          organisasjonsnummer: enheter[0].organisasjonsnummer,
        });
      }
    } catch {
      // Prøv neste forsøk.
    }
  }

  return res.status(502).json({
    error: 'Klarte ikke å finne en tilfeldig enhet. Prøv igjen.',
  });
});

// SPA fallback: alle ikke-API-ruter serverer index.html
// slik at client-side routing (f.eks. ?orgnr=...) fungerer.
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(config.port, () => {
  console.log(`BFF-server kjører på http://localhost:${config.port}`);
});
