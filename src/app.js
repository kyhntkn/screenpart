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

function kutuOlustur(k) {
  const kutu = el('section', 'kutu');
  const ust = el('div', 'kutu-ust');
  const baslik = el('span', 'baslik', k.baslik || 'Boş kutu');
  const yenile = el('button', 'ikon', '⟳'); yenile.title = 'Yenile';
  const degistir = el('button', 'ikon', '⇄'); degistir.title = 'İçeriği değiştir';
  const kapat = el('button', 'ikon kapat', '✕'); kapat.title = 'Kutuyu kapat';
  const notKaydet = el('button', 'ikon', '💾'); notKaydet.title = 'Notu .txt dosyası olarak kaydet';
  notKaydet.style.display = 'none';
  const ic = el('div', 'kutu-ic');

  if (k.tur === 'web' || k.tur === 'dosya') {
    const wv = document.createElement('webview');
    wv.setAttribute('src', k.deger);
    wv.setAttribute('allowpopups', '');
    wv.addEventListener('page-title-updated', (e) => {
      if (k.tur === 'web') baslik.textContent = e.title;
    });
    yenile.onclick = () => wv.reload();
    ic.append(wv);
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

  degistir.onclick = () => { k.tur = null; k.deger = ''; k.baslik = ''; kaydet(); ciz(); };
  kapat.onclick = () => { kutular = kutular.filter(x => x.id !== k.id); kaydet(); ciz(); };

  ust.append(baslik, notKaydet, yenile, degistir, kapat);
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
      k.tur = 'web'; k.deger = url; k.baslik = url; kaydet(); ciz();
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
    const uzanti = (r.ad.split('.').pop() || '').toLowerCase();
    const officeUzantilari = ['doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'odt', 'ods'];
    if (officeUzantilari.includes(uzanti)) {
      try {
        const hata = await window.api.belgeAc(r.yol);
        if (hata) alert('Belge varsayılan uygulamada açılamadı: ' + hata);
      } catch (err) {
        alert('Belge açılamadı: ' + err.message);
      }
      return;
    }
    k.tur = 'dosya'; k.deger = r.url; k.baslik = r.ad; kaydet(); ciz();
  };
  not.onclick = () => { k.tur = 'not'; k.deger = ''; k.baslik = 'Not'; kaydet(); ciz(); };

  s.append(web, dosya, not);
  ic.append(s);
}

function ciz() {
  alan.replaceChildren();
  sayac.textContent = kutular.length ? kutular.length + ' kutu' : '';
  if (!kutular.length) {
    const b = el('div', 'bos');
    b.append(el('b', '', 'Henüz kutu yok'), document.createElement('br'), 'Sağ üstteki + düğmesiyle kutu ekle veya Şablonlar\'dan kayıtlı bir düzeni aç.');
    alan.append(b);
    return;
  }
  let i = 0;
  for (const adet of satirlar(kutular.length)) {
    const satir = el('div', 'satir');
    for (let j = 0; j < adet; j++) satir.append(kutuOlustur(kutular[i++]));
    alan.append(satir);
  }
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
