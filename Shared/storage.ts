/**
 * Web platformu için LocalStorage adaptörü.
 * api.js içindeki `storageAdapter` parametresine bu objeyi göndereceğiz.
 * Not: LocalStorage normalde senkron çalışır ama mobil tarafı (AsyncStorage) asenkron
 * olduğu için, mimari uyumluluk adına bu fonksiyonları `async` yapıyoruz.
 */
// İlan verimizin tip şablonunu tanımlıyoruz
export interface Ilan {
  id: string | number;
  baslik: string;
  kategori: string;
  aciklama: string;
  aciliyet?: string;
  lokasyon?: string;
  lat?: number;
  lng?: number;
}

export const webStorageAdapter = {
  save: async (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error("LocalStorage'a veri kaydedilemedi:", error);
    }
  },

  load: async (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error("LocalStorage'dan veri okunamadı:", error);
      return null;
    }
  }
};

export const gorevUstlen = async (ilan: Ilan) => {
  const mevcutGorevler = await webStorageAdapter.load("ustlenilen_gorevler");
  const gorevListesi: Ilan[] = mevcutGorevler ? JSON.parse(mevcutGorevler) : [];
  
  if (!gorevListesi.find((g: Ilan) => g.id === ilan.id)) {
    gorevListesi.push(ilan);
    await webStorageAdapter.save("ustlenilen_gorevler", JSON.stringify(gorevListesi));
  }
};