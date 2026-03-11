# Node CLI Command

杩欐槸褰撳墠妯℃澘鐨勬帹鑽愬懡浠ゅ叆鍙ｃ€? 
閫傚悎鎯抽€氳繃 `npm` / `npx` 缁熶竴瀹屾垚鍒濆鍖栦笌鍚屾鐨勪汉銆?
## 鏀寔鐨勫懡浠?
- `profiles`
- `init`
- `init-full`
- `sync`

## 1. 鏌ョ湅鍐呯疆 Profile

```powershell
npx agent-project-template profiles
```

鐢ㄩ€旓細

- 鏌ョ湅褰撳墠鍙敤鐨勬ā鏉?Profile
- 鍦ㄥ垵濮嬪寲涔嬪墠纭畾椤圭洰绫诲瀷

澶囨敞锛?
- 鍙鍛戒护
- 涓嶄細淇敼浠讳綍鏂囦欢

## 2. 鍒濆鍖栨ā鏉块」鐩?
鏈€甯哥敤鍛戒护锛?
```powershell
npx agent-project-template init --name "Example Project" --slug example-project --target . --profile web-product
```

甯歌鍙傛暟锛?
- `--name`锛氶」鐩悕绉?- `--slug`锛氶」鐩洰褰曞悕
- `--target`锛氱洰鏍囩埗鐩綍锛岄粯璁ゅ綋鍓嶇洰褰?- `--profile`锛氭ā鏉?Profile
- `--config`锛氶厤缃枃浠惰矾寰?- `--force`锛氬厑璁稿啓鍏ラ潪绌虹洰褰?- `--in-place`锛氱洿鎺ュ湪鐩爣鐩綍鍒濆鍖?
鍩轰簬閰嶇疆鏂囦欢鍒濆鍖栵細

```powershell
npx agent-project-template init --target . --config .\project-config.json
```

鍦ㄥ綋鍓嶇洰褰曞師鍦板垵濮嬪寲锛?
```powershell
npx agent-project-template init --name "Example Project" --target . --profile web-product --in-place
```

澶囨敞锛?
- 涓嶅姞 `--in-place` 鏃讹紝浼氬湪 `--target` 涓嬪啀鐢熸垚涓€涓瓙鐩綍
- 鍔犱簡 `--in-place` 鏃讹紝浼氱洿鎺ユ妸褰撳墠鐩綍褰撻」鐩洰褰曚娇鐢?- 鍒濆鍖栧悗浼氱敓鎴?`.template/template-state.json`

## 3. 鍒濆鍖栧畬鏁存ā鏉挎鏋?
褰撲綘甯屾湜鎷垮埌瀹屾暣妯℃澘姣嶇増鑳藉姏锛岃€屼笉鍙槸杞婚噺椤圭洰楠ㄦ灦鏃讹紝浣跨敤锛?
```powershell
npx agent-project-template init-full --name "Example Project Template" --slug example-project-template --target . --profile ai-agent-workspace
```

瀹冧細棰濆甯︿笂锛?
- `package.json`
- `bin/`
- `lib/`
- `backend/meta/skills/` 鍏ㄩ儴鍐呭
- `backend/meta/templates/` 涓嬬殑瀹屾暣妯℃澘璧勪骇
- 鍩虹鐩綍璇存槑鏂囦欢涓庤鑼冩枃浠?
閫傚悎锛?
- 浣犺鎶婅繖涓€濂楅鏋跺綋鎴愨€滄ā鏉挎瘝鐗堚€濈户缁紨鍖?- 浣犲笇鏈涙柊鐩綍閲岀洿鎺ュ叿澶?CLI銆佹ā鏉裤€佹妧鑳戒笌瑙勮寖鐨勫畬鏁磋兘鍔?- 浣犲悗缁繕甯屾湜閫氳繃 `sync` 鍚屾杩欎簺妗嗘灦绾ф枃浠?
澶囨敞锛?
- 鍙傛暟涓?`init` 淇濇寔涓€鑷?- `init-full` 鐨勫吋瀹瑰埆鍚嶆槸 `init-template`
- 鍒濆鍖栧悗鍐欏叆鐨?`.template/template-state.json` 浼氳褰曟鏋舵ā寮忥紝鍚庣画 `sync` 浼氱户缁鐞嗚繖浜涙鏋剁骇鏂囦欢
- 涓嶄細澶嶅埗 `frontend/content/assets/raw/`銆乣backend/meta/generated/*` 鑽夌鎴?`frontend/content/docs/product/` / `frontend/content/docs/technical/` 閲岀殑涓氬姟鍐呭

## 4. 棰勮鎴栨墽琛屾ā鏉垮悓姝?
棰勮鍚屾锛?
```powershell
npx agent-project-template sync --project-root . --dry-run
```

鎵ц鍚屾锛?
```powershell
npx agent-project-template sync --project-root .
```

甯﹂厤缃枃浠跺埛鏂板彉閲忥細

```powershell
npx agent-project-template sync --project-root . --config .\project-config.json
```

澶囨敞锛?
- `init` 鏄?`bootstrap-project.ps1` 鐨?Node 鐗堝叆鍙?- `init-full` 鏄€滃畬鏁存ā鏉挎瘝鐗堝垵濮嬪寲鈥濆叆鍙?- `sync` 鏄?`sync-template.ps1` 鐨?Node 鐗堝叆鍙?- 寮虹儓寤鸿鍚屾鍓嶅厛璺戜竴娆?`--dry-run`
- PowerShell 鑴氭湰浠嶅彲淇濈暀涓哄吋瀹瑰叆鍙ｏ紝浣嗘帹鑽愪紭鍏堜娇鐢?Node CLI

## 鍏煎鍏ュ彛

濡傛灉褰撳墠浠嶉渶瑕?PowerShell 鍏ュ彛锛屽彲鍙傝€冿細

- `bootstrap-project-command.md`
- `sync-template-command.md`


