# 方块纪元

基于 React、Vite 和 Zustand 的 Minecraft 题材放置游戏。

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
```

测试需要支持 TypeScript 类型擦除的 Node.js（22.18+）。

## UI

按钮、卡片、标签页、进度条、HUD 和弹窗来自 [grasscn](https://github.com/nicognaW/grasscn)，按其 shadcn 注册表的源码分发方式放在 `src/components/minecraft` 中，不存在名为 grasscn 的运行时 npm 依赖。所需 Base UI、CVA、React Is 等依赖已锁定。

`registry-lock.json` 记录本次注册表 URL、下载日期和 SHA-256；MIT 许可保留在同目录的 `LICENSE`。组件保留 grasscn 的纹理、音效和 Base UI 交互；utils 导入路径已调整。按钮、标签页、卡片和弹窗文本改用普通 DOM 渲染，统一采用 Fusion Pixel，避免原版位图/Canvas 字形覆盖字体。应用最小字号为 14px（text-sm），布局适配集中在 `src/styles.css`，冷却逻辑仍在 `src/ui/kit.tsx`。左右侧栏的滚动区独立于纹理背景，滚动只移动内容。

## Minecraft 数据与资源

中文名称参考 [中文 Minecraft Wiki](https://zh.minecraft.wiki/)，包括红石粉、末影珍珠、末影之眼、烈焰人、末影人、末影龙、下界要塞等。本次环境访问 Wiki 被站点验证阻挡，未批量复制 Wiki 的文字或图片。

界面优先使用物品栏图标。白色床、盾牌和方块等使用从游戏内导出的物品栏图像，对战生物使用对应的全身模型渲染图。运行时从本地加载 PNG，`public/textures/minecraft/sources.json` 记录每张图的来源。Minecraft 贴图的权利归 Mojang/Microsoft 所有，grasscn 的 MIT 许可适用于组件源码。

- 原版贴图和界面资源来自 [Minecraft 1.21.4 资源镜像](https://github.com/InventivetalentDev/minecraft-assets/tree/1.21.4/assets/minecraft/textures) 和 [Mojang 的 Bedrock 示例资源包](https://github.com/Mojang/bedrock-samples/tree/15701fa9c13923f12662984c32c124327e40e3d3/resource_pack/textures/ui)。
- 物品栏渲染图来自 [Minecraft Item Gallery 的 Java 1.21.1 增强版图集](https://mcitemgallery.com/docs/)。
- 对战图来自 [Minecraft Wiki 的生物模型渲染](https://minecraft.wiki/w/Help:Isometric_renders)，烈焰人使用原动画的首帧。

`src/game/data.ts` 管理物品、配方、熔炼、掉落与交易；65 种物品包含猪排、牛肉、羊肉各自的生熟形态、鳕鱼和木炭。修正了原木烧木炭、胸甲材料数和地图指南针材料等明显不对应的内容。

这是放置玩法改编，不是原版生存模拟：行动冷却、战斗数值、经验、建筑成本、声望、职业自动生产和进入维度的流程仍采用本项目规则。建筑和自定义岗位使用相关方块/工具作为图标。

存档 key 保持 `block-idle-save`，物品和进度内部 ID 保持兼容；版本 2 自动替换旧存档地点、日志和战斗文字中的旧名称，不清空库存、任务进度或正在进行的熔炼。

## 验证

`pnpm test` 检查所有静态图标的 PNG 文件、配方/掉落/交易引用、肉类与木炭映射以及存档迁移的幂等性。`pnpm build` 运行 TypeScript 检查及生产打包。

浏览器验收覆盖设置弹窗、制造/熔炉/村庄标签切换、原木熔炼木炭、贴图加载和 390px 窄屏横向溢出检查。已验证桌面与 390px 窄屏各页面的可见文字使用 Fusion Pixel 且不小于 14px，以及两侧栏滚动到底后纹理背景保持固定。原版 Unicode 字形渲染已移除，构建不再加载其数据块；Vite 仍可能提示主 JS chunk 体积警告。


## HUD 与主区域布局

玩家状态使用 [grasscn HUD](https://grasscn.dev/docs/components/hud) 的 HealthMeter、HungerMeter、ArmorMeter 和 ExperienceBar。经验以当前经验/升级所需经验映射到 0–1；防御沿用本项目数值，图标上限 20，文字显示实际值。

Card 仅用于外层面板；主区域记录改用轻量 article，弹窗使用自身背景。常规条目高度为 224px，背包条目为 112px，岗位条目为 144px；网格以 280px 为最小目标列宽，自适应列数并均分整行宽度。行动按钮高度统一为 80px，以 144px 为最小目标列宽建立等宽网格；条目底部操作按钮高度为 36px，以 72px 为最小目标列宽排列。所有网格保留空列：少量按钮不拉伸填满整行，多行时列宽相同、上下对齐，完整行铺满可用宽度。窄屏下自动减少列数。主区域仍为固定高度、内部滚动；保留 Fusion Pixel 与最小 14px 字号。

主区域及左右侧栏通过 `ScrollArea` 隐藏原生滚动条；顶部/底部仅在对应方向仍有内容时显示 22px 渐隐。滚动、内容变化和容器尺寸变化都会刷新提示。外层纹理边框保持不动，滚轮、触摸及键盘滚动照常可用。
