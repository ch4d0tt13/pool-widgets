# 직접 그린 물 그림을 위젯용 도트 그림으로 바꾼다 (가로 180칸으로 줄인 뒤, 끝과 처음이 이어지게 잘라 붙여 150×46)
# 그림을 그대로 줄이지 않고 빛 그물만 뽑아 도트 규칙대로 다시 그린다.
# 그늘은 빛 그물을 살짝 비켜 비틀어 위젯이 그리고, 물 색은 위젯이 창 위치로 정한다(그림 속 색은 쓰지 않는다).
# 색은 넣지 않고 채널마다 한 겹을 담는다. 색은 위젯이 장면 토큰으로 칠한다(water-art.js).
#   R: 빛 그물 (0 물 · 128 분홍 테두리 · 255 하얀 선)
#   G: 물 조각의 가운데 가로 위치 (칸). 위젯이 조각마다 창 왼쪽은 어두운 하늘 → 오른쪽은 밝은 하늘로 칠한다
# 사용: python tools/pixelate.py <원본 그림> shared/img/water.png
# 원본은 저장소에 올리지 않고, 결과 그림만 올린다
import sys
from collections import deque

import numpy as np
from PIL import Image

WIDTH = 180
NET_MIN = 228  # 세 채널이 모두 이보다 밝으면 하얀 선
NET_COVER = 0.35  # 칸의 이만큼이 하얀 선이면 그 칸은 선 (낮을수록 가는 선도 끊기지 않는다)
RIM_RED = 205  # 하얀 선 둘레에서 빨강이 이보다 밝으면 분홍 테두리
CORE = 2  # 하얀 선에서 이만큼 떨어진 곳을 조각의 속으로 본다 (선이 거의 닫힌 좁은 목에서 조각을 나눈다)
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


def blobs(mask, wrap=False):
    """위·아래·왼쪽·오른쪽으로 이어진 덩어리마다 칸 목록을 돌려준다 (wrap이면 끝과 처음도 이어진 것으로 본다)"""
    h, w = mask.shape
    seen = np.zeros_like(mask)
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]:
            continue
        stack, blob = [(y, x)], []
        seen[y, x] = True
        while stack:
            cy, cx = stack.pop()
            blob.append((cy, cx))
            for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                if wrap:
                    ny, nx = ny % h, nx % w
                elif not (0 <= ny < h and 0 <= nx < w):
                    continue
                if mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        yield blob


def drop_specks(mask, smallest):
    """이어진 칸 수가 smallest보다 적은 덩어리를 지운다"""
    out = mask.copy()
    for blob in blobs(mask):
        if len(blob) < smallest:
            out[tuple(zip(*blob))] = False
    return out


def steps4(y, x, h, w):
    """위·아래·왼쪽·오른쪽 이웃 (끝과 처음이 이어진 그림)"""
    return (((y - 1) % h, x), ((y + 1) % h, x), (y, (x - 1) % w), (y, (x + 1) % w))


def distance_from(mask):
    """칸마다 가장 가까운 켜진 칸까지의 거리 (위·아래·왼쪽·오른쪽 걸음 수)"""
    h, w = mask.shape
    dist = np.where(mask, 0, -1)
    queue = deque(zip(*np.nonzero(mask)))
    while queue:
        y, x = queue.popleft()
        for ny, nx in steps4(y, x, h, w):
            if dist[ny, nx] < 0:
                dist[ny, nx] = dist[y, x] + 1
                queue.append((ny, nx))
    return dist


def water_cells(water, net):
    """물을 조각으로 나눈다. 하얀 선이 열려 있어도 좁은 목에서 끊기게,
    선에서 CORE칸 넘게 떨어진 속끼리 먼저 묶고 나머지 칸은 가까운 속에 붙인다"""
    h, w = water.shape
    label = np.full(water.shape, -1)
    queue = deque()
    for i, blob in enumerate(blobs(water & (distance_from(net) > CORE), wrap=True)):
        for y, x in blob:
            label[y, x] = i
            queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for ny, nx in steps4(y, x, h, w):
            if water[ny, nx] and label[ny, nx] < 0:
                label[ny, nx] = label[y, x]
                queue.append((ny, nx))
    rest = water & (label < 0)  # 속이 없을 만큼 작은 조각은 그 자체로 한 조각
    for blob in blobs(rest, wrap=True):
        i = label.max() + 1
        label[tuple(zip(*blob))] = i
    return [list(zip(*np.nonzero(label == i))) for i in range(label.max() + 1)]


def cell_centers(water, net):
    """물 조각마다 가운데 가로 위치를 그 조각의 모든 칸에 적는다 (끝과 처음에 걸친 조각도 한 조각으로)"""
    h, w = water.shape
    out = np.zeros(water.shape, np.uint8)
    for cell in water_cells(water, net):
        ys, xs = map(np.array, zip(*cell))
        angle = np.angle(np.exp(2j * np.pi * xs / w).mean())  # 둥글게 이어진 가로 위치의 평균
        out[ys, xs] = round((angle / (2 * np.pi) * w) % w) % w
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
    cost = (net_e != net_s).astype(float)
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

# 끝과 처음이 이어지게 잘라 붙인 뒤, 이음새를 다듬고 테두리를 두른다
tile = np.stack([net, rim_glow], axis=2).astype(np.uint8)
tile = seam_wrap(seam_wrap(tile, OVERLAP[0], 1), OVERLAP[1], 0)
net = smooth(tile[..., 0] > 0)
rim = tidy(below_right(net) & ~net & (tile[..., 1] > 0), keep=1)

layers = np.stack(
    [
        np.where(net, 255, np.where(rim, 128, 0)).astype(np.uint8),
        cell_centers(~net, net),
        np.zeros(net.shape, np.uint8),
    ],
    axis=2,
)
Image.fromarray(layers, "RGB").save(out, optimize=True)
h, w = net.shape
print(f"{out}: {w}x{h}, 빛 그물 {net.mean():.0%} · 테두리 {rim.mean():.0%}")
