# Generate Execution Plan Command

鏈枃浠惰鏄庘€滃浣曡繘鍏ユ墽琛岃鍒掗樁娈碘€濄€?
## 閫傜敤鍦烘櫙

- 宸叉湁纭鐗?PRD + Spec锛屽噯澶囩敓鎴愭墽琛岃鍒?
## 杈撳叆鍓嶆彁

寤鸿鑷冲皯鍏峰锛?
- 纭鐗?PRD锛歚frontend/content/docs/product/{project}-prd.md`
- 纭鐗?Spec锛歚frontend/content/docs/technical/{project}-spec.md`

## 鎺ㄨ崘璋冪敤璇彞

```text
璇蜂娇鐢?backend/meta/templates/prompts/spec-to-execution-plan.md 鐨勮鍒欙紝
鍩轰簬 frontend/content/docs/product/{project}-prd.md 鍜?frontend/content/docs/technical/{project}-spec.md锛?鍏堝畬鎴愯緭鍏ュ畬鏁存€ф鏌ャ€丳RD/Spec 鏄犲皠涓庡啿绐佹彁鍙栵紝
鍐嶅皢鎵ц璁″垝鑽夌杈撳嚭鍒?backend/meta/generated/execution/{project}-execution-plan-draft.md锛?姝ｅ紡鐗堣緭鍑哄埌 frontend/content/docs/execution/{project}-execution-plan.md銆?```

## 杈撳嚭浣嶇疆

- 鑽夌锛歚backend/meta/generated/execution/{project}-execution-plan-draft.md`
- 姝ｅ紡鐗堬細`frontend/content/docs/execution/{project}-execution-plan.md`

## 澶囨敞

- 鎵ц璁″垝闃舵涓嶅簲閲嶅啓 PRD 鎴栭噸鍋?Spec
- 濡傛灉 PRD / Spec 浠嶆湁鍏抽敭缂哄彛锛屽簲鍏堝垪鍏ュ緟纭椤癸紝鍐嶅喅瀹氭槸鍚︽帹杩?


