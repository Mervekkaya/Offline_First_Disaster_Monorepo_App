import type { Ilan } from './storage';

const API_URL = "https://api.npoint.io/433d2b54b3c3bb324e23";
const CACHE_KEY = "afet_ilanlar_cache";

// TypeScript'e storageAdapter'ın ne olduğunu anlatıyoruz
export interface StorageAdapter {
  save: (key: string, value: string) => Promise<void>;
  load: (key: string) => Promise<string | null>;
}

export async function fetchIlanlar(storageAdapter: StorageAdapter): Promise<{ data: Ilan[], isOffline: boolean }> {
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (isOnline) {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP hata kodu: ${response.status}`);
      }
      const data = await response.json();
      await storageAdapter.save(CACHE_KEY, JSON.stringify(data));
      return { data, isOffline: false };
      
    } catch (error: any) { // error tipini 'any' yaparak hatayı çözdük
      console.warn("API isteği başarısız oldu, yerel cache'den veri okunacak:", error.message);
      return await loadFromCache(storageAdapter);
    }
  } else {
    console.log("İnternet bağlantısı yok, yerel cache'den veri okunacak.");
    return await loadFromCache(storageAdapter);
  }
}

async function loadFromCache(storageAdapter: StorageAdapter): Promise<{ data: Ilan[], isOffline: boolean }> {
  try {
    const cached = await storageAdapter.load(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      return { data, isOffline: true };
    }
    return { data: [], isOffline: true };
  } catch (error) {
    console.error("Cache'den veri okuma hatası:", error);
    return { data: [], isOffline: true };
  }
}