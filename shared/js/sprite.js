// 픽셀 그림: 글자 하나가 한 칸, 색은 토큰 이름으로 정한다
const PALETTE = {
  y: "--sun",
  o: "--sun-deep",
  w: "--cloud",
  s: "--cloud-shade",
  b: "--ink-soft",
  n: "--water-4",
  p: "--accent",
  r: "--lane-1",
  i: "--icon-ink",
  k: "--cat",
  g: "--ring",
};

// 글자 → 색 문자열 (없는 글자는 투명)
export function spriteColors(el) {
  const styles = getComputedStyle(el);
  return Object.fromEntries(Object.entries(PALETTE).map(([ch, name]) => [ch, styles.getPropertyValue(name).trim()]));
}

export function drawSprite(canvas, rows) {
  const colors = spriteColors(canvas);
  const ctx = canvas.getContext("2d");
  canvas.width = rows[0].length;
  canvas.height = rows.length;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (!colors[ch]) return;
      ctx.fillStyle = colors[ch];
      ctx.fillRect(x, y, 1, 1);
    });
  });
}
