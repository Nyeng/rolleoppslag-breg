// Tynn klient mot BFF-en. Frontend snakker aldri direkte med
// Maskinporten eller Brreg – kun via vår egen server.

export async function fetchRoller(orgnr) {
  const res = await fetch(`/api/roller/${orgnr}`);

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignorerer – håndteres under
  }

  if (!res.ok) {
    const message =
      (data && data.error) || 'Kunne ikke hente data. Prøv igjen senere.';
    throw new Error(message);
  }

  return data;
}

export async function fetchEnhet(orgnr) {
  const res = await fetch(`/api/enhet/${orgnr}`);

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignorerer
  }

  if (!res.ok) {
    const message =
      (data && data.error) || 'Kunne ikke hente enhetsdata.';
    throw new Error(message);
  }

  return data;
}

export async function fetchTilfeldig() {
  const res = await fetch('/api/tilfeldig');

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignorerer
  }

  if (!res.ok) {
    throw new Error(
      (data && data.error) || 'Klarte ikke hente tilfeldig org.',
    );
  }

  return data.organisasjonsnummer;
}
