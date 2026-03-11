# Templates

鏈洰褰曟槸鏁村妯℃澘楠ㄦ灦鐨勨€滄帶鍒堕潰鈥濓紝璐熻矗瀹氫箟锛?
- 濡備綍鍒濆鍖栭」鐩鏋?- 濡備綍鎸夐」鐩被鍨嬭嚜鍔ㄩ€傞厤
- 濡備綍鍦ㄥ凡鏈夐」鐩腑鍚屾妯℃澘鍗囩骇
- 濡備綍鐢熸垚 PRD / Spec / 鎵ц鏂囨。
- 濡備綍閫氳繃 Node CLI 缁熶竴璋冪敤妯℃澘鑳藉姏

## 妯″潡鍒嗗伐

- `template-manifest.json`锛氬熀纭€楠ㄦ灦銆佸彈绠℃枃浠躲€佸悓姝ヤ繚鎶よ寖鍥?- `template-config.example.json`锛氶」鐩骇瑕嗙洊閰嶇疆绀轰緥
- `profiles/`锛氫笉鍚岄」鐩被鍨嬬殑榛樿閫傞厤瑙勫垯
- `prompts/`锛氶樁娈靛瀷鎻愮ず璇嶆墜鍐岋紝瀹氫箟妯″瀷鎵ц杈圭晫
- `commands/`锛氬垵濮嬪寲銆佸悓姝ュ拰鐢熸垚鍛戒护
- `documents/`锛氭寮忔枃妗ｆā鏉?
## CLI 鍏ュ彛

鎺ㄨ崘浼樺厛浣跨敤 Node CLI锛?
```powershell
npx agent-project-template init --name "Example Project" --slug example-project --target . --profile web-product
npx agent-project-template init-full --name "Example Project Template" --slug example-project-template --target . --profile ai-agent-workspace
npx agent-project-template sync --project-root . --dry-run
```

PowerShell 鑴氭湰缁х画淇濈暀涓哄吋瀹瑰叆鍙ｃ€?
- `init`锛氬垵濮嬪寲杞婚噺椤圭洰宸ヤ綔鍖?- `init-full`锛氬垵濮嬪寲瀹屾暣妯℃澘妗嗘灦姣嶇増

## Prompt 杈圭晫

璇︾粏璇存槑鍙洿鎺ユ煡鐪?`prompts/README.md`銆?
- `generate-prd.md`锛氬彧璐熻矗浠庡師濮嬭祫鏂欏拰婢勬竻闂瓟鐢熸垚 PRD锛屼笉璐熻矗鎶€鏈璁″拰鎵ц璁″垝
- `prd-to-spec.md`锛氬彧璐熻矗浠庣‘璁ょ増 PRD 鐢熸垚 Spec锛屼笉璐熻矗鏂板闇€姹傚拰鐮斿彂鎺掓湡
- `spec-to-execution-plan.md`锛氬彧璐熻矗浠庣‘璁ょ増 PRD + Spec 鐢熸垚鎵ц璁″垝锛屼笉璐熻矗閲嶅啓 PRD 鎴栭噸璁捐 Spec

## 鑷姩閫傞厤鏈哄埗

鍒濆鍖栨垨鍚屾鏃讹紝榛樿鎸変互涓嬮『搴忓悎骞堕厤缃細

1. `template-manifest.json`
2. `profiles/*.json`
3. 澶栭儴 `ConfigFile`
4. 鍛戒护琛屽弬鏁?
## 鑷姩杩唬鏈哄埗

- 鏂伴」鐩€氳繃 `backend/meta/templates/commands/bootstrap-project.ps1` 鍒濆鍖?- 宸插垵濮嬪寲椤圭洰閫氳繃 `backend/meta/templates/commands/sync-template.ps1` 鍚屾楠ㄦ灦鍗囩骇
- 椤圭洰鏈湴鐘舵€佸啓鍏?`.template/template-state.json`



