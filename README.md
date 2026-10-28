# Ekran Bölücü

Birden fazla web sayfası, doküman ve notu tek pencerede, ekranı eşit bölen kutularda göster.
"+" ile kutu ekle, kutuda ne açacağını seç (web sayfası, dosya, not).

## Şablonlar
Üstteki "Şablonlar" düğmesinden mevcut düzeni (kutular, adresler, dosyalar, notlar) bir adla kaydet,
sonra istediğin zaman listeden seçip aynı düzeni aç. Çöp kutusu simgesiyle şablon silinir.

## Çalıştırma (test)
    npm install
    npm start

## GitHub'da derleme
1. Bu klasörü bir GitHub deposuna yükle.
2. Actions sekmesi > "Windows derleme" > Run workflow
   (veya `v1.0.0` gibi bir etiket gönder).
3. Bitince "ekran-bolucu-windows" çıktısını indir:
   - `Ekran-Bolucu-Kurulum-*.exe`: kurulum dosyası
   - `Ekran-Bolucu-Tasinabilir-*.exe`: kurulumsuz çalışan sürüm
   - `Ekran-Bolucu-Store-*.appx`: Microsoft Store paketi

## Microsoft Store için
`package.json` içindeki `build.appx` alanındaki 3 değeri (şu an yer tutucu, Store paketi bunlar değişmeden Store'a yüklenemez) Partner Center'dan al ve değiştir:
`identityName`, `publisher`, `publisherDisplayName`
(Partner Center > Ürün kimliği sayfasında yazar). Bunlar doğru değilse Store paketi yüklenmez.
Store'a gönderilen paket Microsoft tarafından imzalanır, ayrıca sertifika gerekmez.

## Logo
`make_icons.py` logoyu `build/` klasörüne üretir. Değiştirmek istersen bu dosyayı düzenleyip
`python make_icons.py` çalıştır.
