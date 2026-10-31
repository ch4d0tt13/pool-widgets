// 직접 그린 물 그림의 빛 그물을 도트로 다시 그린 그림(shared/img/water.png, 150×46)을 읽는다
// 원본 그림은 저장소에 없고, tools/pixelate.py 로 만든 결과만 있다. 색은 없고 채널마다 정보 하나다
export const LAYER = { net: 0, cell: 1 }; // R 빛 그물 (0 물 · 128 분홍 테두리 · 255 하얀 선) · G 물 조각의 가운데 가로 위치
const ART_URL = new URL(`../img/water.png${new URL(import.meta.url).search}`, import.meta.url);

export function loadWaterArt() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve({ w: img.width, h: img.height, data: ctx.getImageData(0, 0, img.width, img.height).data });
    };
    img.onerror = () => resolve(null); // 못 읽으면 단색 물로 그린다
    img.src = ART_URL;
  });
}

// 그림은 끝과 처음이 이어지게 만들어 두었다 (pixelate.py). 창이 그림보다 크면 뒤집지 않고 그대로 이어 붙인다
const wrap = (v, n) => ((v % n) + n) % n;

export function layerAt(art, layer, x, y) {
  return art.data[(wrap(y, art.h) * art.w + wrap(x, art.w)) * 4 + layer];
}

// (x, y) 칸이 속한 물 조각의 가운데 가로 위치. 이어 붙인 그림에서 x와 가장 가까운 쪽으로 돌려준다
export function cellCenter(art, x, y) {
  let d = layerAt(art, LAYER.cell, x, y) - wrap(x, art.w);
  if (d > art.w / 2) d -= art.w;
  else if (d < -art.w / 2) d += art.w;
  return x + d;
}
