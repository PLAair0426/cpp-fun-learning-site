# 褰撳墠浜や粯鐘舵€?
## 鏂囨。瀹氫綅

鏈枃妗ｇ敤浜庤鏄?`examples/cpp-fun-learning-site` 杩欎唤绀轰緥宸ョ▼褰撳墠宸茬粡瀹為檯钀藉湴浜嗕粈涔堛€佸摢浜涜兘鍔涗粛鐒跺彧鏄妧鏈竟鐣屾垨涓嬩竴闃舵瑙勫垝锛岄伩鍏嶆妸鈥滅爺绌舵枃妗ｄ腑鐨勭洰鏍囨€佲€濊璇讳负鈥滃綋鍓嶄唬鐮佸凡鍏ㄩ儴瀹炵幇鈥濄€?
## 鏈宸插畬鎴?
### 1. 鍓嶇姝ｅ紡鍗囩骇

- 浠庨潤鎬?`HTML + Nginx` 鍗囩骇涓?`Next.js + TypeScript + Tailwind CSS`
- 瀹屾垚棣栭〉銆佽矾寰勬€昏椤点€佽矾寰勮鎯呴〉銆侀搴撻〉銆侀鐩鎯呴〉
- 寤虹珛缁熶竴鐨勮瑙夎瑷€锛氭繁鑹叉父鎴忓寲瀛︿範鍦板浘銆佺姸鎬佸崱鐗囥€佽矾寰勫叧鍗°€侀鐩帶鍒跺彴

### 2. Go API 姝ｅ紡鍖?
- 浠庣畝鍗曠ず渚嬫帴鍙ｅ崌绾т负 `chi` 璺敱缁撴瀯
- 鎶藉嚭 `config` 涓?`store`
- 琛ラ綈棣栭〉銆佽矾寰勩€侀搴撱€佹帓琛屾銆佽繘搴︺€佽繍琛屻€佹彁浜ょ瓑鎺ュ彛
- 鏄庣‘ `run` 涓?`submit` 鐨勮亴璐ｅ樊寮?- `submit` 宸叉敮鎸佺敱 `worker` 椹卞姩鐨勬湁鐘舵€?mock锛氭帓闃熴€佽繍琛屻€佸畬鎴愪笁闃舵鎺ㄨ繘

### 3. Docker 鍩虹璁炬柦琛ラ綈

- Compose 澧炲姞 `postgres` 涓?`redis`
- 澧炲姞 `.env.example`
- 澧炲姞 PostgreSQL 鍒濆鍖?SQL

### 4. PostgreSQL 鍐呭浠撳簱鎺ュ叆

- API 鍚姩鏃朵細灏濊瘯杩炴帴 PostgreSQL
- 鎴愬姛杩炴帴鍚庯紝浼氭妸棣栭〉銆佽矾寰勩€侀搴撱€佹帓琛屾銆佽繘搴︾瓑绉嶅瓙鏁版嵁鍐欏叆 `content_documents`
- 璇诲彇鎺ュ彛浼樺厛璧?PostgreSQL JSONB 鏂囨。浠撳簱锛屽け璐ユ椂鑷姩鍥為€€鍒板唴瀛樻暟鎹?- `/healthz` 宸茶兘鍙嶆槧褰撳墠鍐呭鏁版嵁婧愭槸 `memory` 杩樻槸 `postgres-jsonb`
- 鏂囨。绉嶅瓙鍙細鍦ㄧ己澶辨椂鍐欏叆锛屼笉浼氬湪姣忔鍚姩鏃惰鐩栧凡鏈夊唴瀹?
### 5. Submission 鎸佷箙鍖栨帴鍏?
- `submit` 鍒涘缓鐨勬彁浜よ褰曚細浼樺厛鍐欏叆 PostgreSQL `submissions`
- `GET /api/v1/submissions/:id` 鍦?PostgreSQL 鍙敤鏃朵細浼樺厛璇诲彇鏁版嵁搴撲腑鐨勬彁浜よ褰?- 鏁版嵁搴撲笉鍙敤鏃讹紝鎻愪氦鐘舵€佷粛浼氬洖閫€鍒?API 杩涚▼鍐呭瓨 map

### 6. Redis 鎺掕姒滀笌鎻愪氦闃熷垪

- Redis 鍙敤鏃讹紝鎺掕姒滀紭鍏堣鍙?Redis Sorted Set 缂撳瓨
- 鍚姩鏃朵細鎶婇粯璁ゆ鍗曠瀛愬啓鍏?Redis
- `submit` 浼氭妸鎻愪氦鐘舵€佸悓姝ュ埌 Redis Hash
- 寰呭鐞嗕腑鐨勬彁浜や細杩涘叆 Redis Sorted Set 闃熷垪锛屽畬鎴愬悗鑷姩绉诲嚭
- 鎻愪氦鐘舵€佸彉鍖栦細鍐欏叆 Redis List 浜嬩欢鏃ュ織
- `/healthz` 宸茶兘鍙嶆槧 Redis 鏄惁杩炴帴鎴愬姛锛屼互鍙婂綋鍓嶉槦鍒楁繁搴?
### 7. Worker 鏈嶅姟楠ㄦ灦

- 鏂板 `backend/worker`锛屼娇鐢?`Go` 浣滀负鐙珛寮傛鏈嶅姟鍏ュ彛
- `worker` 宸叉帴鍏?PostgreSQL / Redis 鐨勯噸璇曡繛鎺ラ€昏緫
- `worker` 宸叉彁渚?`/healthz` 鍋ュ悍妫€鏌ユ帴鍙?- `worker` 褰撳墠浼氬畾鏈熸壂鎻?Redis 涓殑寰呭鐞嗘彁浜ら泦鍚堬紝鎺ㄨ繘 `QUEUED -> RUNNING -> FINISHED`
- `worker` 浼氭妸 mock 璇勬祴缁撴灉鍥炲啓鍒?PostgreSQL 涓?Redis锛屽苟鍐欏叆浜嬩欢鏃ュ織涓庡績璺?- `worker` 宸叉帴鍏ョ湡瀹?Judge0 鐨勬彁浜や笌杞浠ｇ爜璺緞锛屽彲閫氳繃 `ENABLE_MOCK_JUDGE=false` 鍚敤
- 褰撳墠闃舵宸插叿澶囩湡瀹?Worker 娑堣垂閾捐矾锛屼絾灏氭湭瀹屾垚鐪熷疄 Judge0 鐜鑱旇皟
- 鍓嶇宸蹭紭鍏堟敼涓?`SSE` 璁㈤槄鎻愪氦鐘舵€侊紝娴佸紡涓嶅彲鐢ㄦ椂鑷姩鍥為€€涓鸿疆璇?
## 褰撳墠浠嶄负绀轰緥 / mock 鐨勯儴鍒?
### 1. 鍒ら

- `POST /api/v1/run` 褰撳墠涓哄嵆鏃?mock 杩斿洖
- `POST /api/v1/submit` 褰撳墠杩斿洖鎺掗槦淇℃伅涓?`submissionId`
- `GET /api/v1/submissions/:id` 褰撳墠鍙鍙栫敱 `worker` 鍥炲啓鐨勭姸鎬佹祦杞?- `GET /api/v1/submissions/:id/stream` 褰撳墠鍙緭鍑烘彁浜ょ姸鎬?`SSE` 浜嬩欢娴?- 宸叉帴鍏ョ湡瀹?Judge0 API 浠ｇ爜璺緞锛屼絾灏氭湭瀹屾垚鐪熷疄娌欑鎵ц涓庨殣钘忕敤渚嬭仈璋?
### 2. 鏁版嵁鎸佷箙鍖?
- 褰撳墠椤甸潰鏁版嵁鍦?PostgreSQL 鍙敤鏃朵紭鍏堟潵鑷?`content_documents`
- PostgreSQL 宸叉帴鍏ヤ负 JSONB 鏂囨。浠撳簱锛屼絾杩樹笉鏄渶缁堢殑瑙勮寖鍖栦笟鍔¤〃璇诲彇鏂规
- Redis 宸叉帴鍏ユ帓琛屾缂撳瓨涓庢彁浜ゆ祦绋嬮槦鍒楋紝浣嗗皻鏈帴鍏ラ檺娴併€佹垚闀跨郴缁熺粨绠楋紝浠ュ強鐪熷疄 Judge0 鐨勮仈璋冮獙鏀?
### 3. 鐢ㄦ埛鎴愰暱绯荤粺

- 棣栭〉涓庢鍗曞凡瀹屾垚灞曠ず妯″瀷
- 浣嗙敤鎴枫€佽繘搴︺€佺鍒般€乆P銆佸窘绔犱粛鏈帴鍏ョ湡瀹炰笟鍔℃暟鎹?
## 楠岃瘉缁撴灉

### 宸查€氳繃

- `frontend` 涓?`npm run build`
- `docker compose -f backend/backend/deployments/docker-compose.yml up --build`
- `backend/api` 涓?`go test ./...`锛堥€氳繃 Docker `golang:1.24-alpine` 瀹瑰櫒鎵ц锛?- `backend/worker` 涓?`go test ./...`锛堥€氳繃 Docker `golang:1.24-alpine` 瀹瑰櫒鎵ц锛?- `GET /healthz`
- Web 棣栭〉銆侀搴撻〉銆侀鐩鎯呴〉璁块棶
- `submit -> worker -> status -> SSE` 寮傛閾捐矾鑱旇皟

### 褰撳墠浠嶉渶鍚庣画琛ラ綈

- 鐪熷疄 Judge0 鐢熶骇绾ц仈璋?- 闅愯棌鐢ㄤ緥銆佹矙绠遍殧绂讳笌姝ｅ紡鍒ら楠屾敹

## 鎺ㄨ崘涓嬩竴姝?
1. 涓?`backend/api` 澧炲姞 PostgreSQL Repository 灞?2. 鐢ㄧ湡瀹?Judge0 鐜瀹屾垚 `submit` 閾捐矾鑱旇皟锛屽苟琛ュ厖 SSE 鏂嚎閲嶈繛浣撻獙浼樺寲
3. 涓?`frontend`銆乣backend/api`銆乣backend/worker` 澧炲姞鏇寸粏绮掑害鐨勮嚜鍔ㄥ寲娴嬭瘯


