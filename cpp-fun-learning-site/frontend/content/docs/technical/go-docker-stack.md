# Go 鍚庣 + Docker 閮ㄧ讲鎶€鏈爤璇存槑

## 1. 鏂囨。鐩殑

鏈枃浠剁敤浜庢槑纭?`C++ 瓒ｅ懗瀛︿範缃戠珯` 鍦ㄩ噰鐢?`Go` 浣滀负鍚庣璇█銆侀噰鐢?`Docker` 浣滀负閮ㄧ讲鏂瑰紡鏃剁殑鎺ㄨ崘鎶€鏈爤銆佹湇鍔℃媶鍒嗐€侀儴缃茶竟鐣屼笌瀹炴柦閲嶇偣銆?
鏈鏄庢槸瀵逛互涓嬩袱浠芥枃妗ｇ殑琛ュ厖鍜屾敹鏁涳細

- `frontend/content/docs/technical/cpp-fun-learning-spec.md`
- `frontend/content/docs/technical/cpp-fun-learning-implementation.md`

## 2. 鎬讳綋鏂规

椤圭洰閲囩敤浠ヤ笅鎬讳綋缁勫悎锛?
- 鍓嶇锛歚Next.js` + `TypeScript`
- 鍚庣 API锛歚Go` + `chi` + `net/http`
- 寮傛浠诲姟锛歚Go Worker`
- 鏁版嵁搴擄細`PostgreSQL`
- 缂撳瓨涓庨檺娴侊細`Redis`
- 娑堟伅鎬荤嚎锛歚NATS JetStream`
- 鍒ら鏈嶅姟锛歚Judge0 CE`
- 瀵硅薄瀛樺偍锛歚MinIO`
- 缃戝叧锛歚Nginx`
- 鍙娴嬫€э細`OpenTelemetry` + `Prometheus` + `Grafana`
- 閮ㄧ讲鏂瑰紡锛歚Docker Compose`

## 3. 鎺ㄨ崘鎶€鏈爤

### 3.1 鍓嶇

- 妗嗘灦锛歚Next.js`
- 璇█锛歚TypeScript`
- 鏍峰紡锛歚Tailwind CSS`
- 缂栬緫鍣細`Monaco Editor`
- 鏁版嵁璇锋眰锛歚TanStack Query`
- 杞荤姸鎬侊細`Zustand`

璇存槑锛?
- `Next.js` 閫傚悎璇剧▼鍐呭椤点€侀搴撻〉銆丼EO 鍜屽悗缁悗鍙版暣鍚堛€?- `Monaco Editor` 閫傚悎 PC 绔唬鐮佺紪杈戯紝绉诲姩绔粛浠ュ彧璇诲拰杞讳氦浜掍负涓汇€?
### 3.2 Go 鍚庣

- Go 鐗堟湰锛歚Go 1.26.x`
- HTTP 璺敱锛歚chi`
- 鍘熺敓鍗忚鏍堬細`net/http`
- 鎺ュ彛椋庢牸锛歚REST`
- 瀹炴椂鐘舵€侊細`SSE`
- 鍐呴儴鏈嶅姟閫氫俊锛歚NATS` 浜嬩欢椹卞姩锛屽繀瑕佹椂鍐嶅紩鍏?`ConnectRPC` / `gRPC`

璇存槑锛?
- `chi` 杞婚噺銆佹爣鍑嗗簱鍏煎锛岄€傚悎闀挎湡缁存姢鐨?REST API銆?- `SSE` 閫傚悎鎻愪氦鐘舵€併€侀槦鍒楃姸鎬佺瓑鍗曞悜鎺ㄩ€侊紝涓嶅繀杩囨棭寮曞叆 `WebSocket`銆?- 鍒ら缁撴灉銆佺粡楠屽€煎彂鏀俱€佸窘绔犵粨绠楃瓑寮傛鍦烘櫙鐢ㄤ簨浠堕┍鍔ㄦ洿绋冲畾銆?
### 3.3 鏁版嵁灞?
- 涓绘暟鎹簱锛歚PostgreSQL`
- Go 椹卞姩锛歚pgx/v5`
- 杩炴帴姹狅細`pgxpool`
- SQL 绠＄悊锛歚sqlc`
- 杩佺Щ宸ュ叿锛歚golang-migrate`

璇存槑锛?
- 鏈」鐩搴撱€佹彁浜よ褰曘€佸涔犺繘搴︺€佽绋嬪唴瀹瑰潡閮介€傚悎钀藉湪 `PostgreSQL`銆?- `lesson_blocks` 寤鸿浣跨敤 `jsonb`锛屼究浜庢壙杞?`text/code/quiz/runner/wasm_demo` 绛夊潡缁撴瀯銆?- `sqlc + pgx` 閫傚悎澶嶆潅鏌ヨ鍜岄珮鍙帶鐨勬暟鎹眰锛屼笉寤鸿鏍稿績閾捐矾閲嶅害渚濊禆 ORM銆?
### 3.4 缂撳瓨銆侀檺娴佷笌娑堟伅

- 缂撳瓨锛歚Redis`
- 闄愭祦锛氬熀浜?`Redis` 瀹炵幇婊戝姩绐楀彛
- 鎺掕姒滐細`Redis Sorted Set`
- 闃熷垪涓庝簨浠舵祦锛歚NATS JetStream`

璇存槑锛?
- `Redis` 鐢ㄤ簬鐑偣缂撳瓨銆侀檺娴併€佹帓琛屾銆佺煭鏃剁姸鎬併€?- `NATS JetStream` 鐢ㄤ簬鎻愪氦缂栨帓銆佸垽棰樺洖鍐欍€佺姸鎬佸箍鎾€佹垚闀夸簨浠跺鐞嗐€?- 杩欐牱鍙互鎶娾€滀富绔欒姹傞摼璺€濆拰鈥滈噸浠诲姟閾捐矾鈥濇媶寮€銆?
### 3.5 鍒ら鏈嶅姟

- 鍒ら寮曟搸锛歚Judge0 CE`
- 杩愯璇█锛氶鍙戝彧寮€鍚?`C++17`
- 鎺ュ叆鏂瑰紡锛氫富绔欏紓姝ヨ皟鐢?Judge0 API

璇存槑锛?
- `run`锛氱敤浜庤鍫傚唴蹇€熻繍琛岋紝鍋忎綋楠屽弽棣堛€?- `submit`锛氱敤浜庢寮忓垽棰橈紝蹇呴』璧伴殣钘忕敤渚嬨€?- 涓荤珯鍙礋璐ｄ笟鍔＄紪鎺掞紱鐪熷疄浠ｇ爜鎵ц浜ょ粰鐙珛 Judge0 鏈嶅姟銆?
### 3.6 瀛樺偍涓庤繍缁?
- 瀵硅薄瀛樺偍锛歚MinIO`
- 鍙嶅悜浠ｇ悊锛歚Nginx`
- 鎸囨爣鐩戞帶锛歚Prometheus`
- 浠〃鐩橈細`Grafana`
- 閾捐矾涓庡煁鐐癸細`OpenTelemetry`
- 鏈湴/鍗曟満缂栨帓锛歚Docker Compose`

璇存槑锛?
- `MinIO` 鐢ㄤ簬璇剧▼灏侀潰銆佸浘鐗囥€佸鍏ヨ祫浜с€佸浠藉寘銆?- `Nginx` 缁熶竴瀵瑰鏆撮湶 `80/443`锛屽唴閮ㄦ湇鍔″叏閮ㄨ蛋瀹瑰櫒鍐呯綉銆?
## 4. 鎺ㄨ崘瀹瑰櫒鎷嗗垎

寤鸿鑷冲皯鎷嗘垚浠ヤ笅瀹瑰櫒锛?
- `nginx`锛氱粺涓€鍏ュ彛銆佸弽鍚戜唬鐞嗐€侀潤鎬佽祫婧愪唬鐞?- `web`锛歂ext.js 鍓嶇搴旂敤
- `api`锛欸o 涓讳笟鍔℃帴鍙?- `worker`锛欸o 寮傛浠诲姟鏈嶅姟
- `postgres`锛氫富鏁版嵁搴?- `redis`锛氱紦瀛樸€侀檺娴併€佹帓琛屾
- `nats`锛氭秷鎭€荤嚎涓庝簨浠舵祦
- `minio`锛氬璞″瓨鍌?- `judge0`锛氱嫭绔嬪垽棰樻湇鍔?- `prometheus`锛氭寚鏍囬噰闆?- `grafana`锛氱洃鎺х湅鏉?- `otel-collector`锛氱粺涓€閲囬泦 traces / metrics / logs

## 5. 瀹瑰櫒鑱岃矗杈圭晫

### 5.1 `web`

璐熻矗锛?
- 棣栭〉
- 瀛︿範鍦板浘
- 璇剧▼椤?- 绔犺妭椤?- 棰樺簱椤?- 鐢ㄦ埛涓績
- 鍚庡彴鍓嶇

涓嶈礋璐ｏ細

- 鍒ら鎵ц
- 鐘舵€佹寔涔呭寲
- 涓氬姟瑙勫垯缁撶畻

### 5.2 `api`

璐熻矗锛?
- 娉ㄥ唽鐧诲綍
- 璇剧▼銆佽矾寰勩€佺珷鑺傘€侀搴撴帴鍙?- 杩愯/鎻愪氦鍏ュ彛
- 鐢ㄦ埛杩涘害
- 鎴愰暱绯荤粺
- 鍚庡彴绠＄悊鎺ュ彛
- SSE 鐘舵€佹祦鎺ュ彛

涓嶈礋璐ｏ細

- 閲嶅瀷寮傛浠诲姟鎵ц
- 浠ｇ爜鐪熷疄缂栬瘧杩愯

### 5.3 `worker`

璐熻矗锛?
- Judge0 缁撴灉杞
- 鎻愪氦缁撴灉鍥炲啓
- XP 鍙戞斁
- 寰界珷瑙﹀彂
- 鎻愪氦鐘舵€佷簨浠跺箍鎾?- 澶滈棿鎵逛换鍔?
### 5.4 `judge0`

璐熻矗锛?
- 鎺ユ敹婧愮爜
- 缂栬瘧鎵ц
- 杩斿洖缂栬瘧淇℃伅銆佽繍琛岃緭鍑哄拰璧勬簮娑堣€?
涓嶈礋璐ｏ細

- 鐢ㄦ埛閴存潈
- 璇剧▼閫昏緫
- 瀛︿範璁板綍

## 6. Go 鏈嶅姟鎺ㄨ崘妯″潡

寤鸿 API 鏈嶅姟鍐呮寜涓氬姟妯″潡鎷嗗垎锛?
- `auth`
- `users`
- `paths`
- `courses`
- `lessons`
- `problems`
- `submissions`
- `progress`
- `gamification`
- `admin`
- `audit`

寤鸿 Worker 鏈嶅姟鍐呮寜浠诲姟妯″潡鎷嗗垎锛?
- `submission_polling`
- `submission_result_writer`
- `xp_granter`
- `achievement_dispatcher`
- `streak_updater`
- `nightly_jobs`

## 7. 鎺ㄨ崘鐩綍缁撴瀯

```text
.
鈹溾攢 frontend/content/apps/
鈹? 鈹溾攢 web/
鈹? 鈹溾攢 api/
鈹? 鈹斺攢 worker/
鈹溾攢 backend/backend/deployments/
鈹? 鈹溾攢 docker-compose.yml
鈹? 鈹溾攢 nginx/
鈹? 鈹溾攢 prometheus/
鈹? 鈹斺攢 grafana/
鈹溾攢 internal/
鈹? 鈹溾攢 auth/
鈹? 鈹溾攢 users/
鈹? 鈹溾攢 paths/
鈹? 鈹溾攢 courses/
鈹? 鈹溾攢 lessons/
鈹? 鈹溾攢 problems/
鈹? 鈹溾攢 submissions/
鈹? 鈹溾攢 progress/
鈹? 鈹溾攢 gamification/
鈹? 鈹溾攢 admin/
鈹? 鈹斺攢 audit/
鈹溾攢 pkg/
鈹? 鈹溾攢 db/
鈹? 鈹溾攢 logger/
鈹? 鈹溾攢 middleware/
鈹? 鈹溾攢 sse/
鈹? 鈹溾攢 redisx/
鈹? 鈹溾攢 natsx/
鈹? 鈹斺攢 storage/
鈹溾攢 backend/backend/sql/
鈹? 鈹溾攢 migrations/
鈹? 鈹斺攢 queries/
鈹斺攢 frontend/content/docs/
```

## 8. 鎺ㄨ崘鎺ュ彛涓庡崗璁?
### 8.1 澶栭儴鎺ュ彛

缁熶竴閲囩敤锛?
- `REST API`
- `JSON`
- `SSE`

鎺ㄨ崘鍦烘櫙锛?
- `GET /api/v1/paths`
- `GET /api/v1/courses/:slug`
- `GET /api/v1/lessons/:id`
- `POST /api/v1/run`
- `POST /api/v1/submit`
- `GET /api/v1/submissions/:id/stream`

### 8.2 鍐呴儴閫氫俊

缁熶竴閲囩敤锛?
- `NATS JetStream`

鎺ㄨ崘涓婚锛?
- `submission.created`
- `submission.polling.requested`
- `submission.finished`
- `xp.grant.requested`
- `achievement.check.requested`

## 9. Docker 閮ㄧ讲鏂规

### 9.1 閮ㄧ讲鏂瑰紡

棣栧彂閲囩敤锛?
- `Docker Compose` 鍗曟満鎴栧弻鏈洪儴缃?
鎺ㄨ崘鍘熷洜锛?
- 瀵?0鈫? 椤圭洰鎴愭湰鏈€浣?- 璋冭瘯绠€鍗?- 鏈嶅姟杈圭晫娓呮櫚
- 涓庡悗缁縼绉诲埌澶氭満/K8s 鐨勮矾寰勫吋瀹?
### 9.2 缃戠粶鍘熷垯

- 浠?`nginx` 瀵瑰叕缃戝紑鏀?- `api`銆乣worker`銆乣postgres`銆乣redis`銆乣nats`銆乣judge0` 鍧囧彧鍦ㄥ唴缃戦€氫俊
- `judge0` 涓嶇洿鎺ユ毚闇插叕缃戞帴鍙?
### 9.3 瀛樺偍鍘熷垯

浠ヤ笅鏈嶅姟蹇呴』鎸傝浇鎸佷箙鍗凤細

- `postgres`
- `minio`
- `grafana`
- `prometheus`

鍙€夋寔涔呭嵎锛?
- `redis`
- `nats`

### 9.4 瀹夊叏鍘熷垯

- Go 闀滃儚浣跨敤澶氶樁娈垫瀯寤?- 杩愯鎬佸鍣ㄤ娇鐢ㄩ潪 root 鐢ㄦ埛
- `judge0` 鍗曠嫭闄愬埗 CPU / 鍐呭瓨
- 閰嶇疆閫氳繃 `.env` 娉ㄥ叆锛屼笉鎶婂瘑閽ュ啓姝诲湪闀滃儚涓?- 鏁版嵁搴撱€佺紦瀛樸€佹秷鎭湇鍔′笉鏆撮湶瀹夸富鍏綉绔彛

### 9.5 鍋ュ悍妫€鏌?
鎵€鏈夋牳蹇冨鍣ㄥ缓璁姞 `healthcheck`锛?
- `web`
- `api`
- `worker`
- `postgres`
- `redis`
- `nats`
- `judge0`

## 10. 楂樺苟鍙戜笅鐨勫缓璁?
濡傛灉鍚庣画鐢ㄦ埛閲忔槑鏄惧鍔狅紝浠嶄繚鐣?Docker 浣撶郴锛屼絾鎸変互涓嬫柟寮忔墿灞曪細

### 10.1 浼樺厛鎵╁睍椤哄簭

1. `judge0`
2. `worker`
3. `api`
4. `web`

### 10.2 浼樺寲鍘熷垯

- 鍐呭椤靛敖閲忛潤鎬佸寲鍜岀紦瀛樺寲
- 鎻愪氦閾捐矾蹇呴』寮傛
- 鎺掕姒滀笌闄愭祦鍏ㄩ儴璧?`Redis`
- 鐘舵€佸箍鎾蛋 `NATS`
- `submissions` 琛ㄦ寜鏈堝垎鍖?- PostgreSQL 澧炲姞鍙鍓湰

### 10.3 浣曟椂鑰冭檻鍗囩骇閮ㄧ讲褰㈡€?
鍑虹幇浠ヤ笅鎯呭喌鏃讹紝鍙粠 `Docker Compose` 鍗囩骇鍒?`Kubernetes`锛?
- Judge0 闇€瑕佸鏈烘墿瀹?- Worker 娑堣垂瑙勬ā鏄庢樉澧炲姞
- API 闇€瑕佹粴鍔ㄥ彂甯冨拰鑷姩浼哥缉
- 鐩戞帶銆佹棩蹇椼€佺綉缁滅瓥鐣ュ紑濮嬪鏉傚寲

## 11. 棣栧彂鎺ㄨ崘鐗堟湰

### 11.1 MVP 寤鸿

- Go锛歚1.26.x`
- 鍓嶇锛歚Next.js`
- API锛歚chi`
- DB锛歚PostgreSQL 17`
- Redis锛歚Redis 7`
- NATS锛歚2.x`
- Judge0锛氫娇鐢ㄧǔ瀹氱増鏈暅鍍?- MinIO锛氭渶鏂扮ǔ瀹氱増
- Docker锛氬綋鍓嶇ǔ瀹氱増
- Docker Compose锛氬綋鍓嶇ǔ瀹氱増

## 12. 鏈€缁堟帹鑽愮粨璁?
瀵逛簬杩欎釜椤圭洰锛屾帹鑽愯惤鍦扮粍鍚堜负锛?
- 鍓嶇锛歚Next.js` + `TypeScript` + `Tailwind CSS`
- 鍚庣锛歚Go` + `chi` + `pgx/v5` + `sqlc`
- 鏁版嵁锛歚PostgreSQL`
- 缂撳瓨锛歚Redis`
- 娑堟伅锛歚NATS JetStream`
- 鍒ら锛歚Judge0 CE`
- 瀛樺偍锛歚MinIO`
- 缃戝叧锛歚Nginx`
- 杩愮淮锛歚OpenTelemetry` + `Prometheus` + `Grafana`
- 閮ㄧ讲锛歚Docker Compose`

杩欐槸褰撳墠闃舵鍦ㄢ€滃紑鍙戞晥鐜囥€佸彲缁存姢鎬с€佸垽棰橀殧绂汇€侀珮骞跺彂婕旇繘鑳藉姏銆侀儴缃插鏉傚害鈥濅箣闂存渶鍧囪　鐨勪竴濂楁柟妗堛€?


