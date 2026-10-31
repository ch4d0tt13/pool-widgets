// 물 배경 장면: 위젯마다 같은 틀에 다른 분위기를 준다
// depth: 위→아래 물 색 토큰 / caustic: 빛 무늬 문턱값(낮을수록 많이 반짝임)
const WATER = ["--water-1", "--water-2", "--water-3", "--water-4"];
const WATER_DEEPER = ["--water-2", "--water-3", "--water-4", "--water-5"];
const DEEP = ["--deep-1", "--deep-2", "--deep-3", "--deep-4"];
const CLOUDY = ["--cloudy-1", "--cloudy-2", "--cloudy-3", "--cloudy-4"];

export const SCENES = {
  shallow: { depth: WATER, caustic: 2.3, tiles: true, foam: true, cat: true },
  sunny: { depth: WATER, caustic: 1.8, tiles: true, foam: true },
  cloudy: { depth: CLOUDY, caustic: 2.9, tiles: true, foam: true },
  rainy: { depth: CLOUDY, caustic: 3.5, tiles: true, ripples: true },
  lane: { depth: WATER_DEEPER, caustic: 2.5, tiles: true, lanes: true },
  rest: { depth: WATER, caustic: 2.2, tiles: true, lanes: true },
  deep: { depth: DEEP, caustic: 2.7, bubbles: true },
  deck: { depth: WATER, caustic: 2.3, tiles: true, foam: true, deck: true, cat: true },
};
