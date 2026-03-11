# Sync Template Command

鏈枃浠跺彧璇存槑鈥滃浣曞悓姝ユā鏉垮崌绾р€濄€?
## 閫傜敤鍦烘櫙

- 鎶婃ā鏉夸粨搴撶殑鏂拌鍒欏悓姝ュ埌宸插垵濮嬪寲椤圭洰
- 鍗囩骇 `backend/meta/templates/`銆乣backend/meta/specification/`銆佹牴绾ц鍒欐枃浠?- 鍦ㄤ笉瑕嗙洊涓氬姟鏂囨。鐨勫墠鎻愪笅璁╅」鐩鏋惰嚜鍔ㄨ凯浠?
## 鎺ㄨ崘鏂瑰紡锛歂ode CLI

```powershell
npx agent-project-template sync --project-root . --dry-run
```

### 甯哥敤鍙傛暟

- `--project-root`锛氬凡鏈夐」鐩牴鐩綍
- `--profile`锛氬己鍒惰鐩栧綋鍓?Profile
- `--config`锛氶厤缃枃浠惰矾寰?- `--include`锛氶澶栫撼鍏ュ悓姝ョ殑 glob
- `--exclude`锛氶澶栨帓闄ょ殑 glob
- `--dry-run`锛氫粎棰勮鍙樻洿
- `--force`锛氬厑璁歌Е纰伴粯璁ゅ彈淇濇姢璺緞

### 绀轰緥 1锛氬厛棰勮鍚屾缁撴灉

```powershell
npx agent-project-template sync --project-root "H:\workspace\acme-learning-platform" --dry-run
```

鎺ㄨ崘鍘熷洜锛?
- 浼氬厛鍛婅瘔浣犲摢浜涙枃浠舵槸 `create`銆乣update`銆乣unchanged`銆乣skip-protected`
- 鍙互鍏堢‘璁ら闄╋紝鍐嶅喅瀹氭槸鍚︽寮忓啓鍏?
### 绀轰緥 2锛氭墽琛屽悓姝?
```powershell
npx agent-project-template sync --project-root "H:\workspace\acme-learning-platform"
```

### 绀轰緥 3锛氬甫閰嶇疆鏂囦欢鏇存柊椤圭洰鍙橀噺

```powershell
npx agent-project-template sync --project-root "H:\workspace\acme-learning-platform" --config "H:\workspace\acme-learning-platform\project-config.json"
```

### 绀轰緥 4锛氶澶栧寘鍚垨鎺掗櫎閮ㄥ垎鏂囦欢

```powershell
npx agent-project-template sync --project-root "H:\workspace\acme-learning-platform" --dry-run --include "backend/meta/templates/documents/*.md" --exclude "backend/meta/templates/commands/*.md"
```

## PowerShell 鍏煎鍏ュ彛

```powershell
powershell.exe -ExecutionPolicy Bypass -File backend/meta/templates/commands/sync-template.ps1 `
  -ProjectRoot "H:\workspace\acme-learning-platform" `
  -DryRun
```

## 澶囨敞

- 榛樿浼樺厛淇濇姢 `frontend/content/assets/raw/`銆乣backend/meta/generated/`銆乣frontend/content/docs/product/`銆乣frontend/content/docs/technical/`銆乣frontend/content/docs/execution/`
- 鎺ㄨ崘鍏堜娇鐢?`--dry-run`
- 濡傜‘闇€瑕嗙洊鍙椾繚鎶よ矾寰勶紝鍙樉寮忎紶 `--force`
- 濡傛灉椤圭洰缂哄皯 `.template/template-state.json`锛岃鏄庡畠杩樹笉鏄€氳繃妯℃澘鍒濆鍖栧緱鍒扮殑锛屾棤娉曞畨鍏ㄥ悓姝?


