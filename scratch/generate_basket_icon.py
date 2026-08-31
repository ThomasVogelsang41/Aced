import sys
from PIL import Image, ImageDraw

def draw_basket():
    size = 256
    img = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # Coordinates scaling
    cx = size // 2

    # Color palette
    black = (15, 23, 42, 255) # Sleek #0F172A
    blue = (0, 85, 255, 255)  # ACED Blue #0055FF
    white = (255, 255, 255, 255)

    # Line widths
    thick = 10
    medium = 7
    thin = 5

    # 1. Top Chain Band Outer Frame (Black)
    top_y1 = 28
    top_y2 = 58
    top_w = 170
    draw.rectangle([cx - top_w//2, top_y1, cx + top_w//2, top_y2], fill=black)

    # Inner Blue Stripe
    stripe_margin = 8
    draw.rectangle([cx - top_w//2 + stripe_margin, top_y1 + 8, cx + top_w//2 - stripe_margin, top_y2 - 8], fill=blue)

    # 2. Chains Area
    chain_top_y = top_y2
    chain_bottom_y = 145

    # Center vertical chain line
    draw.line([cx, chain_top_y, cx, chain_bottom_y], fill=black, width=medium)

    # Outer left and right chain lines
    draw.line([cx - 60, chain_top_y, cx - 25, chain_bottom_y], fill=black, width=medium)
    draw.line([cx + 60, chain_top_y, cx + 25, chain_bottom_y], fill=black, width=medium)

    # Inner left and right curved chain lines
    draw.arc([cx - 55, chain_top_y - 20, cx, chain_bottom_y + 10], 0, 180, fill=black, width=medium)
    draw.arc([cx, chain_top_y - 20, cx + 55, chain_bottom_y + 10], 0, 180, fill=black, width=medium)

    # 3. Catchment Basket Tray
    basket_y1 = 145
    basket_y2 = 185
    basket_w = 190

    # Draw main basket outer frame (trapezoid)
    basket_points = [
        (cx - basket_w//2, basket_y1),
        (cx + basket_w//2, basket_y1),
        (cx + basket_w//2 - 15, basket_y2),
        (cx - basket_w//2 + 15, basket_y2)
    ]
    draw.polygon(basket_points, outline=black, fill=white, width=thick)

    # Vertical cage bars inside tray
    draw.line([cx - 45, basket_y1, cx - 38, basket_y2], fill=black, width=medium)
    draw.line([cx - 18, basket_y1, cx - 14, basket_y2], fill=black, width=medium)
    draw.line([cx, basket_y1, cx, basket_y2], fill=black, width=thick)
    draw.line([cx + 18, basket_y1, cx + 14, basket_y2], fill=black, width=medium)
    draw.line([cx + 45, basket_y1, cx + 38, basket_y2], fill=black, width=medium)

    # Top and bottom horizontal rim lines of basket
    draw.line([cx - basket_w//2, basket_y1, cx + basket_w//2, basket_y1], fill=black, width=thick)
    draw.line([cx - basket_w//2 + 15, basket_y2, cx + basket_w//2 - 15, basket_y2], fill=black, width=thick)

    # 4. Center Pole
    pole_y1 = basket_y2
    pole_y2 = 230
    draw.line([cx, pole_y1, cx, pole_y2], fill=black, width=thick + 2)

    # 5. Base Foot Stand
    draw.line([cx - 50, pole_y2, cx + 50, pole_y2], fill=black, width=thick + 2)

    import os
    out_dir = r"c:\Users\Thomas Vogelsang\Documents\GitHub\Aced\assets\images"
    os.makedirs(out_dir, exist_ok=True)
    output_path = os.path.join(out_dir, "disc_golf_basket_pin.png")
    img.save(output_path, "PNG")
    print("Basket PNG generated successfully at:", output_path)

if __name__ == "__main__":
    draw_basket()
