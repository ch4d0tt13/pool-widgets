// 픽셀 수영장 장면: 창 본문 크기의 저해상도 캔버스에 직접 그린 물 그림(빛 그물과 그 그늘)을 따로 일렁이게 그리고,
// 장면(scenes.js)대로 색·소품(레인·하늘·데크·공기방울·고양이)을 얹는다. 시간대마다 색 토큰이 바뀐다(tokens.css)
import { SCENES } from "./scenes.js";
import { spriteColors } from "./sprite.js";
import { CAT, CLOUD } from "./icons.js";
import { currentPhase } from "./daylight.js";
import { LAYER, cellCenter, loadWaterArt, layerAt } from "./water-art.js";

const FPS = 12;
const SPLASH_RINGS = 5; // 물장구 한 번에 생기는 파문 수
// 빛 그물과 그 그늘이 다르게 일렁인다: 물결의 촘촘함(가로 줄·세로 줄)과 빠르기. 물 색은 가만히 있다
// 촘촘하면 줄마다 따로 밀려 선이 찢겨 보이니, 넓은 띠로 묶여 한 칸씩 밀리게 성기게 둔다
const SWAY = {
  net: { density: [0.06, 0.05], speed: [1.1, 0.9] },
  shadow: { density: [0.04, 0.035], speed: [0.6, 0.45] },
};
const SHADOW_OFFSET = [4, 5]; // 그늘은 빛 그물과 같은 무늬를 이만큼 비켜 바닥에 드리운다 (빛은 왼쪽 위에서)
const SPARKLE_AREA = 300; // 이 넓이(칸)마다 반짝임 하나 (장면의 sparkle로 곱한다)
const LANE_GAP = 20; // 레인 줄 간격
const TOP_RATIO = { sky: 0.5, deck: 0.35 }; // 위쪽 띠가 차지하는 비율
const DECK_TILE = 8;
const PHASE_CHECK_MS = 60 * 1000; // 시간대는 1분마다 다시 본다

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export function startPool(canvas, sceneName = "shallow") {
  const ctx = canvas.getContext("2d");
  const styles = getComputedStyle(canvas);
  const color = (name) => hexToRgb(styles.getPropertyValue(name).trim());
  const px = parseInt(styles.getPropertyValue("--px"), 10);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let scene;
  let C; // 소품 색
  let spriteRgb; // 픽셀 그림 색
  let palette; // 물 그림 색 { tones: [[바탕, 그늘], ...], rim, light }
  let sky;
  let particles = []; // 공기방울 또는 파문
  let catProgress = 0; // 레인 고양이 위치 (0~1)
  let w = 0;
  let h = 0;
  let top = 0; // 위쪽 띠 높이
  let image = null;
  let phase = null; // 지금 시간대 (daylight.js)
  let art = null; // 물 그림 (읽기 전에는 파랑 단색)
  let artX = 0; // 물 그림의 어느 가로 위치부터 보여 줄지 (장면의 at)

  function layout() {
    // 창이 막 열릴 때는 크기가 0일 수 있다
    w = Math.max(1, Math.ceil(canvas.clientWidth / px));
    h = Math.max(1, Math.ceil(canvas.clientHeight / px));
    top = scene.top ? Math.round(h * TOP_RATIO[scene.top]) : 0;
    canvas.width = w;
    canvas.height = h;
    image = ctx.createImageData(w, h);
    particles = [];
    placeArt();
  }

  function placeArt() {
    artX = art ? Math.round((scene.at ?? 0) * Math.max(0, art.w - w)) : 0;
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

    const { tones } = palette;
    if (!art) return tones[1][0];
    x += artX;
    const ay = wy * (scene.squash ?? 1); // 하늘 장면은 위아래로 눌러 멀리 보이는 물결처럼
    // 빛 그물(하얀 선·분홍 테두리)이 맨 위
    const net = swayed(SWAY.net, x, ay, t);
    if (net === 255) return palette.light;
    if (net === 128) return palette.rim;
    // 그 아래 물 조각: 조각이 창 왼쪽에 있을수록 어두운 하늘, 오른쪽일수록 밝은 하늘. 조각 하나는 한 색이다
    const center = cellCenter(art, x, ay) - artX;
    const tone = tones[Math.min(tones.length - 1, Math.max(0, Math.floor((center / w) * tones.length)))];
    // 바닥의 그늘: 빛 그물과 같은 무늬를 비켜서 따로 일렁인다
    const shadow = swayed(SWAY.shadow, x + SHADOW_OFFSET[0], ay + SHADOW_OFFSET[1], t) === 255;
    return tone[shadow ? 1 : 0];
  }

  // 빛 그물을 줄마다 한 칸씩 출렁이며 읽는다
  function swayed({ density: [dx, dy], speed: [sx, sy] }, x, y, t) {
    return layerAt(art, LAYER.net, x + Math.round(Math.sin(y * dx + t * sx)), y + Math.round(Math.sin(x * dy + t * sy)));
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
      if (p.age < 0) {
        p.age += 1;
        continue;
      }
      if (p.age === 0) setPixel(p.x, p.y, C.foam);
      else {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / (p.age * 3)) {
          setPixel(p.x + Math.round(Math.cos(a) * p.age * 1.4), p.y + Math.round(Math.sin(a) * p.age * 0.7), C.foam);
        }
      }
      p.age += 1;
    }
  }

  // 반짝임: 물 위 여기저기서 픽셀 별이 반짝였다 사라지고, 다음엔 다른 자리에서 반짝인다
  function drawSparkles(t) {
    const count = Math.round(((w * (h - top)) / SPARKLE_AREA) * (scene.sparkle ?? 1));
    for (let k = 0; k < count; k++) {
      const cycle = t * 0.8 + k * 0.37;
      const glow = Math.sin((cycle % 1) * Math.PI); // 0 → 1 → 0
      if (glow < 0.5) continue;
      const seed = Math.imul(k + 1, 73856093) ^ Math.imul(Math.floor(cycle) + 1, 19349663);
      const x = (seed >>> 0) % w;
      const y = top + ((seed >>> 8) % Math.max(1, h - top));
      setPixel(x, y, C.star);
      if (glow > 0.9) [[0, -1], [-1, 0], [1, 0], [0, 1]].forEach(([ax, ay]) => setPixel(x + ax, y + ay, C.foam));
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
    if (!still && art) drawSparkles(t);
    if (scene.clouds) drawClouds(still ? 10 : t);
    if (!still && scene.rain) drawRain(t);
    if (!still && scene.bubbles) drawBubbles();
    if (!still && scene.ripples) drawRipples();
    if (scene.cat) drawCat(still ? w / 3 : t);
    if (phase?.night && scene.top === "sky") drawStars(t);
    ctx.putImageData(image, 0, 0);
  }

  // 밤하늘의 별: 자리는 고정, 번갈아 깜빡인다
  function drawStars(t) {
    const count = Math.ceil(w / 8);
    for (let k = 0; k < count; k++) {
      if (!still && Math.sin(t * 1.5 + k * 2.1) < -0.3) continue;
      setPixel((k * 29 + 3) % w, 1 + ((k * 13) % Math.max(1, top - 4)), C.star);
    }
  }

  // 시간대(새벽·노을·밤)는 문서의 data-phase로 물 장면과 물 위 숫자의 토큰 색을 통째로 바꾼다 (tokens.css)
  function updatePhase() {
    phase = currentPhase();
    const root = document.documentElement;
    if (phase) root.dataset.phase = phase.name;
    else delete root.dataset.phase;
    if (!scene) return;
    readColors();
    draw(now());
  }

  function readColors() {
    C = {
      tile: color("--water-tile"),
      foam: color("--water-foam"),
      lane1: color("--lane-1"),
      lane2: color("--lane-2"),
      deck: color("--deck-1"),
      grout: color("--deck-2"),
      coping: color("--coping"),
      bubble: color("--bubble"),
      rain: color("--ink-soft"),
      star: color("--star"),
    };
    spriteRgb = Object.fromEntries(Object.entries(spriteColors(canvas)).map(([ch, hex]) => [ch, hexToRgb(hex)]));
    const { tones, rim, light } = scene.water;
    palette = { tones: tones.map((pair) => pair.map(color)), rim: color(rim), light: color(light) };
    sky = (scene.sky ?? []).map(color);
  }

  const now = () => performance.now() / 1000;

  function setScene(name) {
    scene = SCENES[name];
    readColors();
    layout();
    draw(now());
  }

  function setCatProgress(value) {
    catProgress = Math.min(1, Math.max(0, value));
  }

  // 물장구: 창 아래쪽 가운데에 파문을 한꺼번에 일으킨다 (파문이 있는 장면에서만)
  function splash() {
    if (!scene.ripples) return;
    for (let k = 0; k < SPLASH_RINGS; k++) {
      particles.push({
        x: Math.round(w / 2 + (Math.random() - 0.5) * w * 0.4),
        y: Math.round(top + (h - top) * (0.6 + Math.random() * 0.3)),
        age: -k, // 차례로 퍼지게 조금씩 늦춘다
      });
    }
  }

  let last = 0;
  function loop(ms) {
    if (ms - last >= 1000 / FPS) {
      draw(ms / 1000);
      last = ms;
    }
    requestAnimationFrame(loop);
  }

  updatePhase();
  setInterval(updatePhase, PHASE_CHECK_MS);
  setScene(sceneName);
  loadWaterArt().then((loaded) => {
    art = loaded;
    placeArt();
    draw(now());
  });
  new ResizeObserver(() => {
    layout();
    draw(now());
  }).observe(canvas);
  if (!still) requestAnimationFrame(loop);

  return { setScene, setCatProgress, splash };
}
