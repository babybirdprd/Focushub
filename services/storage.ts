import { Store } from '@tauri-apps/plugin-store';

const WATCHLIST_STORE_PATH = 'watchlist.json';
const SECRETS_STORE_PATH = 'secrets.json';
const KEY_NAME = 'github_token';

// --- Watchlist (Store) ---

let watchlistStore: Store | null = null;

async function getWatchlistStore() {
  if (!watchlistStore) {
    watchlistStore = new Store(WATCHLIST_STORE_PATH);
    await watchlistStore.load();
  }
  return watchlistStore;
}

export const watchlistStorage = {
  async get(): Promise<string[]> {
    const store = await getWatchlistStore();
    const val = await store.get<string[]>('repos');
    return val || [];
  },

  async set(repos: string[]): Promise<void> {
    const store = await getWatchlistStore();
    await store.set('repos', repos);
    await store.save();
  }
};

// --- Secrets (Store + Web Crypto) ---

// In a real app, this key should be derived from user input (password/pin).
// Since we want "minimize code" but "encryption", we hardcode a salt/key material
// that effectively obfuscates it on disk but is static in the binary.
// This is "At Rest" encryption relative to the file system, protecting against
// casual inspection of the json file.
const APP_SECRET_KEY_MATERIAL = "focushub-internal-secret-material-v1";

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(APP_SECRET_KEY_MATERIAL),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("focushub-salt"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(text: string): Promise<{ iv: number[], data: number[] }> {
  const key = await getKey();
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(text)
  );

  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  };
}

async function decrypt(data: number[], iv: number[]): Promise<string> {
  const key = await getKey();
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  return new TextDecoder().decode(decrypted);
}

let secretsStore: Store | null = null;

async function getSecretsStore() {
  if (!secretsStore) {
    secretsStore = new Store(SECRETS_STORE_PATH);
    await secretsStore.load();
  }
  return secretsStore;
}

export const secretStorage = {
  async getToken(): Promise<string | null> {
    try {
      const store = await getSecretsStore();
      const record = await store.get<{ iv: number[], data: number[] }>(KEY_NAME);
      if (!record || !record.iv || !record.data) return null;

      return await decrypt(record.data, record.iv);
    } catch (e) {
      console.error("Failed to read/decrypt token", e);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    const store = await getSecretsStore();
    const encrypted = await encrypt(token);
    await store.set(KEY_NAME, encrypted);
    await store.save();
  },

  async clearToken(): Promise<void> {
    const store = await getSecretsStore();
    await store.delete(KEY_NAME); // use delete or remove depending on plugin version, v2 is delete usually? check docs or types.
    // Actually Store plugin v2 uses `delete`? No, check types.
    // v2: delete(key).
    await store.save();
  }
};
