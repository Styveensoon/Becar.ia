import * as SecureStore from 'expo-secure-store';

// Almacenamiento cifrado del dispositivo (Keychain / Keystore) para datos sensibles.
// SecureStore limita ~2 KB por valor y la sesión de Supabase lo excede,
// así que cada valor se parte en pedazos guardados bajo `${key}.${n}`.
const CHUNK_SIZE = 1800;

// Lo usan la sesión de Supabase y los datos personales en caché (perfil, favoritos).
// supabase-js lee la sesión del storage antes de CADA consulta. En Android cada lectura de
// SecureStore descifra con el Keystore (lento) y la sesión son varios pedazos, así que se
// guarda una copia en memoria: SecureStore se lee una vez por arranque y solo se escribe.
const memoria = new Map<string, string | null>();

export const almacenSeguro = {
  async getItem(key: string) {
    if (memoria.has(key)) return memoria.get(key) ?? null;
    const value = await leerSecureStore(key);
    memoria.set(key, value);
    return value;
  },
  async setItem(key: string, value: string) {
    memoria.set(key, value);
    await borrarSecureStore(key);
    const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'gs')) ?? [];
    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${key}.${i}`, chunks[i]);
    }
    await SecureStore.setItemAsync(`${key}.count`, String(chunks.length));
  },
  async removeItem(key: string) {
    memoria.set(key, null);
    await borrarSecureStore(key);
  },
};

async function leerSecureStore(key: string): Promise<string | null> {
  const count = await SecureStore.getItemAsync(`${key}.count`);
  if (!count) return null;
  // Los pedazos se leen en paralelo: en frío (primer arranque) es una sola espera, no N.
  const parts = await Promise.all(
    Array.from({ length: Number(count) }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`)),
  );
  return parts.some((p) => p === null) ? null : parts.join('');
}

async function borrarSecureStore(key: string) {
  const count = await SecureStore.getItemAsync(`${key}.count`);
  for (let i = 0; i < Number(count ?? 0); i++) {
    await SecureStore.deleteItemAsync(`${key}.${i}`);
  }
  await SecureStore.deleteItemAsync(`${key}.count`);
}

