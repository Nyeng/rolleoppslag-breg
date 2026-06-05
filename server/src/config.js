// Sentral konfigurasjon lest fra miljøvariabler (.env).
// Alle hemmeligheter (JWK/privat nøkkel) holdes på serversiden og
// eksponeres aldri mot React-appen.

function required(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Mangler påkrevd miljøvariabel: ${name}`);
  }
  return value;
}

export function loadConfig() {
  let jwk;
  try {
    jwk = JSON.parse(required('MASKINPORTEN_JWK'));
  } catch (err) {
    throw new Error(
      'MASKINPORTEN_JWK kunne ikke parses som JSON. Husk å sette hele JWK-en som én linje i .env.',
    );
  }

  return {
    port: Number(process.env.PORT) || 3001,

    maskinporten: {
      clientId: required('MASKINPORTEN_CLIENT_ID'),
      jwk,
      // Maskinporten test-miljø som standard.
      tokenEndpoint:
        process.env.MASKINPORTEN_TOKEN_ENDPOINT ||
        'https://test.maskinporten.no/token',
      audience:
        process.env.MASKINPORTEN_AUDIENCE || 'https://test.maskinporten.no/',
      scope:
        process.env.MASKINPORTEN_SCOPE ||
        'brreg:data:enhetsregisteret:auto:roller',
      resource:
        process.env.MASKINPORTEN_RESOURCE ||
        'https://data.ppe.brreg.no/enhetsregisteret/autorisert-api',
    },

    brreg: {
      baseUrl:
        process.env.BRREG_BASE_URL ||
        'https://data.ppe.brreg.no/enhetsregisteret/autorisert-api',
    },
  };
}
