import { watchPhase } from "../shared/js/daylight.js";

// 집중 튜브: 물놀이 튜브가 맨 위부터 시계 방향으로 동그랗게 채워진다. 아직 안 지난 쪽은 옅게, 가운데 구멍엔 물
const STRIPES = 12; // 튜브 줄무늬 칸 수
const THICK = 0.42; // 튜브 두께 (바깥 반지름에 대한 비): 통통하게
const SHINE = [0.8, 0.94]; // 왼쪽 위 반짝임이 걸치는 자리 (맨 위에서 시계 방향 비율)
const FLASH_MS = 250; // 끝 반짝임: 하얀 튜브와 꽉 찬 튜브를 이 간격으로 번갈아
const FLASH_STEPS = 12; // 3초 (알림 소리 길이쯤)

export function createRing(canvas) {
  const styles = getComputedStyle(canvas);
  const px = parseInt(styles.getPropertyValue("--px"), 10);
  const token = (name) => styles.getPropertyValue(name).trim();
  const ctx = canvas.getContext("2d");
  let progress = 0;
  let mode = "focus";
  let flashing = null; // 반짝이는 동안: { mode: 끝난 단계, white: 이번에 하얗게 칠할지 }
  let flashTimer = null;

  function draw() {
    // 튜브 칸 수는 자리 크기에 맞추고, 화면에는 도트 칸의 정수배로 띄운다.
    // 큰 튜브는 가운데 묶음과 같은 배율(--tube-zoom)로 한 칸을 키워서 선 굵기가 서로 맞는다
    const box = canvas.parentElement;
    const cell = px * (parseInt(styles.getPropertyValue("--tube-zoom"), 10) || 1);
    // 칸 수는 짝수로: 홀수면 원의 위·아래·양옆 끝에 한 칸씩 튀어나온다
    const n = Math.max(8, Math.floor(Math.min(box.clientWidth, box.clientHeight) / cell / 2) * 2);
    canvas.width = canvas.height = n;
    canvas.style.width = canvas.style.height = `${n * cell}px`;

    const color = {
      line: token("--line"),
      stripe: token(`--tube-${flashing?.mode ?? mode}`),
      white: token("--white"),
      empty: token("--tube-empty"),
      emptyStripe: token("--tube-empty-stripe"),
      hole: token("--tube-hole"),
      shine: token("--white"),
    };
    const half = n / 2;
    const outer = half - 0.5;
    const inner = outer * (1 - THICK);
    const hole = inner - 1; // 구멍 속 물의 반지름 (바로 바깥 한 칸이 안쪽 테두리)
    const mid = (inner + outer) / 2; // 튜브 몸통 가운데 줄
    // 칸 가운데가 반지름 r 원 안에 있는지
    const inside = (r, x, y) => Math.hypot(x + 0.5 - half, y + 0.5 - half) <= r;
    // 원 안이면서 상하좌우 한 칸이 원 밖인 칸: 선이 대각선에서도 두 칸으로 겹치지 않고 늘 한 칸 두께다
    const rim = (r, x, y) => inside(r, x, y) && !(inside(r, x - 1, y) && inside(r, x + 1, y) && inside(r, x, y - 1) && inside(r, x, y + 1));
    // 원 밖이면서 상하좌우 한 칸이 원 안인 칸 (구멍을 두르는 한 칸 두께 선)
    const around = (r, x, y) => !inside(r, x, y) && (inside(r, x - 1, y) || inside(r, x + 1, y) || inside(r, x, y - 1) || inside(r, x, y + 1));
    ctx.clearRect(0, 0, n, n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (!inside(outer, x, y)) continue;
        const dx = x + 0.5 - half;
        const dy = y + 0.5 - half;
        let fill;
        if (inside(hole, x, y)) {
          // 구멍 속 물: 왼쪽 위 가장자리에 반짝이는 한 칸 줄
          fill = rim(hole, x, y) && dx < 0 && dy < 0 ? color.shine : color.hole;
        } else if (rim(outer, x, y) || around(hole, x, y)) {
          fill = color.line; // 튜브 안팎 테두리
        } else {
          const turn = (Math.atan2(dx, -dy) / (2 * Math.PI) + 1) % 1; // 맨 위에서 시계 방향 0 → 1
          const white = Math.floor(turn * STRIPES) % 2 === 1;
          const done = flashing ? true : turn < progress; // 반짝이는 동안은 꽉 찬 튜브
          // 튜브 몸통 가운데 줄, 왼쪽 위에 하얀 반짝임 (통통해 보이게)
          if (rim(mid, x, y) && turn > SHINE[0] && turn < SHINE[1]) fill = color.shine;
          else if (flashing?.white) fill = color.white;
          else fill = done ? (white ? color.white : color.stripe) : white ? color.empty : color.emptyStripe;
        }
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  new ResizeObserver(draw).observe(canvas.parentElement);
  watchPhase(draw); // 시간대가 바뀌면 튜브 색도 다시

  return {
    setProgress(value) {
      const next = Math.min(1, Math.max(0, value));
      // 튜브는 1초에 한 번쯤 다시 그리면 충분하다 (칸이 바뀔 만큼 움직였을 때만)
      if (Math.abs(next - progress) * canvas.width * Math.PI < 0.5 && next !== 0) return;
      progress = next;
      draw();
    },
    setMode(next) {
      mode = next;
      draw();
    },
    // 끝 알림: 끝난 단계의 꽉 찬 튜브와 하얀 튜브를 번갈아 칠한 뒤 지금 모습으로 돌아온다
    flash() {
      const finished = mode;
      let step = 0;
      clearInterval(flashTimer);
      flashTimer = setInterval(() => {
        step++;
        flashing = step < FLASH_STEPS ? { mode: finished, white: step % 2 === 1 } : null;
        if (!flashing) clearInterval(flashTimer);
        draw();
      }, FLASH_MS);
      flashing = { mode: finished, white: false };
      draw();
    },
  };
}
