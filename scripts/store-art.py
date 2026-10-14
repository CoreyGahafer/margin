"""Draw the Margin mark and store artwork as reproducible, antialiased PNGs."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'store-kit/assets'
ICONS = ROOT / 'extension/icons'
ASSETS.mkdir(parents=True, exist_ok=True)
ICONS.mkdir(parents=True, exist_ok=True)
INK, PAPER, LIME = '#253b32', '#f7f5ee', '#dfef81'
FONT = '/System/Library/Fonts/Supplemental/Georgia.ttf'
SANS = '/System/Library/Fonts/Avenir Next.ttc'
SCALE = 3

def font(size, sans=False):
    return ImageFont.truetype(SANS if sans else FONT, int(size * SCALE))

def canvas(size, background):
    return Image.new('RGBA', (size[0]*SCALE, size[1]*SCALE), background)

def rect(draw, box, fill, radius=0, outline=None, width=1):
    box=tuple(int(v*SCALE) for v in box)
    if radius: draw.rounded_rectangle(box, radius=int(radius*SCALE), fill=fill, outline=outline, width=int(width*SCALE))
    else: draw.rectangle(box, fill=fill, outline=outline, width=int(width*SCALE))

def line(draw, points, fill, width):
    draw.line([(int(x*SCALE),int(y*SCALE)) for x,y in points], fill=fill,width=int(width*SCALE),joint='curve')

def save(image, target, size):
    image.resize(size,Image.Resampling.LANCZOS).save(target)

icon=canvas((128,128),(0,0,0,0)); d=ImageDraw.Draw(icon)
rect(d,(16,16,112,112),INK,22)
d.text((33*SCALE,22*SCALE),'m',font=font(78),fill=PAPER,stroke_width=0)
d.ellipse((89*SCALE,29*SCALE,99*SCALE,39*SCALE),fill=LIME)
for size in [16,32,48,128]: save(icon,ICONS/f'icon-{size}.png',(size,size))
save(icon,ASSETS/'store-icon-128.png',(128,128))

def book(draw, x, y, w, h):
    # Two readable pages with a lime listening marker in the margin.
    rect(draw,(x+8,y+12,x+w+8,y+h+12),'#162c23',8)
    rect(draw,(x,y,x+w,y+h),PAPER,8)
    line(draw,[(x+w/2,y+12),(x+w/2,y+h-12)],'#d5d8cb',2)
    for page in [0,1]:
        for row in range(6):
            left=x+16+page*w/2
            length=(w/2-32)*(1 if row%3 else .72)
            line(draw,[(left,y+27+row*13),(left+length,y+27+row*13)],'#8c9b8b',2)
    rect(draw,(x+w-34,y-12,x+w-7,y+49),LIME,4)
    for i,height in enumerate([12,22,32,22,12]):
        xx=x+w-23+(i-2)*5
        line(draw,[(xx,y+15-height/2),(xx,y+15+height/2)],INK,2)

promo=canvas((440,280),INK); d=ImageDraw.Draw(promo)
book(d,104,50,224,122)
d.text((157*SCALE,203*SCALE),'margin',font=font(35),fill=PAPER)
save(promo,ASSETS/'promo-440x280.png',(440,280))

marquee=canvas((1400,560),INK); d=ImageDraw.Draw(marquee)
d.text((74*SCALE,57*SCALE),'margin',font=font(34),fill=LIME)
d.text((70*SCALE,139*SCALE),'Good reads.\nOut loud.',font=font(93),fill=PAPER,spacing=7*SCALE)
d.text((76*SCALE,440*SCALE),'ARTICLE AUDIO. ON YOUR DEVICE.',font=font(15,True),fill=LIME)
book(d,855,169,420,208)
save(marquee,ASSETS/'marquee-1400x560.png',(1400,560))

sheet=Image.new('RGB',(920,690),PAPER)
sheet.paste(Image.open(ASSETS/'promo-440x280.png'),(16,16))
sheet.paste(Image.open(ASSETS/'store-icon-128.png'),(520,70),Image.open(ASSETS/'store-icon-128.png'))
sheet.paste(Image.open(ASSETS/'marquee-1400x560.png').resize((888,355)),(16,315))
sheet.save(ASSETS/'artwork-contact-sheet.png')
print('Created icons, required promo tile, and optional marquee artwork.')
