import { randomUUID } from 'node:crypto';
import { SignJWT, importJWK } from 'jose';

// Enkel in-memory cache av access token slik at vi ikke ber om nytt
// token for hvert kall. Maskinporten-token varer typisk i noen minutter.
let cached = { token: null, expiresAt: 0 };

/**
 * Bygger en signert JWT-grant (assertion) som brukes i JWT-bearer-flyten
 * mot Maskinporten. Signeres med den private JWK-en (RS256).
 */
function sanitizeJwk(jwk) {
  // Noen nøkkel-eksporter inkluderer tomme felter (oth/key_ops/x5c) som
  // jose avviser. Fjern felter med tomme array-verdier før import.
  const clean = {};
  for (const [k, v] of Object.entries(jwk)) {
    if (Array.isArray(v) && v.length === 0) continue;
    clean[k] = v;
  }
  return clean;
}

async function createGrantAssertion(cfg) {
  const jwk = sanitizeJwk(cfg.jwk);
  const key = await importJWK(jwk, jwk.alg || 'RS256');

  return new SignJWT({
    scope: cfg.scope,
    resource: cfg.resource,
  })
    .setProtectedHeader({ alg: cfg.jwk.alg || 'RS256', kid: cfg.jwk.kid })
    .setIssuer(cfg.clientId)
    .setAudience(cfg.audience)
    .setIssuedAt()
    .setExpirationTime('120s')
    .setJti(randomUUID())
    .sign(key);
}

/**
 * Henter et access token fra Maskinporten via jwt-bearer grant.
 * Returnerer cachet token hvis det fortsatt er gyldig.
 */
export async function getMaskinportenToken(cfg) {
  const now = Math.floor(Date.now() / 1000);
  if (cached.token && cached.expiresAt - 30 > now) {
    return cached.token;
  }

  const assertion = await createGrantAssertion(cfg);

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  const res = await fetch(cfg.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `Maskinporten svarte med ${res.status}: ${text || res.statusText}`,
    );
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Kunne ikke tolke svaret fra Maskinporten som JSON.');
  }

  if (!data.access_token) {
    throw new Error('Maskinporten-svaret mangler access_token.');
  }

  cached = {
    token: data.access_token,
    expiresAt: now + (Number(data.expires_in) || 60),
  };

  return cached.token;
}
