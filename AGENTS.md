1. **版本管理**: 每次修改必须更新 `@version`（如 `2.6` → `2.7`），否则 Greasy Fork / ScriptCat 不会自动同步，修改部分包括脚本代码中的版本和 README.md 中的版本号以及更新日志
2. **URL 变化**: 教务系统使用 Struts2 框架，URL 格式为 `actionName!methodName.action`，注意 `!` 符号
3. **iframe 嵌套**: 首页的评教内容在 iframe 中加载，`@match` 需同时覆盖 `homeExt*` 和 `quality/*`
4. **顶层窗口**: `homeExt` 页面有多层 iframe，面板只在 `window.top === window.self` 时创建，避免重复
5. **模板字符串**: `panel.innerHTML` 中引用的变量（如 `cfg`、`pool`）必须在模板字符串之前定义，否则报 `ReferenceError`
6. **confirm 劫持**: 必须在 `document-start` 时用 `Object.defineProperty(window, "confirm", { get: () => () => true })` 锁定，因为简单赋值可能被页面缓存绕过。如 Edge 仍失效，改用 `setInterval(() => { window.confirm = () => true }, 50)` 持续保活
7. **README 同步**: 每次改版本号必须同步更新 README.md 的 badge 和更新日志，不可遗漏