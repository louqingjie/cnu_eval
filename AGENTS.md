1. **版本管理**: 每次修改必须更新 `@version`（如 `2.6` → `2.7`），否则 Greasy Fork / ScriptCat 不会自动同步，修改部分包括脚本代码中的版本和 README.md 中的版本号以及更新日志
2. **URL 变化**: 教务系统使用 Struts2 框架，URL 格式为 `actionName!methodName.action`，注意 `!` 符号
3. **iframe 嵌套**: 首页的评教内容在 iframe 中加载，`@match` 需同时覆盖 `homeExt*` 和 `quality/*`
