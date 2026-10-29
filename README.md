# Screen Split

Birden fazla web sayfası, doküman ve notu tek pencerede, ekranı eşit bölen kutularda göster.
"+" ile kutu ekle, kutuda ne açacağını seç (web sayfası, dosya, not).

## Görünüm ve belgeler
- Web kutuları kendi genişliğine göre masaüstü (900 px üstü), tablet (520-900 px) veya mobil görünümde açılır; kutu küçülüp büyüyünce görünüm otomatik değişir.
- PDF, resim, video, metin, Word (.docx) ve Excel (.xlsx, .xls, .csv) kutuda açılır. Word/Excel dosyaları salt okunur gösterilir.

## Şablonlar
Üstteki "Şablonlar" düğmesinden mevcut düzeni (kutular, adresler, dosyalar, notlar) bir adla kaydet,
sonra istediğin zaman listeden seçip aynı düzeni aç. Çöp kutusu simgesiyle şablon silinir.

## Desteklenen dosyalar
PDF, resim, video, metin, Word (.docx) ve Excel (.xlsx, .xls, .csv) kutuda açılır. Eski .doc için uyarı çıkar (.docx veya PDF olarak kaydedip aç).

## Çalıştırma (test)
    npm install
    npm start

## GitHub'da derleme
1. Bu klasörü bir GitHub deposuna yükle.
2. Actions sekmesi > "Windows derleme" > Run workflow
   (veya `v1.0.0` gibi bir etiket gönder).
3. Bitince "screen-split-windows" çıktısını indir:
   - `Screen-Split-Kurulum-*.exe`: kurulum dosyası
   - `Screen-Split-Tasinabilir-*.exe`: kurulumsuz çalışan sürüm
   - `Screen-Split-Store-*.appx`: Microsoft Store paketi

## Microsoft Store için
`package.json` içindeki `build.appx` alanı Partner Center'daki "Screen Split" ürün kimliğiyle doldurulmuştur
(`KayhanTEKN.ScreenSplit`, yayıncı kimliği ve "Kayhan TEKİN"). Store'a yüklenen paket Microsoft tarafından
imzalanır, ayrıca sertifika gerekmez.

## Logo
`make_icons.py` logoyu `build/` klasörüne üretir. Değiştirmek istersen bu dosyayı düzenleyip
`python make_icons.py` çalıştır.
