# Init Full Template Command

鏈枃浠跺彧璇存槑鈥滃浣曞垵濮嬪寲瀹屾暣妯℃澘妗嗘灦鈥濄€?
## 閫傜敤鍦烘櫙

- 涓嶅彧鏄垱寤洪」鐩鏋讹紝鑰屾槸瑕佹嬁鍒版暣濂楁ā鏉挎瘝鐗?- 闇€瑕佹妸 CLI銆佹ā鏉裤€佹妧鑳姐€佽鑼冧竴璧锋嫹璐濆嚭鏉?- 甯屾湜鏂扮洰褰曞悗缁繕鑳界户缁悓姝ユ鏋剁骇鍗囩骇

## 鎺ㄨ崘鏂瑰紡锛歂ode CLI

```powershell
npx agent-project-template init-full --name "Acme Agent Template" --slug acme-agent-template --target . --profile ai-agent-workspace
```

## 浼氬甫鍑虹殑鍐呭

- 鏍圭骇鍏ュ彛鏂囦欢锛歚README.md`銆乣AGENTS.md`銆乣package.json`
- CLI 婧愮爜锛歚bin/`銆乣lib/`
- 妯℃澘鎺у埗闈細`backend/meta/templates/`
- 鎶€鑳借祫浜э細`backend/meta/skills/`
- 瑙勮寖涓庡熀纭€鐩綍锛歚frontend/content/assets/`銆乣backend/meta/preparation/`銆乣backend/meta/generated/`銆乣frontend/content/docs/`銆乣backend/meta/specification/` 鐨勭洰褰曢鏋朵笌閫氱敤璇存槑鏂囦欢

## 涓嶄細甯﹀嚭鐨勫唴瀹?
- `frontend/content/assets/raw/` 閲岀殑鍘熷涓氬姟璧勬枡
- `backend/meta/generated/` 閲岀殑鑽夌涓庝腑闂翠骇鐗?- `frontend/content/docs/product/`銆乣frontend/content/docs/technical/`銆乣frontend/content/docs/execution/` 閲岀殑椤圭洰姝ｅ紡鏂囨。

## 甯哥敤鍙傛暟

- `--name`锛氶」鐩悕绉?- `--slug`锛氶」鐩洰褰曞悕
- `--target`锛氱洰鏍囩埗鐩綍
- `--profile`锛氭ā鏉?Profile
- `--config`锛氶厤缃枃浠?- `--force`锛氬厑璁稿啓鍏ラ潪绌虹洰褰?- `--in-place`锛氬湪褰撳墠鐩爣鐩綍鍘熷湴鍒濆鍖?
## 绀轰緥 1锛氱敓鎴愬畬鏁存ā鏉挎瘝鐗堢洰褰?
```powershell
npx agent-project-template init-full --name "Acme Agent Template" --slug acme-agent-template --target "H:\workspace" --profile ai-agent-workspace
```

鏁堟灉锛?
- 鐢熸垚鐩綍锛歚H:\workspace\acme-agent-template`
- 澶嶅埗瀹屾暣妯℃澘妗嗘灦鍐呭
- 鐢熸垚妯℃澘鐘舵€侊細`.template/template-state.json`

## 绀轰緥 2锛氶€氳繃閰嶇疆鏂囦欢鍒濆鍖栧畬鏁存ā鏉?
```powershell
npx agent-project-template init-full --target "H:\workspace" --config "H:\workspace\acme-template-config.json"
```

閫傚悎锛?
- 甯屾湜缁熶竴绠＄悊椤圭洰鍚嶃€丱wner銆佹妧鏈爤涓?Profile
- 甯屾湜鎶婂畬鏁存ā鏉挎鏋朵綔涓烘爣鍑嗘瘝鐗堟壒閲忕敓鎴?
## 涓?`init` 鐨勫尯鍒?
- `init`锛氶€傚悎鏅€氶」鐩惤鍦帮紝鍙鍒惰交閲忛鏋朵笌蹇呰妯℃澘
- `init-full`锛氶€傚悎妯℃澘姣嶇増鍦烘櫙锛屼細鎶?CLI銆佹妧鑳藉拰瀹屾暣妗嗘灦涓€璧峰鍒讹紝浣嗕笉浼氬甫鍑哄叿浣撻」鐩祫鏂?
## 澶囨敞

- `init-full` 鐨勫吋瀹瑰埆鍚嶆槸 `init-template`
- 鍒濆鍖栧悗锛屽悗缁?`sync` 浼氱户缁鐞嗘鏋剁骇鏂囦欢
- 濡傛灉浣犲彧鎯冲紑濮嬩竴涓叿浣撻」鐩紝浼樺厛浣跨敤 `init`



