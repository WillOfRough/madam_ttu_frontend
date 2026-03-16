#!/usr/bin/env python3
"""Generate OG image for Knots & Links invite links (1200x630)"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

W, H = 1200, 630
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'og-image.png')

# Colors (from design system)
NAVY = (26, 43, 75)        # --navy #1A2B4B
NAVY_LIGHT = (44, 62, 103) # lighter navy
CORAL = (255, 126, 103)    # --coral #FF7E67
ROSE_GOLD = (200, 155, 140)  # rope/knot color
ROSE_DARK = (170, 120, 105)  # darker rope for depth
WHITE = (255, 255, 255)

img = Image.new('RGB', (W, H), NAVY)
draw = ImageDraw.Draw(img)

# Background gradient effect
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


def draw_thick_line(draw, start, end, width, color):
    """Draw a thick line between two points."""
    draw.line([start, end], fill=color, width=width)


def draw_chain_link(draw, cx, cy, w, h, thickness, color, dark_color):
    """Draw a single chain link (oval ring)."""
    # Outer oval
    draw.ellipse([(cx - w, cy - h), (cx + w, cy + h)], outline=color, width=thickness)
    # Inner highlight
    draw.ellipse([(cx - w + 2, cy - h + 2), (cx + w - 2, cy + h - 2)], outline=dark_color, width=max(1, thickness - 2))


def draw_knot_symbol(draw, cx, cy, scale=1.0):
    """Draw a rope knot with chain links - inspired by the Knots & Links logo."""
    s = scale

    # --- Chain links on left side ---
    draw_chain_link(draw, int(cx - 110 * s), int(cy), int(12 * s), int(18 * s), int(4 * s), ROSE_GOLD, ROSE_DARK)
    draw_chain_link(draw, int(cx - 85 * s), int(cy), int(12 * s), int(18 * s), int(4 * s), ROSE_GOLD, ROSE_DARK)

    # --- Chain links on right side ---
    draw_chain_link(draw, int(cx + 85 * s), int(cy), int(12 * s), int(18 * s), int(4 * s), ROSE_GOLD, ROSE_DARK)
    draw_chain_link(draw, int(cx + 110 * s), int(cy), int(12 * s), int(18 * s), int(4 * s), ROSE_GOLD, ROSE_DARK)

    # --- Horizontal rope lines connecting to knot ---
    rope_w = int(5 * s)
    # Left rope
    draw_thick_line(draw, (int(cx - 73 * s), int(cy)), (int(cx - 40 * s), int(cy)), rope_w, ROSE_GOLD)
    # Right rope
    draw_thick_line(draw, (int(cx + 40 * s), int(cy)), (int(cx + 73 * s), int(cy)), rope_w, ROSE_GOLD)

    # --- Central knot (pretzel/figure-eight knot) ---
    # Draw two interlinked loops to form the knot
    loop_r = int(28 * s)
    offset = int(16 * s)

    # Left loop (slightly left and up)
    for t in range(360):
        angle = math.radians(t)
        x = cx - offset + int(loop_r * math.cos(angle))
        y = cy + int(loop_r * 0.8 * math.sin(angle))
        for dx in range(-int(3 * s), int(3 * s) + 1):
            for dy in range(-int(2 * s), int(2 * s) + 1):
                if dx * dx + dy * dy <= (3 * s) ** 2:
                    px, py = x + dx, y + dy
                    if 0 <= px < W and 0 <= py < H:
                        img.putpixel((px, py), ROSE_GOLD)

    # Right loop (slightly right and up)
    for t in range(360):
        angle = math.radians(t)
        x = cx + offset + int(loop_r * math.cos(angle))
        y = cy + int(loop_r * 0.8 * math.sin(angle))
        for dx in range(-int(3 * s), int(3 * s) + 1):
            for dy in range(-int(2 * s), int(2 * s) + 1):
                if dx * dx + dy * dy <= (3 * s) ** 2:
                    px, py = x + dx, y + dy
                    if 0 <= px < W and 0 <= py < H:
                        img.putpixel((px, py), ROSE_GOLD)

    # Crossing effect: draw a darker band at the crossing point
    cross_x = cx
    cross_y = cy
    # Vertical dark stripe to simulate "over-under" crossing
    draw.rectangle([
        (int(cross_x - 4 * s), int(cross_y - 12 * s)),
        (int(cross_x + 4 * s), int(cross_y + 12 * s))
    ], fill=ROSE_DARK)
    # Redraw the horizontal rope segment over the crossing for "over" effect
    draw_thick_line(draw,
        (int(cross_x - 14 * s), int(cross_y)),
        (int(cross_x + 14 * s), int(cross_y)),
        int(6 * s), ROSE_GOLD)

    # Rope texture lines (subtle horizontal stripes on the loops)
    draw = ImageDraw.Draw(img)
    for angle_deg in range(0, 360, 30):
        angle = math.radians(angle_deg)
        for loop_cx in [cx - offset, cx + offset]:
            x = loop_cx + int(loop_r * math.cos(angle))
            y = cy + int(loop_r * 0.8 * math.sin(angle))
            # Small tick marks for rope texture
            draw.line([(x - 2, y - 1), (x + 2, y + 1)], fill=ROSE_DARK, width=1)


# Draw the knot symbol
draw_knot_symbol(draw, W // 2, 120, scale=1.1)

# Load fonts
FONT_PATH = '/System/Library/Fonts/AppleSDGothicNeo.ttc'
try:
    font_logo = ImageFont.truetype(FONT_PATH, 48, index=0)
    font_title = ImageFont.truetype(FONT_PATH, 56, index=5)  # Bold
    font_sub = ImageFont.truetype(FONT_PATH, 28, index=0)
except Exception:
    font_logo = ImageFont.truetype(FONT_PATH, 48)
    font_title = ImageFont.truetype(FONT_PATH, 56)
    font_sub = ImageFont.truetype(FONT_PATH, 28)

# Logo text
draw.text((W // 2, 225), 'Knots & Links', font=font_logo, fill=CORAL, anchor='mm')

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
