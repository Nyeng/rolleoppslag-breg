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
