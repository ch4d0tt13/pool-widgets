// 물 장면: 바탕은 모두 직접 그린 물 그림(water-art.js)이고, 위젯마다 색과 소품을 다르게 준다
// water: 물 그림을 칠할 토큰. tones는 창 왼쪽 → 오른쪽 조각 색 [바탕, 그늘], rim은 빛 그물 테두리, light는 하얀 선
//   (시간대마다 tokens.css에서 같은 토큰이 다른 색이 된다)
// at: 물 그림의 어느 부분을 보여 줄지 (0 왼쪽 끝 → 1 오른쪽 끝) / sparkle: 반짝임 양 (기본 1) / top: 위쪽 띠 ("sky" 하늘 · "deck" 데크)
// squash: 물 그림을 위아래로 누르는 배율 (하늘 아래 물은 멀리서 본 물결처럼 납작하게)
// cat: "drift" 떠다님 · "lane" 레인 따라 헤엄 / ripples: 프레임마다 파문이 생길 확률
const ART = {
  tones: [["--art-1", "--art-1-shade"], ["--art-2", "--art-2-shade"], ["--art-3", "--art-3-shade"]],
  rim: "--art-rim",
  light: "--art-light",
};
const DEEP = { tones: [["--deep-3", "--deep-4"], ["--deep-2", "--deep-3"], ["--deep-1", "--deep-2"]], rim: "--deep-rim", light: "--deep-light" };
const CLOUDY = {
  tones: [["--cloudy-3", "--cloudy-4"], ["--cloudy-2", "--cloudy-3"], ["--cloudy-1", "--cloudy-2"]],
  rim: "--cloudy-rim",
  light: "--cloudy-light",
};
const SKY = ["--sky-1", "--sky-2", "--sky-3"];
const SKY_GRAY = ["--sky-gray-1", "--sky-gray-2", "--sky-gray-3"];

export const SCENES = {
  shallow: { at: 0, water: ART, cat: "drift" },
  calm: { at: 0.35, water: ART, ripples: 0.12 },
  deep: { at: 0.5, water: DEEP, sparkle: 0.5, bubbles: true },
  mosaic: { at: 0.8, water: ART, sparkle: 0.6 },
  play: { at: 0.6, water: ART, ripples: 0.05 },
  inlet: { at: 0.25, water: ART, ripples: 0.03 },
  shimmer: { at: 0.95, water: ART, sparkle: 2.5 },
  pebble: { at: 0.45, water: ART, bubbles: true },
  lane: { at: 0.15, water: ART, lanes: true, cat: "lane" },
  rest: { at: 0.7, water: ART, lanes: true, cat: "lane" },
  deck: { at: 0.55, top: "deck", water: ART, cat: "drift" },
  sunny: { at: 0.9, squash: 2, top: "sky", sky: SKY, water: ART, sparkle: 2, clouds: true },
  cloudy: { at: 0.9, squash: 2, top: "sky", sky: SKY_GRAY, water: CLOUDY, sparkle: 0.3, clouds: true },
  rainy: { at: 0.9, squash: 2, top: "sky", sky: SKY_GRAY, water: CLOUDY, sparkle: 0, clouds: true, rain: true, ripples: 0.6 },
};
