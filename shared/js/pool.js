// 픽셀 수영장 배경: 저해상도 캔버스에 물·타일·빛 무늬·물결을 그린다
const FPS = 12;
const TILE = 12; // 바닥 타일 한 칸 (논리 픽셀)
const WAVE_GAP = 16; // 물결 줄 간격 (논리 픽셀)

function readColor(styles, name) {
  const hex = styles.getPropertyValue(name).trim().replace("#", "");
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

export function startPool(canvas) {
  const ctx = canvas.getContext("2d");
  const styles = getComputedStyle(document.documentElement);
  const px = parseInt(styles.getPropertyValue("--px"), 10);
  const depth = ["--water-1", "--water-2", "--water-3", "--water-4"].map((n) => readColor(styles, n));
  const tile = readColor(styles, "--water-tile");
  const caustic = readColor(styles, "--water-caustic");
  const foam = readColor(styles, "--water-foam");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0;
  let h = 0;
  let image = null;

  function resize() {
    // 임베드가 막 열릴 때는 크기가 0일 수 있다
    w = Math.max(1, Math.ceil(innerWidth / px));
    h = Math.max(1, Math.ceil(innerHeight / px));
    canvas.width = w;
    canvas.height = h;
    image = ctx.createImageData(w, h);
  }

  function colorAt(x, y, t) {
    // 물결: 줄마다 좌우로 출렁이는 흰 픽셀 선
    const sway = Math.round(Math.sin(x * 0.28 + t * 1.6 + Math.floor(y / WAVE_GAP)) * 1.5);
    if ((y + sway) % WAVE_GAP === 0 && Math.sin(x * 0.11 - t * 0.9 + y) > -0.2) return foam;

    // 수면 빛 무늬
    const light = Math.sin(x * 0.35 + t) + Math.sin(y * 0.45 - t * 0.8) + Math.sin((x + y) * 0.2 + t * 0.6);
    if (light > 2.3) return caustic;

    // 바닥 타일 줄 (물에 굴절되어 살짝 흔들림)
    const bend = Math.round(Math.sin(y * 0.3 + t) * 1);
    if ((x + bend) % TILE === 0 || (y + bend) % TILE === 0) return tile;

    // 깊이에 따라 4단계 물 색
    return depth[Math.min(depth.length - 1, Math.floor((y / h) * depth.length))];
  }

  function draw(t) {
    const data = image.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const [r, g, b] = colorAt(x, y, t);
        const i = (y * w + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }

  let last = 0;
  function loop(now) {
    if (now - last >= 1000 / FPS) {
      draw(now / 1000);
      last = now;
    }
    requestAnimationFrame(loop);
  }

  resize();
  addEventListener("resize", () => {
    resize();
    draw(performance.now() / 1000);
  });

  if (still) draw(0);
  else requestAnimationFrame(loop);
}
