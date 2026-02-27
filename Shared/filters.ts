// storage.ts dosyasından Ilan tipini içeri alıyoruz
import type { Ilan } from './storage';

export function ilanlariFiltrele(ilanlar: Ilan[], kategori: string): Ilan[] {
  if (!kategori || kategori === "Tümü") {
    return ilanlar;
  }

  return ilanlar.filter((ilan: Ilan) => 
    ilan.kategori && ilan.kategori.toLowerCase() === kategori.toLowerCase()
  );
}