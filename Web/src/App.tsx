import { useState, useEffect } from 'react';
import { WifiOff, Moon, Sun, Search, Bell, Map as MapIcon, List, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

// Kendi yazdığımız Ortak Beyin (Shared) fonksiyonları
import { fetchIlanlar } from '@afet/shared/api';
import { webStorageAdapter, gorevUstlen } from '@afet/shared/storage';
import { ilanlariFiltrele } from '@afet/shared/filters';

// --- TYPESCRIPT INTERFACE (Veri Yapımız) ---
interface Ilan {
  id: string | number;
  baslik: string;
  kategori: string;
  aciklama: string;
  aciliyet?: string;
  lokasyon?: string;
  lat?: number;
  lng?: number;
}

function App() {
  // --- STATE (HAFIZA) YÖNETİMİ ---
  const [ilanlar, setIlanlar] = useState<Ilan[]>([]); // API'den gelen veriler
  const [kategori, setKategori] = useState<string>('Tümü'); // Seçili kategori
  const [aramaMetni, setAramaMetni] = useState<string>(''); // Arama kutusu
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine); // Kriz Modu durumu
  const [theme, setTheme] = useState<string>(localStorage.getItem('theme') || 'light'); // Dark Mode
  
  // Görünüm ve Üstlenilen Görevler State'leri
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list'); 
  const [ustlenilenler, setUstlenilenler] = useState<(string | number)[]>([]); 

  // Jürinin istediği kategoriler
  const kategoriler = ['Tümü', 'Arama Kurtarma', 'Gıda', 'Çadır', 'İlaç', 'Lojistik'];

  // --- 1. SİSTEM BAŞLANGICI VE VERİ ÇEKME ---
  useEffect(() => {
    const verileriGetir = async () => {
      // Yazdığın api.js fonksiyonunu çağırıyoruz
      const sonuc = await fetchIlanlar(webStorageAdapter);
      setIlanlar(sonuc.data);
      if (sonuc.isOffline) setIsOffline(true);
    };

    verileriGetir();

    // Sayfa açılışında kayıtlı Dark Mode varsa uygula
    if (theme === 'dark') document.documentElement.classList.add('dark');

    // Kayıtlı üstlenilen görevleri LocalStorage'dan çekip butonları yeşil yapmak için
    const kayitliGorevler = localStorage.getItem('ustlenilen_gorevler');
    if (kayitliGorevler) {
      const parsedGorevler: Ilan[] = JSON.parse(kayitliGorevler);
      setUstlenilenler(parsedGorevler.map(g => g.id));
    }
  }, [theme]);

  // --- 2. ÇEVRİMDIŞI (KRİZ) MODUNU DİNLEME ---
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // --- 3. DARK MODE GEÇİŞİ ---
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    }
  };

  // --- 4. FİLTRELEME VE ARAMA KOMBİNASYONU ---
  let gosterilecekIlanlar = ilanlariFiltrele(ilanlar, kategori);
  
  if (aramaMetni) {
    gosterilecekIlanlar = gosterilecekIlanlar.filter((ilan: Ilan) => 
      ilan.baslik?.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      ilan.aciklama?.toLowerCase().includes(aramaMetni.toLowerCase())
    );
  }

  // --- 5. GÖREV ÜSTLENDİĞİNDE ÇALIŞACAK FONKSİYON ---
  const handleUstlen = async (ilan: Ilan) => {
    await gorevUstlen(ilan);
    setUstlenilenler([...ustlenilenler, ilan.id]);
    alert("Görev üstlenildi ve tarayıcıya (LocalStorage) kaydedildi! 💙");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh' }}>
      
      {/* ÇEVRİMDIŞI UYARI BANDI (KRİZ MODU) */}
      {isOffline && (
        <div className="offline-banner" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)', padding: '10px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
          <WifiOff size={20} />
          <span>KRİZ MODU: Şebeke bağlantısı yok. Yerel (kayıtlı) veriler gösteriliyor.</span>
        </div>
      )}

      {/* HEADER BÖLÜMÜ */}
      <header style={{ padding: '20px', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: 'var(--accent-red)', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Afet Platformu</h1>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* Arama Çubuğu */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="İlanlarda ara..." 
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              style={{ padding: '8px 10px 8px 35px', borderRadius: '20px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
            />
          </div>

          <button onClick={() => alert("Bildirimler henüz aktif değil.")} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>
            <Bell size={24} />
          </button>
          
          <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>
            {theme === 'dark' ? <Sun size={24} color="#ffc107" /> : <Moon size={24} />}
          </button>
        </div>
      </header>

      {/* İÇERİK BÖLÜMÜ */}
      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* ÜST BAR: Kategoriler ve Görünüm Değiştirici */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          
          {/* KATEGORİ BUTONLARI */}
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
            {kategoriler.map(kat => (
              <button 
                key={kat}
                onClick={() => setKategori(kat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  backgroundColor: kategori === kat ? 'var(--accent-blue)' : 'var(--bg-card)',
                  color: kategori === kat ? '#fff' : 'var(--text-main)',
                  boxShadow: '0 2px 5px var(--border-color)',
                  whiteSpace: 'nowrap'
                }}
              >
                {kat}
              </button>
            ))}
          </div>

          {/* HARİTA / LİSTE GÖRÜNÜMÜ TOGGLE */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setViewMode('list')}
              style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '5px', border: 'none', cursor: 'pointer', backgroundColor: viewMode === 'list' ? 'var(--border-color)' : 'transparent', color: 'var(--text-main)' }}
            >
              <List size={18} /> Liste
            </button>
            <button 
              onClick={() => setViewMode('map')}
              style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '5px', border: 'none', cursor: 'pointer', backgroundColor: viewMode === 'map' ? 'var(--border-color)' : 'transparent', color: 'var(--text-main)' }}
            >
              <MapIcon size={18} /> Harita
            </button>
          </div>
        </div>

        {/* SONUÇ SAYISI */}
        <h2 style={{ marginBottom: '20px', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
          {gosterilecekIlanlar.length} İlan Bulundu
        </h2>

        {/* GÖRÜNÜM: HARİTA */}
        {viewMode === 'map' && (
          <div style={{ height: '500px', width: '100%', borderRadius: '15px', overflow: 'hidden', border: '2px solid var(--border-color)', zIndex: 0 }}>
            {/* Harita merkezi İskenderun koordinatlarına ayarlandı. TS hatası için 'as [number, number]' kullanıldı. */}
            <MapContainer center={[36.58718, 36.17347] as [number, number]} zoom={10} style={{ height: '100%', width: '100%', zIndex: 0 }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {gosterilecekIlanlar.map((ilan: Ilan) => (
                <Marker key={ilan.id} position={[ilan.lat || 36.587, ilan.lng || 36.173] as [number, number]}>
                  <Popup>
                    <strong>{ilan.baslik}</strong><br/>
                    {ilan.kategori}<br/>
                    <button onClick={() => handleUstlen(ilan)} style={{ marginTop: '5px', padding: '5px', background: 'var(--accent-red)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                      Üstlen
                    </button>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {/* GÖRÜNÜM: LİSTE (KARTLAR) */}
        {viewMode === 'list' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {gosterilecekIlanlar.map((ilan: Ilan) => (
              <div key={ilan.id} style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '15px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ backgroundColor: 'var(--accent-red)', color: '#fff', padding: '4px 8px', borderRadius: '5px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {ilan.kategori || "Genel"}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={14} color="var(--warning-bg)" /> {ilan.aciliyet || "Acil"}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', marginTop: '10px', color: 'var(--text-main)', margin: '0' }}>{ilan.baslik}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', flexGrow: 1, margin: '10px 0' }}>
                  {ilan.aciklama}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-main)', fontSize: '0.9rem', marginTop: '10px' }}>
                  <MapPin size={16} color="var(--accent-blue)" /> {ilan.lokasyon || "Konum Belirtilmemiş"}
                </div>

                {/* BEN ÜSTLENDİM BUTONU */}
                <button 
                  onClick={() => handleUstlen(ilan)}
                  disabled={ustlenilenler.includes(ilan.id)}
                  style={{
                    marginTop: '15px',
                    padding: '12px',
                    backgroundColor: ustlenilenler.includes(ilan.id) ? 'var(--border-color)' : 'var(--text-main)',
                    color: ustlenilenler.includes(ilan.id) ? 'var(--text-muted)' : 'var(--bg-main)',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: ustlenilenler.includes(ilan.id) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background-color 0.3s'
                  }}
                >
                  {ustlenilenler.includes(ilan.id) ? (
                    <><CheckCircle size={18} color="green" /> Üstlenildi</>
                  ) : (
                    "Ben Üstleniyorum"
                  )}
                </button>

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;