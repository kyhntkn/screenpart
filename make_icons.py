# Logoyu PNG/ICO olarak üretir (bir kez çalıştırıldı, build/ klasörüne yazıldı)
from PIL import Image, ImageDraw
S = 1024
def logo(size):
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    k = S / 64
    d.rounded_rectangle([0, 0, S, S], 14 * k, fill="#14161a")
    for (x, y, c) in [(9, 9, "#3ea6ff"), (34, 9, "#5ad1a0"), (9, 34, "#ffb454"), (34, 34, "#ff7a90")]:
        d.rounded_rectangle([x * k, y * k, (x + 21) * k, (y + 21) * k], 5 * k, fill=c)
    w = int(3.2 * k)
    d.line([44.5 * k, 38.5 * k, 44.5 * k, 50.5 * k], fill="#14161a", width=w)
    d.line([38.5 * k, 44.5 * k, 50.5 * k, 44.5 * k], fill="#14161a", width=w)
    return im.resize((size, size), Image.LANCZOS)
base = logo(S)
base.save("build/icon.png")
base.save("build/icon.ico", sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
def tile(w, h, name):
    im = Image.new("RGBA", (w, h), "#14161a")
    s = int(min(w, h) * 0.8)
    l = logo(s)
    im.paste(l, ((w - s) // 2, (h - s) // 2), l)
    im.save(f"build/appx/{name}.png")
tile(50, 50, "StoreLogo"); tile(44, 44, "Square44x44Logo")
tile(150, 150, "Square150x150Logo"); tile(310, 150, "Wide310x150Logo")
tile(71, 71, "SmallTile"); tile(310, 310, "LargeTile")
