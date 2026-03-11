# Bootstrap Project Command

鏈枃浠跺彧璇存槑鈥滃浣曞垵濮嬪寲妯℃澘宸ョ▼鈥濄€?
## 閫傜敤鍦烘櫙

- 鍒濆鍖栦竴涓柊椤圭洰楠ㄦ灦
- 鎸夐」鐩被鍨嬭嚜鍔ㄥ垱寤虹洰褰曘€佹ā鏉垮拰瑙勫垯鏂囦欢
- 涓哄悗缁ā鏉垮悓姝ョ敓鎴?`.template/template-state.json`

## 鎺ㄨ崘鏂瑰紡锛歂ode CLI

```powershell
npx agent-project-template init --name "Acme Learning Platform" --slug acme-learning-platform --target . --profile web-product
```

### 甯哥敤鍙傛暟

- `--name`锛氶」鐩悕绉?- `--slug`锛氶」鐩洰褰曞悕
- `--target`锛氱洰鏍囩埗鐩綍
- `--profile`锛氭ā鏉?Profile
- `--config`锛氶厤缃枃浠?- `--force`锛氬厑璁稿啓鍏ラ潪绌虹洰褰?- `--in-place`锛氬湪褰撳墠鐩爣鐩綍鍘熷湴鍒濆鍖?
### 绀轰緥 1锛氱洿鎺ョ敤鍙傛暟鍒濆鍖?
```powershell
npx agent-project-template init --name "Acme Learning Platform" --slug acme-learning-platform --target "H:\workspace" --profile web-product
```

鏁堟灉锛?
- 鐢熸垚鐩綍锛歚H:\workspace\acme-learning-platform`
- 鐢熸垚妯℃澘鐘舵€侊細`.template/template-state.json`

### 绀轰緥 2锛氶€氳繃宸茬紪杈戠殑閰嶇疆鏂囦欢鍒濆鍖?
```powershell
npx agent-project-template init --target "H:\workspace" --config "H:\workspace\acme-template-config.json"
```

閫傚悎锛?
- 甯屾湜鎶婇」鐩悕銆丱wner銆佹妧鏈爤绛夊垵濮嬪寲淇℃伅缁熶竴鏀捐繘閰嶇疆鏂囦欢

### 绀轰緥 3锛氬師鍦板垵濮嬪寲

```powershell
npx agent-project-template init --name "Acme Learning Platform" --target "H:\workspace\acme-learning-platform" --profile web-product --in-place
```

閫傚悎锛?
- 鐩爣鐩綍宸茬粡鏄庣‘
- 涓嶅笇鏈涘啀鑷姩鍒涘缓瀛愮洰褰?
## PowerShell 鍏煎鍏ュ彛

```powershell
powershell.exe -ExecutionPolicy Bypass -File backend/meta/templates/commands/bootstrap-project.ps1 `
  -ProjectName "Acme Learning Platform" `
  -ProjectSlug "acme-learning-platform" `
  -TargetPath "H:\workspace" `
  -Profile "web-product"
```

## 澶囨敞

- `Profile` 鍐冲畾榛樿鐩綍銆侀粯璁ゅ彉閲忓拰淇濇姢璺緞
- `ConfigFile` 寤鸿鍩轰簬 `backend/meta/templates/template-config.example.json` 澶嶅埗鍚庡～鍐欙紝鍐嶄紶鍏ヨ剼鏈?- `ConfigFile` 鐢ㄤ簬瑕嗙洊鍏蜂綋椤圭洰鐨勫悕绉般€丱wner銆佹妧鏈爤鍜岄澶栫洰褰?- 鍒濆鍖栧悗浼氱敓鎴?`.template/template-state.json`锛屼緵鍚庣画鍚屾浣跨敤
- `init` 鏄棩甯告帹鑽愬叆鍙ｏ紱PowerShell 鑴氭湰涓昏浣滀负鍏煎鏂瑰紡淇濈暀
- 濡傛灉浣犻渶瑕佺殑鏄€滃畬鏁存ā鏉挎瘝鐗堚€濊€屼笉鏄交閲忛」鐩鏋讹紝璇锋敼鐢?`init-full`



