const alan = document.getElementById('alan');
if (!window.api) {
  document.body.insertAdjacentHTML('afterbegin',
    '<div style="background:#ff6b6b;color:#fff;padding:8px 14px">Bu sayfa tarayıcıda açıldı. Web sayfası ve dosya kutuları sadece Ekran Bölücü uygulamasında (.exe) çalışır.</div>');
}
const sayac = document.getElementById('sayac');
const KEY = 'ekran-bolucu-kutular';

let kutular = [];
try { kutular = JSON.parse(localStorage.getItem(KEY)) || []; } catch { kutular = []; }
let sayi = kutular.reduce((m, k) => Math.max(m, k.id), 0);

const kaydet = () => localStorage.setItem(KEY, JSON.stringify(kutular));

function adresDuzelt(g) {
  g = g.trim();
  if (!g) return '';
  if (/^https?:\/\//i.test(g)) return g;
  if (/^[^\s]+\.[^\s]{2,}$/.test(g) || /^localhost/i.test(g)) return 'https://' + g;
  return 'https://www.google.com/search?q=' + encodeURIComponent(g);
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// Kutuları satırlara eşit dağıt
function satirlar(n) {
  const kolon = Math.ceil(Math.sqrt(n));
  const satirSayisi = Math.ceil(n / kolon);
  const sonuc = [];
  let kalan = n;
  for (let i = 0; i < satirSayisi; i++) {
    const bu = Math.ceil(kalan / (satirSayisi - i));
    sonuc.push(bu);
    kalan -= bu;
  }
  return sonuc;
}

// Kutu genişliğine göre görünüm: masaüstü / tablet / mobil
const CHROME = (navigator.userAgent.match(/Chrome\/[\d.]+/) || ['Chrome/131.0.0.0'])[0];
const UA = {
  masaustu: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' + CHROME + ' Safari/537.36',
  tablet: 'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) ' + CHROME + ' Safari/537.36',
  mobil: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) ' + CHROME + ' Mobile Safari/537.36'
};
const ETIKET = { masaustu: 'Masaüstü', tablet: 'Tablet', mobil: 'Mobil' };
function kategoriBul(w, onceki) {
  const ham = w >= 900 ? 'masaustu' : w >= 520 ? 'tablet' : 'mobil';
  if (onceki && ham !== onceki && Math.min(Math.abs(w - 900), Math.abs(w - 520)) < 30) return onceki; // titremeyi önle
  return ham;
}
const BELGE_RE = /\.(docx?|xlsx|xlsm|xls|csv)$/i;

// Kutu boyutu değişince sayfanın görünüm alanını da aynı boyuta getir
function webviewBoyutla(wv, ic) {
  const ayarla = () => {
    const w = ic.clientWidth, h = ic.clientHeight;
    if (w > 0 && h > 0) { wv.style.width = w + 'px'; wv.style.height = h + 'px'; }
  };
  new ResizeObserver(ayarla).observe(ic);
  ayarla();
}

function kutuOlustur(k) {
  const kutu = el('section', 'kutu');
  const ust = el('div', 'kutu-ust');
  const baslik = el('span', 'baslik', k.baslik || 'Boş kutu');
  const rozet = el('span', 'rozet', '');
  const yenile = el('button', 'ikon', '⟳'); yenile.title = 'Yenile';
  const degistir = el('button', 'ikon', '⇄'); degistir.title = 'İçeriği değiştir';
  const kapat = el('button', 'ikon kapat', '✕'); kapat.title = 'Kutuyu kapat';
  const notKaydet = el('button', 'ikon', '💾'); notKaydet.title = 'Notu .txt dosyası olarak kaydet';
  notKaydet.style.display = 'none';
  const ic = el('div', 'kutu-ic');

  if (k.tur === 'web') {
    const wv = document.createElement('webview');
    wv.setAttribute('allowpopups', '');
    let kat = null, basladi = false, zaman = null;
    const uygula = () => {
      const w = ic.clientWidth;
      if (!w) return;
      const yeni = kategoriBul(w, kat);
      rozet.textContent = ETIKET[yeni];
      if (!basladi) {
        basladi = true; kat = yeni;
        wv.setAttribute('useragent', UA[yeni]);
        wv.setAttribute('src', k.deger);
        return;
      }
      if (yeni !== kat) {
        kat = yeni;
        try { wv.setUserAgent(UA[yeni]); wv.reload(); }
        catch { wv.setAttribute('useragent', UA[yeni]); }
      }
    };
    new ResizeObserver(() => {
      clearTimeout(zaman);
      zaman = setTimeout(uygula, basladi ? 300 : 0);
    }).observe(ic);
    wv.addEventListener('page-title-updated', (e) => { baslik.textContent = e.title; });
    const adresKaydet = (e) => {
      if (e.isMainFrame === false || !/^https?:/i.test(e.url)) return;
      k.deger = e.url; kaydet();
    };
    wv.addEventListener('did-navigate', adresKaydet);
    wv.addEventListener('did-navigate-in-page', adresKaydet);
    yenile.onclick = () => wv.reload();
    ic.append(wv);
    webviewBoyutla(wv, ic);
  } else if (k.tur === 'dosya') {
    const wvYap = (src) => {
      const wv = document.createElement('webview');
      wv.setAttribute('allowpopups', '');
      wv.setAttribute('src', src);
      yenile.onclick = () => wv.reload();
      webviewBoyutla(wv, ic);
      return wv;
    };
    if (BELGE_RE.test(k.deger)) {
      ic.append(el('div', 'bos', 'Belge hazırlanıyor…'));
      window.api.belgeDonustur(k.deger).then((r) => {
        ic.replaceChildren();
        if (r.hata) ic.append(el('div', 'bos', r.hata));
        else ic.append(wvYap(r.url));
      });
    } else {
      ic.append(wvYap(k.deger));
    }
  } else if (k.tur === 'not') {
    const ta = el('textarea', 'not-alan');
    ta.placeholder = 'Notunu buraya yaz…';
    ta.value = k.deger || '';
    ta.oninput = () => { k.deger = ta.value; kaydet(); };
    ic.append(ta);
    yenile.style.display = 'none';
    notKaydet.style.display = '';
    baslik.textContent = 'Not (otomatik kaydedilir)';
    notKaydet.onclick = async () => {
      try {
        const yol = await window.api.notKaydet(ta.value, 'not');
        if (yol) baslik.textContent = 'Kaydedildi: ' + yol;
      } catch (err) { alert('Not kaydedilemedi: ' + err.message); }
    };
  } else {
    yenile.style.display = 'none';
    degistir.style.display = 'none';
    secimEkrani(ic, k);
  }

  degistir.onclick = () => { k.tur = null; k.deger = ''; k.baslik = ''; kaydet(); kutuSifirla(k); };
  kapat.onclick = () => { kutular = kutular.filter(x => x.id !== k.id); kaydet(); ciz(); };

  ust.append(baslik, rozet, notKaydet, yenile, degistir, kapat);
  kutu.append(ust, ic);
  return kutu;
}

function secimEkrani(ic, k) {
  const s = el('div', 'secim');
  s.append(el('p', '', 'Bu kutuda ne açılsın?'));
  const web = el('button', '', '🌐  Web sayfası');
  const dosya = el('button', '', '📄  Doküman veya dosya');
  const not = el('button', '', '📝  Not defteri');

  web.onclick = () => {
    ic.replaceChildren();
    const f = el('div', 'adres');
    const inp = el('input'); inp.placeholder = 'Adres yaz veya ara…'; inp.spellcheck = false;
    const git = el('button', '', 'Aç');
    const ac = () => {
      const url = adresDuzelt(inp.value);
      if (!url) return;
      k.tur = 'web'; k.deger = url; k.baslik = url; kaydet(); kutuSifirla(k);
    };
    git.onclick = ac;
    inp.onkeydown = (e) => { if (e.key === 'Enter') ac(); };
    f.append(inp, git); ic.append(f); inp.focus();
  };
  dosya.onclick = async () => {
    let r;
    try { r = await window.api.dosyaSec(); }
    catch (err) { alert('Dosya seçici açılamadı: ' + err.message); return; }
    if (!r) return;
    k.tur = 'dosya'; k.deger = r.url; k.baslik = r.ad; kaydet(); kutuSifirla(k);
  };
  not.onclick = () => { k.tur = 'not'; k.deger = ''; k.baslik = 'Not'; kaydet(); kutuSifirla(k); };

  s.append(web, dosya, not);
  ic.append(s);
}

const dugumler = new Map(); // kutu id -> DOM düğümü (web sayfaları yeniden yüklenmesin diye korunur)
const ebob = (x, y) => (y ? ebob(y, x % y) : x);
const ekok = (x, y) => (x / ebob(x, y)) * y;

function kutuSifirla(k) {
  const n = dugumler.get(k.id);
  if (n) { n.remove(); dugumler.delete(k.id); }
  ciz();
}

function ciz() {
  sayac.textContent = kutular.length ? kutular.length + ' kutu' : '';
  const eskiBos = alan.querySelector(':scope > .bos-alan');

  if (!kutular.length) {
    for (const n of dugumler.values()) n.remove();
    dugumler.clear();
    if (!eskiBos) {
      const b = el('div', 'bos bos-alan');
      b.append(el('b', '', 'Henüz kutu yok'), document.createElement('br'), 'Sağ üstteki + düğmesiyle kutu ekle veya Şablonlar\'dan kayıtlı bir düzeni aç.');
      alan.append(b);
    }
    alan.style.gridTemplateColumns = '';
    alan.style.gridTemplateRows = '';
    return;
  }
  if (eskiBos) eskiBos.remove();

  const var_ = new Set(kutular.map((k) => k.id));
  for (const [id, n] of dugumler) {
    if (!var_.has(id)) { n.remove(); dugumler.delete(id); }
  }

  // Satırlar farklı sayıda kutu içerebilir: ortak kolon sayısı = EKOK
  const dagilim = satirlar(kutular.length);
  const L = dagilim.reduce(ekok, 1);
  alan.style.gridTemplateColumns = 'repeat(' + L + ', minmax(0, 1fr))';
  alan.style.gridTemplateRows = 'repeat(' + dagilim.length + ', minmax(0, 1fr))';

  let i = 0;
  dagilim.forEach((adet, r) => {
    const span = L / adet;
    for (let j = 0; j < adet; j++) {
      const k = kutular[i++];
      let n = dugumler.get(k.id);
      if (!n) { n = kutuOlustur(k); dugumler.set(k.id, n); alan.append(n); }
      n.style.gridRow = String(r + 1);
      n.style.gridColumn = (j * span + 1) + ' / span ' + span;
    }
  });
}

document.getElementById('ekle').onclick = () => {
  kutular.push({ id: ++sayi, tur: null, deger: '', baslik: '' });
  kaydet(); ciz();
};


// ---------- Şablonlar ----------
const SKEY = 'ekran-bolucu-sablonlar';
let sablonlar = [];
try { sablonlar = JSON.parse(localStorage.getItem(SKEY)) || []; } catch { sablonlar = []; }
const skaydet = () => localStorage.setItem(SKEY, JSON.stringify(sablonlar));

const panel = document.getElementById('panel');
const sablonBtn = document.getElementById('sablonBtn');

function panelCiz(mesaj) {
  panel.replaceChildren();
  panel.append(el('h3', '', 'Kayıtlı şablonlar'));

  if (!sablonlar.length) panel.append(el('div', 's-bos', 'Henüz şablon yok.'));
  for (const s of sablonlar) {
    const satir = el('div', 's-satir');
    const ac = el('button', 's-ac', s.ad);
    ac.append(el('small', '', s.kutular.length + ' kutu'));
    ac.onclick = () => {
      kutular = s.kutular.map(k => ({ ...k, id: ++sayi }));
      kaydet(); ciz(); panel.hidden = true;
    };
    const sil = el('button', 's-sil', '🗑'); sil.title = 'Şablonu sil';
    sil.onclick = () => {
      if (!confirm('"' + s.ad + '" şablonu silinsin mi?')) return;
      sablonlar = sablonlar.filter(x => x.id !== s.id);
      skaydet(); panelCiz();
    };
    satir.append(ac, sil);
    panel.append(satir);
  }

  panel.append(el('h3', '', 'Mevcut düzeni kaydet'));
  const f = el('div', 's-kaydet');
  const inp = el('input'); inp.placeholder = 'Şablon adı'; inp.maxLength = 40;
  const btn = el('button', '', 'Kaydet');
  const kaydetSablon = () => {
    const ad = inp.value.trim();
    const dolu = kutular.filter(k => k.tur).map(({ tur, deger, baslik }) => ({ tur, deger, baslik }));
    if (!dolu.length) return panelCiz('Kaydedilecek dolu kutu yok.');
    if (!ad) return panelCiz('Şablona bir ad ver.');
    const var_ = sablonlar.find(x => x.ad.toLowerCase() === ad.toLowerCase());
    if (var_) {
      if (!confirm('"' + var_.ad + '" zaten var. Üzerine yazılsın mı?')) return;
      var_.kutular = dolu;
    } else {
      sablonlar.push({ id: Date.now(), ad, kutular: dolu });
    }
    skaydet(); panelCiz();
  };
  btn.onclick = kaydetSablon;
  inp.onkeydown = (e) => { if (e.key === 'Enter') kaydetSablon(); };
  f.append(inp, btn);
  panel.append(f);
  if (mesaj) panel.append(el('div', 's-mesaj', mesaj));
}

sablonBtn.onclick = (e) => {
  e.stopPropagation();
  panel.hidden = !panel.hidden;
  if (!panel.hidden) panelCiz();
};
panel.onclick = (e) => e.stopPropagation();
document.addEventListener('click', () => { panel.hidden = true; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') panel.hidden = true; });

ciz();
