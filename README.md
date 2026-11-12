# 方块纪元

基于 React、Vite 和 Zustand 的 Minecraft 题材文字增量放置游戏。从初生森林的第一棵树出发，建立村庄、打通下界、挑战末影龙，最后把远征所得带回村庄建成纪念碑。

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
```

测试需要支持 TypeScript 类型擦除的 Node.js（22.18+）。

## 游戏进程

- **求生与安家**　制作工作台后，可按工具阶段勘察固定路线，也能自由探索。可自行建立营地，或到村庄定居。种植、营火料理和休整能补充远行所需。
- **村庄经营**　首批两位村民各在 20 秒后入住。后续迁入需要小麦，常住村民消耗少量口粮。耕作受四季影响，玩家可安排岗位、扩建仓库、启停红石产线，或组织守卫迎击袭击。
- **下界与末地**　用钻石镐开采黑曜石，在家建造下界门。烈焰人与末影人提供定位和启动末地传送门所需的材料。凋灵、酿造与猪灵交易提供不同的备战路线。
- **通关后**　末影龙倒下后，村庄可派出三种耗时 3、7、12 分钟的远征。潜影壳可用于仓储与鞘翅，村长、信标与群岛远征共同解锁方块纪元纪念碑。

## 存档和离线进度

浏览器自动保存，也可在设置中导出或载入 JSON 备份。存档 key 为 `block-idle-save`，版本 3 沿用旧版物品和进度 ID，并兼容迁移旧地名和进行中的熔炼。旧存档从升级时开始记录离线时间。

每次离开最多结算 8 小时。离线时，作物成熟、村民生产与迁入、红石产线、熔炉和已出发的远征继续推进，受原料、燃料、口粮与仓储限制。玩家战斗暂停，离线过程不会触发袭击。回到游戏后可以查看净物资变化、迁入人口和远征结果。

## UI

按钮、卡片、标签页、进度条、HUD 和弹窗来自 [grasscn](https://github.com/nicognaW/grasscn)，按其 shadcn 注册表的源码分发方式放在 `src/components/minecraft` 中，不存在名为 grasscn 的运行时 npm 依赖。所需 Base UI、CVA、React Is 等依赖已锁定。

`registry-lock.json` 记录本次注册表 URL、下载日期和 SHA-256；MIT 许可保留在同目录的 `LICENSE`。组件保留 grasscn 的纹理、音效和 Base UI 交互；utils 导入路径已调整。按钮、标签页、卡片和弹窗文本改用普通 DOM 渲染，统一采用 Fusion Pixel，避免原版位图/Canvas 字形覆盖字体。应用最小字号为 14px（text-sm），布局适配集中在 `src/styles.css`，冷却逻辑仍在 `src/ui/kit.tsx`。左右侧栏的滚动区独立于纹理背景，滚动只移动内容。

## Minecraft 数据与资源

中文名称参考 [中文 Minecraft Wiki](https://zh.minecraft.wiki/)，包括红石粉、末影珍珠、末影之眼、烈焰人、末影人、末影龙、下界要塞等。本次环境访问 Wiki 被站点验证阻挡，未批量复制 Wiki 的文字或图片。

界面优先使用物品栏图标。白色床、盾牌和方块等使用从游戏内导出的物品栏图像，对战生物使用对应的全身模型渲染图。运行时从本地加载 PNG，`public/textures/minecraft/sources.json` 记录每张图的来源。Minecraft 贴图的权利归 Mojang/Microsoft 所有，grasscn 的 MIT 许可适用于组件源码。

- 原版贴图和界面资源来自 [Minecraft 1.21.4 资源镜像](https://github.com/InventivetalentDev/minecraft-assets/tree/1.21.4/assets/minecraft/textures) 和 [Mojang 的 Bedrock 示例资源包](https://github.com/Mojang/bedrock-samples/tree/15701fa9c13923f12662984c32c124327e40e3d3/resource_pack/textures/ui)。
- 物品栏渲染图来自 [Minecraft Item Gallery 的 Java 1.21.1 增强版图集](https://mcitemgallery.com/docs/)。
- 生物与末地船使用 [Minecraft Wiki 的模型渲染](https://minecraft.wiki/w/Help:Isometric_renders)。烈焰人使用原动画的首帧。下界门图标由原版传送门动画首帧和黑曜石边框组合而成。

`src/game/data.ts` 管理物品、配方、熔炼、掉落与交易，`src/game/progression.ts` 管理季节、定向路线、红石加工和远征。物品和生物采用各自的图标，游戏自定义建筑和岗位使用关联的原版方块、工具或生物。目标与成就共用这些图标，并按名词类别着色。

这是放置玩法改编，不是原版生存模拟：行动冷却、战斗数值、经验、建筑成本、声望、职业自动生产和进入维度的流程仍采用本项目规则。建筑和自定义岗位使用相关方块/工具作为图标。

## 验证

`pnpm test` 检查所有静态图标的 PNG 文件、配方/掉落/交易引用、肉类与木炭映射以及存档迁移的幂等性。`pnpm build` 运行 TypeScript 检查及生产打包。

浏览器验收可覆盖从新存档进入末地、末地远征与纪念碑、后台恢复时的离线结算、旧存档恢复、导出后重置再载入，以及桌面与 390px 窄屏的界面布局。

开发环境在 **设置 → Debug** 提供五种预设场景。进入后可补充物资、清除冷却，并模拟离线 5 分钟、1 小时或 9 小时，用于核对收益与 8 小时上限。调试进度只存在于当前页面的临时存档，退出 Debug 或刷新后回到正常存档。


## HUD 与主区域布局

玩家状态使用 [grasscn HUD](https://grasscn.dev/docs/components/hud) 的 HealthMeter、HungerMeter、ArmorMeter 和 ExperienceBar。经验以当前经验/升级所需经验映射到 0–1；防御沿用本项目数值，图标上限 20，文字显示实际值。

Card 用于外层面板，主区域条目按内容调整高度。条目操作通常放在卡片右上角，熔炼的批量按钮在条目底部。地图的移动入口固定为两列，探索可用时排在首位。其他条目和行动网格按可用宽度调整列数。主区域内部滚动，界面使用 Fusion Pixel，最小字号为 14px。

主区域及左右侧栏通过 `ScrollArea` 隐藏原生滚动条；顶部/底部仅在对应方向仍有内容时显示 22px 渐隐。滚动、内容变化和容器尺寸变化都会刷新提示。外层纹理边框保持不动，滚轮、触摸及键盘滚动照常可用。
