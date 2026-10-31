// 물 장면: 창 틀은 같아도 창 안 분위기는 위젯마다 다르게
// depth: 위→아래 물 색 토큰 / caustic: 빛 무늬 문턱값(낮을수록 많이 반짝임)
// top: 위쪽 띠 ("sky" 하늘 · "deck" 데크) / cat: "drift" 떠다님 · "lane" 레인 따라 헤엄
// ripples: 프레임마다 파문이 생길 확률 / tile: 바닥 타일 크기(기본 12)
const WATER = ["--water-1", "--water-2", "--water-3", "--water-4"];
const WATER_DEEPER = ["--water-2", "--water-3", "--water-4", "--water-5"];
const DEEP = ["--deep-1", "--deep-2", "--deep-3", "--deep-4"];
const CLOUDY = ["--cloudy-1", "--cloudy-2", "--cloudy-3", "--cloudy-4"];
const SKY = ["--sky-1", "--sky-2", "--sky-3"];
const SKY_GRAY = ["--sky-gray-1", "--sky-gray-2", "--sky-gray-3"];

export const SCENES = {
  shallow: { depth: WATER, caustic: 2.3, tiles: true, foam: true, cat: "drift" },
  calm: { depth: WATER, caustic: 2.6, foam: true, ripples: 0.12 },
  deep: { depth: DEEP, caustic: 2.7, bubbles: true },
  mosaic: { depth: WATER, caustic: 2.1, tiles: true, tile: 6 },
  play: { depth: WATER_DEEPER, caustic: 2.4, tiles: true, foam: true, ripples: 0.05 },
  inlet: { depth: WATER, caustic: 2.8, tiles: true, tile: 16, foam: true, ripples: 0.03 },
  lane: { depth: WATER_DEEPER, caustic: 2.5, tiles: true, lanes: true, cat: "lane" },
  rest: { depth: WATER, caustic: 2.2, tiles: true, lanes: true, cat: "lane" },
  deck: { top: "deck", depth: WATER, caustic: 2.3, tiles: true, foam: true, cat: "drift" },
  sunny: { top: "sky", sky: SKY, depth: WATER, caustic: 1.9, tiles: true, foam: true, clouds: true },
  cloudy: { top: "sky", sky: SKY_GRAY, depth: CLOUDY, caustic: 2.9, tiles: true, foam: true, clouds: true },
  rainy: { top: "sky", sky: SKY_GRAY, depth: CLOUDY, caustic: 3.5, tiles: true, clouds: true, rain: true, ripples: 0.6 },
};
