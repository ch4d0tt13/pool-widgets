# 직접 그린 물 그림을 위젯용 도트 그림으로 바꾼다 (가로 180칸으로 줄인 뒤, 끝과 처음이 이어지게 잘라 붙여 150×46)
# 그림을 그대로 줄이지 않고 겹(레이어)별로 뽑아 도트 규칙대로 다시 그린다.
# 색은 넣지 않고 채널마다 한 겹을 담는다. 색은 위젯이 장면 토큰으로 칠한다(water-art.js).
#   R: 빛 그물 (0 물 · 128 분홍 테두리 · 255 하얀 선)
#   G: 물 조각 안 그늘 (0 · 255)
#   B: 물 색 (0 파랑 · 128 섞임 · 255 민트)
# 사용: python tools/pixelate.py <원본 그림> shared/img/water.png
# 원본은 저장소에 올리지 않고, 결과 그림만 올린다
import sys

import numpy as np
from PIL import Image

WIDTH = 180
NET_MIN = 228  # 세 채널이 모두 이보다 밝으면 하얀 선
NET_COVER = 0.35  # 칸의 이만큼이 하얀 선이면 그 칸은 선 (낮을수록 가는 선도 끊기지 않는다)
RIM_RED = 205  # 하얀 선 둘레에서 빨강이 이보다 밝으면 분홍 테두리
SHADOW_DROP = 10  # 주변 물보다 이만큼 어두우면 그늘
HUE_BLUR = 60  # 물 색은 넓게 뭉개서 큰 흐름만 본다
HUE_MIX = (-9, -3)  # 이 사이의 물 색은 파랑·민트를 체크무늬로 섞는다
SPECK = 14  # 이보다 작은 하얀 덩어리는 원본의 반짝이라서 뺀다 (반짝임은 위젯이 그린다)
OVERLAP = (30, 14)  # 끝과 처음을 겹쳐 잘라 붙일 폭 (가로, 세로)
HOLE = 8  # 하얀 선 속 이보다 작은 물 구멍은 메운다 (구멍마다 분홍 점이 생기지 않게)


def coverage(mask, size):
    """원본 크기 마스크를 칸 크기로 줄여, 칸마다 덮인 비율(0~1)을 돌려준다"""
    small = Image.fromarray((mask * 255).astype(np.uint8)).resize(size, Image.BOX)
    return np.asarray(small) / 255


def below_right(mask):
    """바로 위나 바로 왼쪽 칸이 켜진 칸 (빛이 왼쪽 위에서 비친다고 보고 테두리는 아래·오른쪽에만)"""
    return np.roll(mask, 1, 0) | np.roll(mask, 1, 1)


def blur(values, r):
    """가로세로 (2r+1)칸 평균 (가장자리는 있는 칸만으로)"""
    def run(a, axis):
        c = np.cumsum(np.pad(a, [(r + 1, r) if i == axis else (0, 0) for i in range(2)], mode="edge"), axis=axis)
        hi = np.take(c, range(2 * r + 1, c.shape[axis]), axis=axis)
        lo = np.take(c, range(0, c.shape[axis] - 2 * r - 1), axis=axis)
        return (hi - lo) / (2 * r + 1)
    return run(run(values.astype(np.float64), 0), 1)


def drop_specks(mask, smallest):
    """이어진 칸 수가 smallest보다 적은 덩어리를 지운다"""
    h, w = mask.shape
    seen = np.zeros_like(mask)
    out = mask.copy()
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]:
            continue
        stack, blob = [(y, x)], []
        seen[y, x] = True
        while stack:
            cy, cx = stack.pop()
            blob.append((cy, cx))
            for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        if len(blob) < smallest:
            for cy, cx in blob:
                out[cy, cx] = False
    return out


def around(mask):
    """칸마다 이웃 8칸 중 켜진 칸 수 (끝과 처음이 이어진 그림으로 본다)"""
    steps = [(dy, dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx]
    return sum(np.roll(mask, (dy, dx), (0, 1)).astype(np.uint8) for dy, dx in steps)


def tidy(mask, keep=2):
    """이웃(8칸) 중 켜진 칸이 keep개보다 적은 외톨이 점을 지운다"""
    return mask & (around(mask) >= keep)


def smooth(mask):
    """가장자리 계단을 다듬는다: 이웃 5칸 이상이 켜진 빈칸은 채우고, 2칸 이하인 칸은 지운다"""
    count = around(mask)
    return (mask | (count >= 5)) & (count >= 3)


def seam_wrap(layers, overlap, axis):
    """끝과 처음이 이어지게 만든다 (거울로 뒤집지 않고).
    끝의 overlap칸과 처음의 overlap칸을 겹쳐 두고, 두 쪽 무늬가 가장 비슷한 길을 따라 잘라 붙인다"""
    if axis == 0:
        return seam_wrap(layers.swapaxes(0, 1), overlap, 1).swapaxes(0, 1)
    h, w = layers.shape[:2]
    end, start = layers[:, w - overlap :], layers[:, :overlap]
    net_e, net_s = end[..., 0] > 0, start[..., 0] > 0
    water = ~(net_e | net_s)  # 하얀 선에 덮인 곳은 그늘·물 색이 달라도 보이지 않는다
    cost = 2.0 * (net_e != net_s) + water * ((end[..., 2] != start[..., 2]) + 0.5 * (end[..., 3] != start[..., 3]))
    # 줄마다 자를 자리를 고른다 (이웃 줄과 한 칸까지만 어긋나게)
    acc = cost.copy()
    acc[:, 0] = acc[:, -1] = np.inf  # 맨 끝을 자르면 이음새가 그대로 남는다
    for y in range(1, h):
        prev = np.minimum(np.minimum(np.roll(acc[y - 1], 1), acc[y - 1]), np.roll(acc[y - 1], -1))
        acc[y] += prev
    cut = np.empty(h, int)
    cut[-1] = int(np.argmin(acc[-1]))
    for y in range(h - 2, -1, -1):
        c = cut[y + 1]
        lo, hi = max(1, c - 1), min(overlap - 2, c + 1)
        cut[y] = lo + int(np.argmin(acc[y, lo : hi + 1]))
    joined = np.where((np.arange(overlap)[None, :] < cut[:, None])[..., None], end, start)
    return np.concatenate([joined, layers[:, overlap : w - overlap]], axis=1)


src, out = sys.argv[1:3]
image = Image.open(src).convert("RGB")
rgb = np.asarray(image).astype(int)
size = (WIDTH, round(WIDTH * image.height / image.width))

# 하얀 빛 그물과 그 둘레의 분홍 테두리
net_full = rgb.min(axis=2) > NET_MIN
net = smooth(drop_specks(tidy(coverage(net_full, size) > NET_COVER), SPECK))
net |= ~drop_specks(~net, HOLE)
rim_full = (rgb[..., 0] > RIM_RED) & ~net_full
rim_glow = coverage(rim_full | net_full, size) > 0.3  # 원본에서 분홍빛이 도는 곳

# 물 조각 안 그늘: 주변 물보다 어두운 줄무늬
lum = rgb.mean(axis=2)
water_lum = np.where(net_full | rim_full, np.nan, lum)
fill = np.where(np.isnan(water_lum), np.nanmean(water_lum), water_lum)
local = blur(fill, 40)
shadow = tidy(coverage((lum < local - SHADOW_DROP) & ~net_full & ~rim_full, size) > 0.5, keep=3)

# 물 색: 파랑(초록보다 파랑이 진함) → 민트, 가운데는 체크무늬로 섞는다
mint_full = (rgb[..., 1] - rgb[..., 2]).astype(np.float32)
hue = np.asarray(Image.fromarray(blur(mint_full, HUE_BLUR).astype(np.float32)).resize(size, Image.BOX))
hue_level = np.where(hue > HUE_MIX[1], 255, np.where(hue < HUE_MIX[0], 0, 128)).astype(np.uint8)

# 끝과 처음이 이어지게 잘라 붙인 뒤, 이음새를 다듬고 테두리를 두른다
tile = np.stack([net, rim_glow, shadow, hue_level], axis=2).astype(np.uint8)
tile = seam_wrap(seam_wrap(tile, OVERLAP[0], 1), OVERLAP[1], 0)
net = smooth(tile[..., 0] > 0)
rim = tidy(below_right(net) & ~net & (tile[..., 1] > 0), keep=1)
shadow = tile[..., 2] > 0

layers = np.stack(
    [
        np.where(net, 255, np.where(rim, 128, 0)).astype(np.uint8),
        np.where(shadow, 255, 0).astype(np.uint8),
        tile[..., 3],
    ],
    axis=2,
)
Image.fromarray(layers, "RGB").save(out, optimize=True)
h, w = net.shape
print(f"{out}: {w}x{h}, 빛 그물 {net.mean():.0%} · 테두리 {rim.mean():.0%} · 그늘 {shadow.mean():.0%}")
