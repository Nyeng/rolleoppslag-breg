import express from 'express';
import { loadConfig } from './config.js';
import { getMaskinportenToken } from './maskinporten.js';

const config = loadConfig();
const app = express();

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

app.listen(config.port, () => {
  console.log(`BFF-server kjører på http://localhost:${config.port}`);
});
