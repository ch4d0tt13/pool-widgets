// 픽셀 수영장 장면: 창 본문 크기의 저해상도 캔버스에 장면(scenes.js)대로 그린다
import { SCENES } from "./scenes.js";
import { spriteColors } from "./sprite.js";
import { CAT, CLOUD } from "./icons.js";

const FPS = 12;
const TILE = 12; // 바닥 타일 한 칸 (논리 픽셀)
const WAVE_GAP = 16; // 물결 줄 간격
const LANE_GAP = 20; // 레인 줄 간격
const TOP_RATIO = { sky: 0.5, deck: 0.35 }; // 위쪽 띠가 차지하는 비율
const DECK_TILE = 8;

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export function startPool(canvas, sceneName = "shallow") {
  const ctx = canvas.getContext("2d");
  const styles = getComputedStyle(canvas);
  const color = (name) => hexToRgb(styles.getPropertyValue(name).trim());
  const px = parseInt(styles.getPropertyValue("--px"), 10);
  const C = {
    tile: color("--water-tile"),
    caustic: color("--water-caustic"),
    foam: color("--water-foam"),
    lane1: color("--lane-1"),
    lane2: color("--lane-2"),
    deck: color("--deck-1"),
    grout: color("--deck-2"),
    coping: color("--coping"),
    bubble: color("--bubble"),
    rain: color("--ink-soft"),
  };
  const spriteRgb = Object.fromEntries(Object.entries(spriteColors(canvas)).map(([ch, hex]) => [ch, hexToRgb(hex)]));
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let scene;
  let depth;
  let sky;
  let particles = []; // 공기방울 또는 파문
  let catProgress = 0; // 레인 고양이 위치 (0~1)
  let w = 0;
  let h = 0;
  let top = 0; // 위쪽 띠 높이
  let image = null;

  function layout() {
    // 창이 막 열릴 때는 크기가 0일 수 있다
    w = Math.max(1, Math.ceil(canvas.clientWidth / px));
    h = Math.max(1, Math.ceil(canvas.clientHeight / px));
    top = scene.top ? Math.round(h * TOP_RATIO[scene.top]) : 0;
    canvas.width = w;
    canvas.height = h;
    image = ctx.createImageData(w, h);
    particles = [];
  }

  function bandColor(x, y) {
    if (y >= top - 2) return y === top - 1 ? C.tile : C.coping; // 수영장 가장자리 돌과 그림자
    if (scene.top === "deck") return x % DECK_TILE === 0 || y % DECK_TILE === 0 ? C.grout : C.deck;
    return sky[Math.min(sky.length - 1, Math.floor((y / (top - 2)) * sky.length))];
  }

  function colorAt(x, y, t) {
    if (y < top) return bandColor(x, y);
    const wy = y - top;

    // 레인 부표 줄 (두 칸 두께, 빨강·하양 번갈아)
    if (scene.lanes) {
      const sway = Math.round(Math.sin(x * 0.15 + t) * 1);
      const row = (wy + sway) % LANE_GAP;
      if (row === LANE_GAP / 2 || row === LANE_GAP / 2 + 1) {
        return Math.floor(x / 3) % 4 < 2 ? C.lane1 : C.lane2;
      }
    }

    // 물결: 줄마다 좌우로 출렁이는 흰 픽셀 선
    if (scene.foam) {
      const sway = Math.round(Math.sin(x * 0.28 + t * 1.6 + Math.floor(wy / WAVE_GAP)) * 1.5);
      if ((wy + sway) % WAVE_GAP === 0 && Math.sin(x * 0.11 - t * 0.9 + wy) > -0.2) return C.foam;
    }

    // 수면 빛 무늬
    const light = Math.sin(x * 0.35 + t) + Math.sin(wy * 0.45 - t * 0.8) + Math.sin((x + wy) * 0.2 + t * 0.6);
    if (light > scene.caustic) return C.caustic;

    // 바닥 타일 줄 (물에 굴절되어 살짝 흔들림)
    if (scene.tiles) {
      const bend = Math.round(Math.sin(wy * 0.3 + t) * 1);
      if ((x + bend) % TILE === 0 || (wy + bend) % TILE === 0) return C.tile;
    }

    // 깊이에 따라 단계별 물 색
    return depth[Math.min(depth.length - 1, Math.floor((wy / (h - top)) * depth.length))];
  }

  function setPixel(x, y, [r, g, b]) {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4;
    image.data[i] = r;
    image.data[i + 1] = g;
    image.data[i + 2] = b;
  }

  function stamp(rows, x0, y0, clipBottom = h) {
    rows.forEach((row, y) => {
      if (y0 + y >= clipBottom) return;
      [...row].forEach((ch, x) => {
        if (spriteRgb[ch]) setPixel(x0 + x, y0 + y, spriteRgb[ch]);
      });
    });
  }

  // 하늘의 구름: 서로 다른 높이·속도로 천천히 흘러간다
  function drawClouds(t) {
    const cw = CLOUD[0].length;
    for (let k = 0; k < 3; k++) {
      const x = Math.floor((t * (1.5 + k) + k * 37) % (w + cw)) - cw;
      const y = 2 + Math.floor(((top - 6) * k) / 3);
      stamp(CLOUD, x, y, top - 2);
    }
  }

  // 빗줄기: 하늘에서 비스듬히 떨어지는 점
  function drawRain(t) {
    const count = Math.ceil(w / 6);
    for (let k = 0; k < count; k++) {
      const y = Math.floor((k * 53 + t * 40) % Math.max(1, top - 2));
      const x = Math.floor((k * 37 + y * 0.3) % w);
      setPixel(x, y, C.rain);
      setPixel(x, y + 1, C.rain);
    }
  }

  // 공기방울: 아래에서 위로 올라가고, 위에 닿으면 다시 아래에서 나온다
  function drawBubbles() {
    if (!particles.length) {
      particles = Array.from({ length: Math.ceil((w * h) / 500) }, () => ({
        x: Math.floor(Math.random() * w),
        y: Math.random() * h,
        big: Math.random() < 0.3,
        speed: 0.3 + Math.random() * 0.5,
      }));
    }
    for (const b of particles) {
      b.y -= b.speed;
      if (b.y < -2) Object.assign(b, { y: h + 2, x: Math.floor(Math.random() * w) });
      const y = Math.round(b.y);
      if (!b.big) setPixel(b.x, y, C.bubble);
      else [[0, -1], [-1, 0], [1, 0], [0, 1]].forEach(([dx, dy]) => setPixel(b.x + dx, y + dy, C.bubble));
    }
  }

  // 파문: 떨어진 자리에서 고리가 커지다 사라진다
  function drawRipples() {
    if (Math.random() < scene.ripples) {
      particles.push({ x: Math.floor(Math.random() * w), y: top + Math.floor(Math.random() * (h - top)), age: 0 });
    }
    particles = particles.filter((p) => p.age <= 4);
    for (const p of particles) {
      if (p.age === 0) setPixel(p.x, p.y, C.foam);
      else {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / (p.age * 3)) {
          setPixel(p.x + Math.round(Math.cos(a) * p.age * 1.4), p.y + Math.round(Math.sin(a) * p.age * 0.7), C.foam);
        }
      }
      p.age += 1;
    }
  }

  // 튜브 고양이: 떠다니거나(drift) 맨 아래 레인을 진행만큼 헤엄쳐 간다(lane)
  function drawCat(t) {
    const cw = CAT[0].length;
    const bob = Math.round(Math.sin(t * 2));
    if (scene.cat === "lane") {
      const laneCenter = top + Math.max(LANE_GAP, Math.floor((h - top - 6) / LANE_GAP) * LANE_GAP);
      stamp(CAT, Math.round(catProgress * (w - cw)), laneCenter - 7 + bob);
      return;
    }
    const x0 = Math.floor((t * 3) % (w + cw)) - cw;
    stamp(CAT, x0, Math.round(top + (h - top) * 0.75) - CAT.length + bob);
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
    if (scene.clouds) drawClouds(still ? 10 : t);
    if (!still && scene.rain) drawRain(t);
    if (!still && scene.bubbles) drawBubbles();
    if (!still && scene.ripples) drawRipples();
    if (scene.cat) drawCat(still ? w / 3 : t);
    ctx.putImageData(image, 0, 0);
  }

  const now = () => performance.now() / 1000;

  function setScene(name) {
    scene = SCENES[name];
    depth = scene.depth.map(color);
    sky = (scene.sky ?? []).map(color);
    layout();
    draw(now());
  }

  function setCatProgress(value) {
    catProgress = Math.min(1, Math.max(0, value));
  }

  let last = 0;
  function loop(ms) {
    if (ms - last >= 1000 / FPS) {
      draw(ms / 1000);
      last = ms;
    }
    requestAnimationFrame(loop);
  }

  setScene(sceneName);
  new ResizeObserver(() => {
    layout();
    draw(now());
  }).observe(canvas);
  if (!still) requestAnimationFrame(loop);

  return { setScene, setCatProgress };
}
