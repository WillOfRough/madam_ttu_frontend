#!/usr/bin/env python3
"""Generate OG image for Knots & Links invite links (1200x630)
   Uses the knot icon cropped from the reference logo image."""

from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import os

W, H = 1200, 630
SCRIPT_DIR = os.path.dirname(__file__)
OUT = os.path.join(SCRIPT_DIR, '..', 'public', 'og-image.png')
LOGO_SRC = os.path.expanduser('~/Downloads/Gemini_Generated_Image_7a9cny7a9cny7a9c.png')

# Colors
NAVY = (26, 43, 75)
NAVY_LIGHT = (44, 62, 103)
CORAL = (255, 126, 103)
WHITE = (255, 255, 255)

img = Image.new('RGB', (W, H), NAVY)
draw = ImageDraw.Draw(img)

# Background gradient
for y in range(H):
    r = int(NAVY[0] + (NAVY_LIGHT[0] - NAVY[0]) * (y / H) * 0.5)
    g = int(NAVY[1] + (NAVY_LIGHT[1] - NAVY[1]) * (y / H) * 0.5)
    b = int(NAVY[2] + (NAVY_LIGHT[2] - NAVY[2]) * (y / H) * 0.5)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Top accent bar
draw.rectangle([(0, 0), (W, 5)], fill=CORAL)

# Decorative circles
for cx, cy, rad, alpha in [(100, 500, 180, 20), (1100, 130, 140, 15), (900, 520, 100, 12)]:
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse([(cx - rad, cy - rad), (cx + rad, cy + rad)],
               fill=(CORAL[0], CORAL[1], CORAL[2], alpha))
    img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
    draw = ImageDraw.Draw(img)

# ── Extract knot from reference image ──
logo_img = Image.open(LOGO_SRC).convert('RGBA')
# Knot only (without "Knots" text below): y=483 to y=750
# Tighter horizontal crop to avoid edge shadows
knot_crop = logo_img.crop((500, 470, 1500, 740))
kw, kh = knot_crop.size

# Remove light/cream background - make it transparent
# Background is cream-colored (~RGB 230,225,215), knot is rose-gold (high R, low B)
knot_data = knot_crop.load()
for py in range(kh):
    for px in range(kw):
        r, g, b, a = knot_data[px, py]
        brightness = (r + g + b) / 3
        # Check if pixel is close to cream/white background
        # Background pixels: high brightness AND low color saturation
        max_c = max(r, g, b)
        min_c = min(r, g, b)
        saturation = (max_c - min_c) / max(max_c, 1)

        if brightness > 200:
            knot_data[px, py] = (r, g, b, 0)
        elif brightness > 175 and saturation < 0.15:
            # Gray-ish background shadow → fade out
            fade = (brightness - 175) / 25
            new_alpha = int((1 - fade) * 200)
            knot_data[px, py] = (r, g, b, max(0, min(new_alpha, a)))
        elif brightness > 155 and saturation < 0.12:
            # Very low saturation = gray background artifact
            fade = (brightness - 155) / 20
            knot_data[px, py] = (r, g, b, int(a * max(0, 1 - fade)))
        else:
            # Actual knot pixel - brighten for contrast on dark bg
            boost = 1.3
            nr = min(255, int(r * boost))
            ng = min(255, int(g * boost * 0.9))
            nb = min(255, int(b * boost * 0.85))
            knot_data[px, py] = (nr, ng, nb, a)

# Resize knot to target width ~380px for good visibility
knot_target_w = 380
knot_ratio = knot_target_w / kw
knot_target_h = int(kh * knot_ratio)
knot_resized = knot_crop.resize((knot_target_w, knot_target_h), Image.LANCZOS)

# Paste knot centered
knot_x = (W - knot_target_w) // 2
knot_y = 30
img_rgba = img.convert('RGBA')
img_rgba.paste(knot_resized, (knot_x, knot_y), knot_resized)
img = img_rgba.convert('RGB')
draw = ImageDraw.Draw(img)

# ── Fonts ──
FONT_PATH = '/System/Library/Fonts/AppleSDGothicNeo.ttc'
try:
    font_logo = ImageFont.truetype(FONT_PATH, 52, index=0)
    font_title = ImageFont.truetype(FONT_PATH, 56, index=5)
    font_sub = ImageFont.truetype(FONT_PATH, 28, index=0)
except Exception:
    font_logo = ImageFont.truetype(FONT_PATH, 52)
    font_title = ImageFont.truetype(FONT_PATH, 56)
    font_sub = ImageFont.truetype(FONT_PATH, 28)

# Logo text below knot
logo_y = knot_y + knot_target_h + 20
draw.text((W // 2, logo_y), 'Knots & Links', font=font_logo, fill=CORAL, anchor='mm')

# Main title
draw.text((W // 2, logo_y + 85), '소중한 인연을 연결합니다', font=font_title, fill=WHITE, anchor='mm')

# Subtitle
draw.text((W // 2, logo_y + 160), '당신만을 위한 특별한 소개팅이 준비되었어요', font=font_sub, fill=(200, 210, 225), anchor='mm')

# Pill button
pill_text = '지금 시작하기'
pill_w, pill_h = 260, 56
pill_x = (W - pill_w) // 2
pill_y = logo_y + 225
pill_r = pill_h // 2
draw.rounded_rectangle([(pill_x, pill_y), (pill_x + pill_w, pill_y + pill_h)],
                       radius=pill_r, fill=CORAL)
try:
    font_pill = ImageFont.truetype(FONT_PATH, 24, index=5)
except Exception:
    font_pill = ImageFont.truetype(FONT_PATH, 24)
draw.text((W // 2, pill_y + pill_h // 2), pill_text, font=font_pill, fill=WHITE, anchor='mm')

# Bottom bar
draw.rectangle([(0, H - 4), (W, H)], fill=CORAL)

img.save(OUT, 'PNG', quality=95)
print(f'OG image saved: {OUT} ({os.path.getsize(OUT) // 1024}KB)')
