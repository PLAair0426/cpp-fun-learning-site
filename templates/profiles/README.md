# Profiles

本目录定义“项目类型 → 模板骨架”的默认适配规则。

## 合并顺序

初始化或同步时，配置按以下优先级合并：

1. `templates/template-manifest.json`
2. `templates/profiles/*.json`
3. 外部 `ConfigFile`
4. 命令行显式参数

后者覆盖前者。

## Profile 字段说明

- `profile`：Profile 标识，必须唯一
- `description`：该 Profile 的适用场景说明
- `variables`：会注入到模板占位符 `{{KEY}}`
- `extraDirectories`：除基础骨架外额外创建的目录
- `includeGlobs`：额外要复制进项目的模板文件
- `excludeGlobs`：初始化时跳过的模板文件
- `sync.managedExtraGlobs`：同步时额外纳入受管更新的文件
- `sync.protectedPrefixes`：同步时默认保护、不主动覆盖的路径前缀

## 设计原则

- Profile 只定义“项目类型的默认差异”，不保存业务事实
- 个性化信息放在 `template-config.example.json` 对应的项目配置中
- 如需新增项目类型，优先新增新的 Profile，而不是硬改脚本分支
