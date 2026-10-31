# pool-widgets

노션 「수영장 대시보드」에 임베드하는 픽셀 수영장 위젯 모음. 공개 저장소이므로 이 파일에도 비밀 값·노션 ID·개인 정보는 적지 않는다.

## 배포 구분
- 사용자가 직접 운영하는 개인 사이트다. 확인이 끝나면 묻지 않고 커밋·푸시·배포한다.
- 위젯: GitHub Pages (`https://ch4d0tt13.github.io/pool-widgets/<위젯>/`). `main`에 푸시하면 1분쯤 뒤 반영되고, 브라우저 캐시 때문에 노션에는 최대 10분 늦게 보인다.
- 중계 서버: Cloudflare Worker `pool-widgets-api`. `worker/`에서 `npx wrangler deploy`.

## 구조
- `shared/` 모든 위젯이 같이 쓰는 것
  - `css/index.css` 진입점 (글꼴 → `tokens.css` → `base.css` → `frames.css`)
  - `css/tokens.css` 색·글꼴·간격·모서리·그림자 토큰. 값은 여기서만 정한다
  - `css/frames.css` 창 틀과 제목 표시줄 무늬 변주
  - `js/widget.js` `startWidget(장면)`: 창 제목 표시줄·물 장면·아이콘을 붙인다
  - `js/pool.js` 픽셀 물 장면 그리기, `js/scenes.js` 장면 목록
  - `js/sprite.js`·`js/icons.js` 픽셀 그림 (글자 하나 = 한 칸, 색은 토큰)
  - `js/api.js` 중계 서버 호출, `js/dom.js` 작은 도우미
- 위젯 폴더: `clock/` `weather/` `pomodoro/` `dday/` `memo/` `briefing/` (각각 `index.html` + 위젯 전용 js·css)
- `worker/` 노션 키를 숨기는 중계 서버 (`GET /dday`, `POST /memo`, `GET /briefing`)

## 디자인 규칙
- 물과 픽셀 테마를 벗어나지 않는다. 글꼴은 Galmuri(숫자는 GalmuriMono11).
- 공유: 창 틀, 틀 안쪽 계단식 둥근 모서리, 제목 표시줄 구조, 스티커(`.caption`).
- 변주: 위젯마다 창 안 물 장면(`scenes.js`)·배치·제목 표시줄 무늬를 다르게 한다. 위젯들을 똑같이 만들지 않는다.
- 창은 임베드 칸을 가장자리까지 채운다. 바깥 여백·투명 배경을 두면 노션 안에서 흰 테두리로 보인다.
- 새 색·크기는 `tokens.css`에 토큰으로 추가한다. 위젯별 포인트 색은 `[data-widget="..."]`에서 다시 정한다.
- `data-title`은 창 제목용으로 예약돼 있다. 위젯 안 요소에는 다른 이름을 쓴다.

## 비밀 값
- 노션 키·위젯 열쇠·노션 데이터 소스 ID는 Worker 비밀 값(`wrangler secret`)과 `worker/.dev.vars`에만 둔다. 둘 다 깃에서 제외돼 있다.
- 열쇠가 든 임베드 주소는 `worker/embed-urls.txt`(깃 제외)에 있다. 노션에는 사용자가 직접 붙여 넣는다.
- 열쇠 값을 읽어 화면에 출력하지 않는다(앱 권한 검사에서도 막힌다). 필요하면 셸 변수로만 쓴다.
- 노션 키는 사용자가 `npx wrangler secret put NOTION_TOKEN`으로 직접 넣는다.

## 노션 연결
- 노션 통합 「솔티 위젯」에 프로젝트 목록·자료함·브리핑 DB 접근 권한이 있어야 한다. 기능은 콘텐츠 읽기·콘텐츠 삽입.
- D-day: 프로젝트 목록의 「마감일」(보관 안 함만). 메모: 자료함에 「빠른 메모 - @작성시간」으로 저장. 브리핑: 최근 1건의 첫 섹션 3줄 + 마지막 집계 줄만 보낸다(메일 등 나머지 섹션은 보내지 않는다).
- 기존 DB 구조는 사용자 허락 없이 바꾸지 않는다.

## 로컬 확인
- 저장소 루트에서 `npx http-server@14.1.1 . -p 5174 -c-1`. 5174 포트는 Worker의 `ALLOWED_ORIGINS`에 들어 있다.
- 노션 크기 기준: 왼쪽 좁은 칸 약 330×220, 가로형(메모·브리핑) 약 640×220.
- 윈도우 셸에서 curl로 한글을 보내면 깨진다. 한글이 든 쓰기 확인은 브라우저 위젯으로 한다.
