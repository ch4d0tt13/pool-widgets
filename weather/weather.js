// 날씨: Open-Meteo(키 없음)에서 현재 기온과 오늘 최고·최저를 30분마다 받아온다
import { $ } from "../shared/js/dom.js";
import { drawSprite } from "../shared/js/sprite.js";
import { currentPhase } from "../shared/js/daylight.js";
import { SPRITES } from "./sprites.js";

// 밤에는 해 대신 달
const NIGHT_SPRITE = { sun: "moon", partly: "moon" };

// 공개 코드라 도시 단위 좌표만 쓴다
const PLACE = { name: "울산", lat: 35.54, lon: 129.31 };
const REFRESH_MS = 30 * 60 * 1000;

// WMO 날씨 코드 → [설명, 아이콘, 물 장면]
function describe(code) {
  if (code === 0) return ["맑음", "sun", "sunny"];
  if (code <= 2) return ["구름 조금", "partly", "sunny"];
  if (code === 3) return ["흐림", "cloud", "cloudy"];
  if (code <= 48) return ["안개", "cloud", "cloudy"];
  if (code <= 57) return ["이슬비", "rain", "rainy"];
  if (code <= 67) return ["비", "rain", "rainy"];
  if (code <= 77) return ["눈", "snow", "cloudy"];
  if (code <= 82) return ["소나기", "rain", "rainy"];
  if (code <= 86) return ["눈", "snow", "cloudy"];
  return ["뇌우", "storm", "rainy"];
}

const API_URL = "https://api.open-meteo.com/v1/forecast?" + new URLSearchParams({
  latitude: PLACE.lat,
  longitude: PLACE.lon,
  current: "temperature_2m,weather_code",
  daily: "temperature_2m_max,temperature_2m_min",
  timezone: "Asia/Seoul",
  forecast_days: 1,
});

export function startWeather(pool) {
  const icon = $("[data-icon-weather]");
  const temp = $("[data-temp]");
  const desc = $("[data-desc]");
  const max = $("[data-max]");
  const min = $("[data-min]");

  $("[data-place]").textContent = PLACE.name;

  async function update() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(res.status);
      const { current, daily } = await res.json();
      const [text, sprite, scene] = describe(current.weather_code);
      temp.textContent = `${Math.round(current.temperature_2m)}°`;
      desc.textContent = text;
      max.textContent = Math.round(daily.temperature_2m_max[0]);
      min.textContent = Math.round(daily.temperature_2m_min[0]);
      const night = currentPhase()?.night;
      drawSprite(icon, SPRITES[(night && NIGHT_SPRITE[sprite]) || sprite]);
      pool.setScene(scene);
    } catch {
      // 지난 값은 그대로 두고 상태만 알린다
      desc.textContent = "날씨를 못 불러왔어요";
    }
  }

  update();
  setInterval(update, REFRESH_MS);
}
