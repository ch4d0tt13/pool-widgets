import { watchPhase } from "../shared/js/daylight.js";

// 집중 튜브: 물놀이 튜브가 맨 위부터 시계 방향으로 동그랗게 채워진다. 아직 안 지난 쪽은 옅게, 가운데 구멍엔 물
const STRIPES = 12; // 튜브 줄무늬 칸 수
const THICK = 0.42; // 튜브 두께 (바깥 반지름에 대한 비): 통통하게
const SHINE = [0.8, 0.94]; // 왼쪽 위 반짝임이 걸치는 자리 (맨 위에서 시계 방향 비율)

export function createRing(canvas) {
  const styles = getComputedStyle(canvas);
  const px = parseInt(styles.getPropertyValue("--px"), 10);
  const token = (name) => styles.getPropertyValue(name).trim();
  const ctx = canvas.getContext("2d");
  let progress = 0;
  let mode = "focus";

  function draw() {
    // 튜브 칸 수는 자리 크기에 맞추고, 화면에는 도트 칸의 정수배로 띄운다
    const box = canvas.parentElement;
    const n = Math.max(8, Math.floor(Math.min(box.clientWidth, box.clientHeight) / px));
    canvas.width = canvas.height = n;
    canvas.style.width = canvas.style.height = `${n * px}px`;

    const color = {
      line: token("--line"),
      stripe: token(`--tube-${mode}`),
      white: token("--white"),
      empty: token("--tube-empty"),
      emptyStripe: token("--tube-empty-stripe"),
      hole: token("--tube-hole"),
      shine: token("--white"),
    };
    const half = n / 2;
    const outer = half - 0.5;
    const inner = outer * (1 - THICK);
    ctx.clearRect(0, 0, n, n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const dx = x + 0.5 - half;
        const dy = y + 0.5 - half;
        const d = Math.hypot(dx, dy);
        if (d > outer) continue;
        let fill;
        if (d < inner - 1) {
          // 구멍 속 물: 왼쪽 위에 반짝이는 한 칸 줄
          fill = d > inner - 2 && dx < 0 && dy < 0 ? color.shine : color.hole;
        } else if (d < inner || d > outer - 1) {
          fill = color.line; // 튜브 안팎 테두리
        } else {
          const turn = (Math.atan2(dx, -dy) / (2 * Math.PI) + 1) % 1; // 맨 위에서 시계 방향 0 → 1
          const white = Math.floor(turn * STRIPES) % 2 === 1;
          const done = turn < progress;
          // 튜브 몸통 가운데 줄, 왼쪽 위에 하얀 반짝임 (통통해 보이게)
          const mid = Math.abs(d - (inner + outer) / 2) < 1;
          if (mid && turn > SHINE[0] && turn < SHINE[1]) fill = color.shine;
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
  };
}
