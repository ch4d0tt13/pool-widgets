# pool-widgets

노션 「수영장 대시보드」에 임베드하는 픽셀 수영장 위젯 모음. 공개 저장소이므로 이 파일에도 비밀 값·노션 ID·개인 정보는 적지 않는다.

## 배포 구분
- 사용자가 직접 운영하는 개인 사이트다. 확인이 끝나면 묻지 않고 커밋·푸시·배포한다.
- 위젯: GitHub Pages (`https://ch4d0tt13.github.io/pool-widgets/<위젯>/`). `main`에 푸시하면 GitHub Actions(`.github/workflows/pages.yml`)가 `tools/stamp.mjs`로 모든 상대 주소(.js·.css)에 `?v=커밋번호`를 붙인 복사본을 배포한다. 노션이 예전 파일을 기억해도 섞여 깨지지 않는다(새 버전은 최대 10분 뒤 보인다). 소스에는 버전을 쓰지 않는다.
- 중계 서버: Cloudflare Worker `pool-widgets-api`. `worker/`에서 `npx wrangler deploy`.

## 구조
- `shared/` 모든 위젯이 같이 쓰는 것
  - `css/index.css` 진입점 (글꼴 → `tokens.css` → `base.css` → `frames.css`)
  - `css/tokens.css` 색·글꼴·간격·모서리·그림자 토큰. 값은 여기서만 정한다
  - `css/frames.css` 창 틀과 제목 표시줄 무늬 변주
  - `js/widget.js` `startWidget(장면)`: 창 제목 표시줄·물 장면·아이콘을 붙이고 툴팁을 켠다
  - `js/tooltip.js` 픽셀 말풍선 툴팁. 위젯 코드는 `title`만 달면 된다(가리킬 때 `data-tip`으로 옮겨 기본 툴팁이 안 뜨게 한다). 마우스로 가리키거나 키보드로 옮겨 왔을 때만 뜬다
  - `js/pool.js` 픽셀 물 장면 그리기, `js/scenes.js` 장면 목록(물 색 토큰·그림 위치 `at`·소품), `js/daylight.js` 시간대(새벽·노을·밤). 필터를 덮지 않고, 문서(`<html>`)에 `data-phase`를 붙여 `tokens.css`의 시간대 색 토큰으로 물 장면을 통째로 다시 칠한다. 창 틀·상자 안 글자는 그대로이고, 밤에는 물 위 큰 숫자(`.display`)만 밝게 바꾼다
  - `js/water-art.js`·`img/water.png` 사용자가 직접 그린 물 그림의 빛 그물만 도트로 다시 그린 그림 (R 빛 그물·G 물 조각의 가운데 위치). 색은 그림에 없다. 물 조각은 창 왼쪽일수록 어두운 하늘, 오른쪽일수록 밝은 하늘(조각 하나는 한 색). 그늘은 빛 그물과 같은 무늬를 비켜서 따로 일렁인다(사용자가 그린 방식). 흘러가는 움직임은 사용자가 원하지 않는다
  - `js/sprite.js`·`js/icons.js` 픽셀 그림 (글자 하나 = 한 칸, 색은 토큰). 늘 정수 배율로 띄운다: 보통 아이콘 7×7, 글자 옆 작은 아이콘은 5×5(`-small` + `.icon--small`), 창 버튼 3×3. 그림을 어중간한 크기로 늘리면 픽셀이 고르지 않다
  - `js/api.js` 중계 서버 호출, `js/dom.js` 작은 도우미 (`$`·`pad`·`el`·`showText`)
  - `js/live.js` 위젯끼리 바로 알리기(`announce`·`onAnnounce`)와 보이는 동안만 새로 고치기(`refreshWhileVisible`)
  - `js/dates.js` 마감일 계산 (`daysUntil`·`ddayLabel`·`shortDate`)
  - `js/records.js` 이 기기에 남기는 기록: 날마다 집중(`focus`)·정리(`tidy`) 횟수와 고양이 간식. 바뀌면 `records-changed`를 알린다
- 위젯 폴더: `clock/` `weather/` `pomodoro/` `dday/` `memo/` `briefing/` `calendar/` `cat/` `inbox/` `stats/` `projects/` (각각 `index.html` + 위젯 전용 js·css)
  - `pomodoro/water-sound.js` 파일 없이 만드는 물소리 (타이머가 도는 동안만). 집중을 끝까지 마치면 기록하고 고양이 간식을 하나 쌓는다
  - `cat/` 고양이 키우기: 서버·열쇠 없이 기록을 각 기기 브라우저(localStorage)에만 저장. 「간식 주기」는 뽀모도로로 쌓은 간식을 쓴다
  - `stats/` 이번 주 기록: 요일별 유리 물탱크에 정리(파랑)·집중(분홍) 물이 차오르는 수위계 (records.js, 기기별)
  - `memo/` 빠른 메모: 창 틀·물 배경 없이 한 줄 입력칸과 저장 버튼만 (widget.js를 쓰지 않는다). 결과는 입력칸 안내 문구 자리에 잠깐 보여 준다
  - `briefing/` 브리핑: 데크 장면, 쪽지는 데크 위 왼쪽 (스티커에 종류·시각이 있어 제목 줄은 보여 주지 않는다)
  - `projects/` 프로젝트 카드: 물에 뜬 킥판(손잡이 구멍·마감이 가까울수록 진한 색·박자 다르게 둥실). 보관 안 한 프로젝트를 마감일 순 갤러리로, 누르면 노션 페이지 새 탭. 카드에서 마감일을 정하거나 지우면 `deadlines-changed`를 알려 D-day·달력이 바로 다시 본다
  - `inbox/` 인박스 정리: 프로젝트·영역·자원 연결이 모두 비고 보관 안 한 자료를 카드로 보여 주고 영역·자원 연결·보관·삭제(두 번 눌러야 하고 노션 휴지통으로). 30초마다·화면을 다시 볼 때 새로 고치고, 빠른 메모 저장 신호(`memo-saved`)를 받으면 바로 다시 본다
- `tools/stamp.mjs` 배포용 복사본에 버전 붙이기 (Actions가 실행)
- `tools/pixelate.py` 물 그림 원본 → `shared/img/water.png` (180칸으로 줄여 겹별로 다시 그리고, 끝과 처음이 이어지게 잘라 붙여 150×46). 원본 그림은 저장소에 올리지 않는다. 그림은 뒤집어 잇지 않는다(데칼코마니처럼 보여서 사용자가 싫어함)
- `worker/` 노션 키를 숨기는 중계 서버 (`GET /dday`, `GET /calendar?month=YYYY-MM`, `POST /memo`, `GET /briefing`, `GET /inbox`, `GET /areas`, `POST /inbox/<id>/area`·`/archive`·`/trash`, `GET /projects`, `POST /projects/<id>/deadline`)
  - `src/routes.js` 마감일·메모·브리핑, `src/inbox.js` 인박스, `src/projects.js` 프로젝트·마감일 정하기, `src/notion.js` 노션 호출·글자 도우미·소속 확인(`pageInSource`)

## 디자인 규칙
- 물과 픽셀 테마를 벗어나지 않는다. 글꼴은 Galmuri(숫자는 GalmuriMono11). 픽셀 글꼴이라 11 계열은 12px, 9 계열은 10px의 배수에서만 또렷하다. 크기는 `--size-*` 토큰(배수로 내려 맞춤)만 쓰고, 작은 글자(`--size-small`)는 `--font-small`·`--font-digit-small`(9 계열)과 짝지어 쓴다. 제목 표시줄은 `--size-bar`(12px)로 창 크기와 상관없이 고정이다.
- 공유: 창 틀, 계단식 둥근 모서리(바깥 3칸·안쪽 2칸), 제목 표시줄 구조, 스티커(`.caption`).
- 변주: 위젯마다 창 안 물 장면(`scenes.js`)·배치·제목 표시줄 무늬·창 틀 색을 다르게 한다. 위젯들을 똑같이 만들지 않는다.
  - 사용자가 마음에 들어 지금 모습을 지키기로 한 위젯: 마감·인박스·시계·날씨·집중(기본 남색 틀). 바꿀 때는 먼저 묻는다
  - 창 틀 색은 `tokens.css`의 `[data-widget]`에서 `--line`으로: 달력 보라·고양이 산딸기·기록 청록·프로젝트 주황·브리핑 나무색. 상자 테두리(`--pixel-border`)도 따라간다(그래서 `body`에서 정의)
  - 장면 변주 예: 달력 타일 바닥(`tiles`), 고양이 분홍 물(`ROSE`, 시간대별 색 있음), 브리핑 데크(`top: "deck"`), 집중 레인(`lanes`)
- 창은 임베드 칸을 채우고 바깥 틀까지 계단식으로 둥글게 깎는다. 깎인 자리는 투명해서 노션 바탕이 비친다.
- `tokens.css`의 `color-scheme: light dark`를 지운다면 노션(다크)과 색 모드가 어긋나서 투명한 자리가 하얗게 칠해진다.
- 도트 1칸은 `--px`(3px). 테두리(`--pixel-border`)는 상자 바깥으로 1칸씩 나오므로, 테두리 있는 상자끼리의 간격은 `--gap-box`(보이는 틈 2칸)·`--gap-box-tight`(1칸)를 쓴다. `--space-*`를 쓰면 테두리끼리 붙어 버린다.
- 새 색·크기는 `tokens.css`에 토큰으로 추가한다. 위젯별 포인트 색은 `[data-widget="..."]`에서 다시 정한다.
- `data-title`은 창 제목용으로 예약돼 있다. 위젯 안 요소에는 다른 이름을 쓴다.
- 노션 페이지로 가는 링크는 새 탭(`target="_blank"`)으로 연다. 사용자가 보고 있는 노션 화면을 바꾸는 이동(`_top`)은 쓰지 않는다. 새 탭이 앞으로 오는지는 노션 앱·브라우저가 정한다.

## 비밀 값
- 노션 키·위젯 열쇠·노션 데이터 소스 ID는 Worker 비밀 값(`wrangler secret`)과 `worker/.dev.vars`에만 둔다. 둘 다 깃에서 제외돼 있다.
- 열쇠가 든 임베드 주소는 `worker/embed-urls.txt`(깃 제외)에 있다. 노션에는 사용자가 직접 붙여 넣는다.
- 열쇠 값을 읽어 화면에 출력하지 않는다(앱 권한 검사에서도 막힌다). 필요하면 셸 변수로만 쓴다.
- 노션 키는 사용자가 `npx wrangler secret put NOTION_TOKEN`으로 직접 넣는다.

## 노션 연결
- 노션 통합 「솔티 위젯」에 프로젝트 목록·자료함·브리핑·영역·자원 DB 접근 권한이 있어야 한다. 기능은 콘텐츠 읽기·삽입·업데이트.
- D-day: 프로젝트 목록의 「마감일」(보관 안 함만). 메모: 자료함에 「빠른 메모 - @작성시간」으로 저장. 브리핑: 최근 1건의 첫 섹션 3줄 + 마지막 집계 줄만 보낸다(메일 등 나머지 섹션은 보내지 않는다).
- 인박스 연결·보관·삭제, 프로젝트 마감일 정하기는 바꾸기 전에 그 페이지가 해당 DB 소속인지 서버가 확인한다. 삭제는 휴지통으로 보내기만 한다(API에 완전 삭제가 없다).
- 기존 DB 구조는 사용자 허락 없이 바꾸지 않는다.

## 로컬 확인
- 저장소 루트에서 `npx http-server@14.1.1 . -p 5174 -c-1`. 5174 포트는 Worker의 `ALLOWED_ORIGINS`에 들어 있다.
- 노션 크기 기준: 왼쪽 좁은 칸 약 330×220, 가로형(메모·브리핑) 약 640×220.
- 시간대 색은 주소에 `?hour=6`(새벽)·`?hour=18`(노을)·`?hour=22`(밤)을 붙여 확인한다.
- 아이콘 캔버스는 화면에 붙인 뒤에 그린다(붙기 전에는 토큰 색을 읽지 못해 빈칸이 된다).
- 윈도우 셸에서 curl로 한글을 보내면 깨진다. 한글이 든 쓰기 확인은 브라우저 위젯으로 한다.
