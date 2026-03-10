#!/usr/bin/env python3
"""Generate OG image for findmyone invite links (1200x630)"""

from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 630
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'og-image.png')

# Colors (from design system)
NAVY = (26, 43, 75)        # --navy #1A2B4B
NAVY_LIGHT = (44, 62, 103) # lighter navy
CORAL = (255, 126, 103)    # --coral #FF7E67
WHITE = (255, 255, 255)
WARM_BG = (250, 248, 245)  # --bg-warm

img = Image.new('RGB', (W, H), NAVY)
draw = ImageDraw.Draw(img)

# Background gradient effect - subtle horizontal bands
for y in range(H):
    r = int(NAVY[0] + (NAVY_LIGHT[0] - NAVY[0]) * (y / H) * 0.5)
    g = int(NAVY[1] + (NAVY_LIGHT[1] - NAVY[1]) * (y / H) * 0.5)
    b = int(NAVY[2] + (NAVY_LIGHT[2] - NAVY[2]) * (y / H) * 0.5)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Decorative coral accent bar at top
draw.rectangle([(0, 0), (W, 5)], fill=CORAL)

# Decorative circles (subtle)
for cx, cy, rad, alpha in [(100, 500, 180, 20), (1100, 130, 140, 15), (900, 520, 100, 12)]:
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse(
        [(cx - rad, cy - rad), (cx + rad, cy + rad)],
        fill=(CORAL[0], CORAL[1], CORAL[2], alpha)
    )
    img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
    draw = ImageDraw.Draw(img)

# Load fonts
FONT_PATH = '/System/Library/Fonts/AppleSDGothicNeo.ttc'
try:
    font_logo = ImageFont.truetype(FONT_PATH, 52, index=0)
    font_title = ImageFont.truetype(FONT_PATH, 56, index=5)  # Bold
    font_sub = ImageFont.truetype(FONT_PATH, 28, index=0)
    font_emoji = ImageFont.truetype('/System/Library/Fonts/Apple Color Emoji.ttc', 70)
except Exception:
    font_logo = ImageFont.truetype(FONT_PATH, 52)
    font_title = ImageFont.truetype(FONT_PATH, 56)
    font_sub = ImageFont.truetype(FONT_PATH, 28)
    font_emoji = ImageFont.truetype(FONT_PATH, 70)

# Heart icon (two overlapping circles + triangle)
hx, hy = W // 2, 130
hr = 28
# Left circle
draw.ellipse([(hx - hr - 8, hy - hr), (hx - 8 + hr, hy + hr)], fill=CORAL)
# Right circle
draw.ellipse([(hx + 8 - hr, hy - hr), (hx + 8 + hr, hy + hr)], fill=CORAL)
# Bottom triangle
draw.polygon([(hx - hr - 8, hy + 10), (hx + hr + 8, hy + 10), (hx, hy + hr + 30)], fill=CORAL)

# Logo text
draw.text((W // 2, 230), 'findmyone', font=font_logo, fill=CORAL, anchor='mm')

# Main title
draw.text((W // 2, 320), '소중한 인연을 연결합니다', font=font_title, fill=WHITE, anchor='mm')

# Subtitle
draw.text((W // 2, 400), '당신만을 위한 특별한 소개팅이 준비되었어요', font=font_sub, fill=(200, 210, 225), anchor='mm')

# Coral pill button shape at bottom
pill_text = '지금 시작하기'
pill_w, pill_h = 260, 56
pill_x = (W - pill_w) // 2
pill_y = 480
pill_r = pill_h // 2
# Draw rounded rectangle
draw.rounded_rectangle(
    [(pill_x, pill_y), (pill_x + pill_w, pill_y + pill_h)],
    radius=pill_r,
    fill=CORAL
)
try:
    font_pill = ImageFont.truetype(FONT_PATH, 24, index=5)
except Exception:
    font_pill = ImageFont.truetype(FONT_PATH, 24)
draw.text((W // 2, pill_y + pill_h // 2), pill_text, font=font_pill, fill=WHITE, anchor='mm')

# Bottom bar
draw.rectangle([(0, H - 4), (W, H)], fill=CORAL)

img.save(OUT, 'PNG', quality=95)
print(f'OG image saved: {OUT} ({os.path.getsize(OUT) // 1024}KB)')
