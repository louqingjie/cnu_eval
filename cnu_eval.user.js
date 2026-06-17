// ==UserScript==
// @name         首都师范大学 量化评教 自动评教
// @namespace    https://github.com/louqingjie/cnu_eval
// @version      2.6
// @description  一键自动完成首都师范大学量化评教，支持自定义分数、随机评语池，全自动批量处理
// @author       louqingjie
// @license      MIT
// @match        https://urp.cnu.edu.cn/eams/quality/*
// @match        https://urp.cnu.edu.cn/eams/homeExt*
// @icon         https://urp.cnu.edu.cn/favicon.ico
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-end
// @supportURL   https://github.com/louqingjie/cnu_eval/issues
// @homepageURL  https://github.com/louqingjie/cnu_eval
// @downloadURL  https://update.greasyfork.org/scripts/583109/%E9%A6%96%E9%83%BD%E5%B8%88%E8%8C%83%E5%A4%A7%E5%AD%A6%20%E9%87%8F%E5%8C%96%E8%AF%84%E6%95%99%20%E8%87%AA%E5%8A%A8%E8%AF%84%E6%95%99.user.js
// @updateURL    https://update.greasyfork.org/scripts/583109/%E9%A6%96%E9%83%BD%E5%B8%88%E8%8C%83%E5%A4%A7%E5%AD%A6%20%E9%87%8F%E5%8C%96%E8%AF%84%E6%95%99%20%E8%87%AA%E5%8A%A8%E8%AF%84%E6%95%99.meta.js
// @supportURL   https://scriptcat.org/zh-CN/script-show-page/6690
// ==/UserScript==

(function () {
    "use strict";

    // ==================== 配置（默认值） ====================
    const DEFAULTS = {
        teachingScore: 5,     // 教学评分: 5=很好, 4=好, 3=较好, 2=一般, 1=较差
        contentDifficulty: 3, // 课程难度: 3=适中, 2=较浅, 1=过浅, 4=较深, 5=过深
        satisfactionScore: 5, // 满意度:   5=很满意, 4=满意, 3=基本满意, 2=不满意, 1=很不满意
        autoSubmit: true,     // 是否自动提交
        improvementSuggestion: "无",
        useRandomComment: true, // 是否从评语池随机选取
        // 评语池（每次评教随机选取一条填入）
        commentPool: [
            "教学认真负责，讲解清晰，注重互动",
            "课堂氛围活跃，老师善于引导学生思考",
            "教学内容充实，重点突出，讲解透彻",
            "老师备课充分，讲课富有激情，感染力强",
            "注重理论与实践结合，教学效果显著",
            "耐心解答学生问题，课后辅导及时到位",
            "课程安排合理，循序渐进，易于理解",
            "教学方法多样，善于运用案例教学",
            "关心学生成长，既教书又育人",
            "课堂管理规范，教学态度严谨认真",
        ],
    };

    // ==================== 样式 ====================
    GM_addStyle(`
        #cnu-panel {
            all: initial;
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 999999;
            background: #fff;
            border: 2px solid #1a73e8;
            border-radius: 12px;
            padding: 18px 20px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.2);
            font-family: "Microsoft YaHei", -apple-system, sans-serif !important;
            font-size: 14px !important;
            width: 230px;
            color: #333;
        }
        #cnu-panel * { all: revert; box-sizing: border-box; }
        #cnu-panel h3 {
            margin: 0 0 12px 0 !important;
            font-size: 16px !important;
            color: #1a73e8 !important;
            text-align: center !important;
            border-bottom: 1px solid #eee !important;
            padding-bottom: 8px !important;
        }
        #cnu-panel .row {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin: 6px 0 !important;
        }
        #cnu-panel .row label { font-size: 13px !important; color: #555 !important; }
        #cnu-panel .row select {
            width: 72px !important;
            padding: 3px 4px !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            font-size: 12px !important;
            background: #fff !important;
        }
        #cnu-panel .row input[type="checkbox"] { margin: 0 !important; }
        #cnu-panel .btn {
            display: block !important;
            width: 100% !important;
            margin-top: 8px !important;
            padding: 8px 0 !important;
            border: none !important;
            border-radius: 6px !important;
            font-size: 14px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            transition: background 0.2s, opacity 0.2s !important;
        }
        #cnu-panel .btn-primary { background: #1a73e8 !important; color: #fff !important; }
        #cnu-panel .btn-primary:hover { background: #1557b0 !important; }
        #cnu-panel .btn-primary:disabled { background: #999 !important; cursor: not-allowed !important; }
        #cnu-panel .btn-success { background: #0f9d58 !important; color: #fff !important; }
        #cnu-panel .status {
            margin-top: 8px !important;
            font-size: 12px !important;
            color: #666 !important;
            text-align: center !important;
            line-height: 1.5 !important;
            max-height: 100px !important;
            overflow-y: auto !important;
        }
        #cnu-panel .progress-wrap {
            height: 4px !important;
            background: #e0e0e0 !important;
            border-radius: 2px !important;
            margin-top: 8px !important;
            overflow: hidden !important;
        }
        #cnu-panel .progress-bar {
            height: 100% !important;
            background: #1a73e8 !important;
            width: 0% !important;
            transition: width 0.3s !important;
            border-radius: 2px !important;
        }
        #cnu-panel .close-btn {
            position: absolute !important;
            top: 6px !important;
            right: 10px !important;
            cursor: pointer !important;
            font-size: 18px !important;
            color: #999 !important;
            border: none !important;
            background: none !important;
            line-height: 1 !important;
        }
        #cnu-panel .close-btn:hover { color: #333 !important; }
        .cnu-success { color: #0f9d58 !important; font-weight: bold !important; }
        .cnu-error  { color: #d93025 !important; }

        /* 单页评教的快捷按钮 */
        #cnu-quick-eval {
            all: initial;
            position: fixed !important;
            top: 12px !important;
            right: 12px !important;
            z-index: 99999 !important;
            padding: 10px 20px !important;
            background: #1a73e8 !important;
            color: #fff !important;
            border: none !important;
            border-radius: 8px !important;
            font-size: 15px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            box-shadow: 0 4px 16px rgba(26,115,232,0.3) !important;
            font-family: "Microsoft YaHei", -apple-system, sans-serif !important;
            transition: all 0.2s !important;
        }
        #cnu-quick-eval:hover { background: #1557b0 !important; transform: translateY(-1px) !important; }
        #cnu-quick-eval:active { transform: translateY(0) !important; }
    `);

    // ==================== 工具函数 ====================

    function loadConfig() {
        const cfg = {};
        for (const [key, val] of Object.entries(DEFAULTS)) {
            cfg[key] = GM_getValue(key, val);
        }
        return cfg;
    }

    function saveConfig(config) {
        for (const [key, val] of Object.entries(config)) {
            GM_setValue(key, val);
        }
    }

    function getPendingLinks() {
        return Array.from(document.querySelectorAll('a[href*="stdEvaluate!answer.action"]'))
            .filter(a => a.textContent.includes("进行评教"));
    }

    function getQuestionText(radio) {
        const li = radio.closest("li");
        if (!li) return "";
        const ul = li.closest("ul");
        if (!ul) return "";
        const heading = ul.previousElementSibling;
        return heading?.textContent?.trim() || "";
    }

    function getTargetIndex(questionText, config) {
        if (questionText.includes("5.1")) {
            const map = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };
            return map[config.contentDifficulty] ?? 2;
        }
        if (questionText.includes("5.2")) {
            return Math.max(0, Math.min(4, config.satisfactionScore - 1));
        }
        return Math.max(0, Math.min(4, config.teachingScore - 1));
    }

    // ==================== 评教填写 ====================

    function fillEvaluation(config) {
        const groups = new Map();
        document.querySelectorAll('input[type="radio"]').forEach(r => {
            const name = r.name;
            if (!groups.has(name)) groups.set(name, []);
            groups.get(name).push(r);
        });

        const groupList = Array.from(groups.values());
        if (groupList.length === 0) return { success: false, reason: "未找到评教题目" };

        groupList.forEach(group => {
            const qText = group.length > 0 ? getQuestionText(group[0]) : "";
            const idx = getTargetIndex(qText, config);
            const target = group[Math.min(idx, group.length - 1)];
            if (target) target.checked = true;
        });

        // 文本框
        const t = document.querySelectorAll("textarea");
        if (t.length >= 1) {
            // 从评语池中随机选一条
            const pool = config.commentPool || DEFAULTS.commentPool;
            const comment = config.useRandomComment && pool.length > 0
                ? pool[Math.floor(Math.random() * pool.length)]
                : (pool[0] || "教学认真负责，讲解清晰，注重互动");
            t[0].value = comment;
            t[0].dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (t.length >= 2 && config.improvementSuggestion) {
            t[1].value = config.improvementSuggestion;
            t[1].dispatchEvent(new Event("input", { bubbles: true }));
        }

        return { success: true, commentUsed: t.length >= 1 ? t[0].value : "" };
    }

    /** 拦截 window.confirm，自动返回 true，弹窗不会出现 */
    function hijackConfirm() {
        const originalConfirm = window.confirm;
        window.confirm = () => true;
        // 也给一层 setTimeout 保护，防止页面异步调用
        const handler = setInterval(() => {
            if (window.confirm !== originalConfirm) return;
            window.confirm = () => true;
        }, 100);
        // 5秒后停止劫持，避免影响其他页面
        setTimeout(() => {
            clearInterval(handler);
            window.confirm = originalConfirm;
        }, 5000);
    }

    function clickSubmit() {
        hijackConfirm();
        // 用 id="sub" 找提交按钮（经验证该方式最可靠）
        const btn = document.getElementById('sub')
            || document.querySelector('input[value="提交"]')
            || document.querySelector('button[type="submit"], input[type="submit"]');
        if (btn) {
            // 使用 dispatchEvent 触发原生点击事件（比 .click() 更可靠）
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            return true;
        }
        return false;
    }

    /** 评语管理弹窗 */
    function showCommentManager() {
        const cfg = loadConfig();
        let pool = cfg.commentPool ? [...cfg.commentPool] : [...DEFAULTS.commentPool];

        const overlay = document.createElement("div");
        overlay.id = "cnu-comment-overlay";
        overlay.style.cssText =
            "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);" +
            "z-index:9999998;display:flex;align-items:center;justify-content:center;";

        const box = document.createElement("div");
        box.style.cssText =
            "background:#fff;border-radius:12px;padding:20px 24px;width:500px;max-width:90vw;" +
            "max-height:80vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,0.25);" +
            "font-family:Microsoft YaHei,sans-serif;";

        box.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h3 style="margin:0;font-size:16px;color:#1a73e8;">📝 评语池管理</h3>
                <button id="cnu-close-comment" style="border:none;background:none;font-size:20px;cursor:pointer;color:#999;">✕</button>
            </div>
            <p style="margin:0 0 10px;font-size:12px;color:#999;">
                评语列表（每课次随机选一条填入），共 <span id="cnu-pool-total">${pool.length}</span> 条
            </p>
            <div id="cnu-comment-list" style="flex:1;overflow-y:auto;border:1px solid #e0e0e0;border-radius:6px;padding:8px;min-height:150px;">
                ${pool.map((text, i) => `
                    <div class="cnu-comment-item" data-idx="${i}" style="display:flex;align-items:center;gap:6px;margin:4px 0;padding:4px;border-radius:4px;background:#f8f9fa;">
                        <span style="font-size:12px;color:#999;min-width:20px;">${i + 1}.</span>
                        <input type="text" value="${text.replace(/"/g, '&quot;')}"
                               style="flex:1;border:1px solid #ddd;border-radius:4px;padding:4px 8px;font-size:13px;">
                        <button class="cnu-del-comment" style="border:none;background:#fce8e6;color:#d93025;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:13px;">✕</button>
                    </div>
                `).join("")}
            </div>
            <div style="display:flex;gap:8px;margin-top:10px;">
                <button id="cnu-add-comment" style="flex:1;border:1px dashed #1a73e8;background:#fff;color:#1a73e8;border-radius:6px;padding:6px;cursor:pointer;font-size:13px;">＋ 添加评语</button>
                <button id="cnu-reset-comment" style="border:1px solid #ddd;background:#fff;color:#666;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:13px;">↺ 重置</button>
                <button id="cnu-save-comment" style="border:none;background:#1a73e8;color:#fff;border-radius:6px;padding:6px 16px;cursor:pointer;font-size:13px;font-weight:bold;">保存</button>
            </div>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // 关闭
        document.getElementById("cnu-close-comment").onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        // 删除评语
        box.querySelectorAll(".cnu-del-comment").forEach(btn => {
            btn.onclick = function () {
                const item = this.closest(".cnu-comment-item");
                item.remove();
                updateCount();
            };
        });

        // 添加评语
        document.getElementById("cnu-add-comment").onclick = () => {
            const list = document.getElementById("cnu-comment-list");
            const items = list.querySelectorAll(".cnu-comment-item");
            const idx = items.length;
            const item = document.createElement("div");
            item.className = "cnu-comment-item";
            item.style.cssText = "display:flex;align-items:center;gap:6px;margin:4px 0;padding:4px;border-radius:4px;background:#f0f7ff;";
            item.innerHTML = `
                <span style="font-size:12px;color:#999;min-width:20px;">${idx + 1}.</span>
                <input type="text" value="请输入评语..."
                       style="flex:1;border:1px solid #ddd;border-radius:4px;padding:4px 8px;font-size:13px;"
                       onfocus="this.value=''">
                <button class="cnu-del-comment" style="border:none;background:#fce8e6;color:#d93025;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:13px;">✕</button>
            `;
            list.appendChild(item);
            item.querySelector(".cnu-del-comment").onclick = function () {
                item.remove();
                updateCount();
            };
            updateCount();
        };

        // 重置
        document.getElementById("cnu-reset-comment").onclick = () => {
            if (!confirm("重置将恢复默认评语池，确定？")) return;
            const list = document.getElementById("cnu-comment-list");
            list.innerHTML = DEFAULTS.commentPool.map((text, i) => `
                <div class="cnu-comment-item" style="display:flex;align-items:center;gap:6px;margin:4px 0;padding:4px;border-radius:4px;background:#f8f9fa;">
                    <span style="font-size:12px;color:#999;min-width:20px;">${i + 1}.</span>
                    <input type="text" value="${text}"
                           style="flex:1;border:1px solid #ddd;border-radius:4px;padding:4px 8px;font-size:13px;">
                    <button class="cnu-del-comment" style="border:none;background:#fce8e6;color:#d93025;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:13px;">✕</button>
                </div>
            `).join("");
            box.querySelectorAll(".cnu-del-comment").forEach(btn => {
                btn.onclick = function () {
                    this.closest(".cnu-comment-item").remove();
                    updateCount();
                };
            });
            updateCount();
        };

        // 保存
        document.getElementById("cnu-save-comment").onclick = () => {
            const inputs = box.querySelectorAll("#cnu-comment-list input[type='text']");
            const newPool = [];
            inputs.forEach(inp => {
                const val = inp.value.trim();
                if (val && val !== "请输入评语...") newPool.push(val);
            });
            if (newPool.length === 0) {
                alert("评语池不能为空！");
                return;
            }
            const saved = loadConfig();
            saved.commentPool = newPool;
            saveConfig(saved);
            const countEl = document.getElementById("cnu-pool-count");
            if (countEl) countEl.textContent = `📝 ${newPool.length}条`;
            overlay.remove();
        };

        function updateCount() {
            const items = box.querySelectorAll("#cnu-comment-list .cnu-comment-item");
            const totalEl = document.getElementById("cnu-pool-total");
            if (totalEl) totalEl.textContent = items.length;
            items.forEach((item, i) => {
                const span = item.querySelector("span:first-child");
                if (span) span.textContent = `${i + 1}.`;
            });
        }
    }

    // ==================== 列表页面 - 批量面板 ====================

    function createBatchPanel() {
        if (_panelCreated) return;
        _panelCreated = true;
        const links = getPendingLinks();
        const panel = document.createElement("div");
        panel.id = "cnu-panel";
        panel.innerHTML = `
            <button class="close-btn" id="cnu-close">✕</button>
            <h3>📊 批量评教</h3>
            <div class="row">
                <label>教学评分</label>
                <select id="cnu-s-teach">
                    <option value="5">很好</option>
                    <option value="4">好</option>
                    <option value="3">较好</option>
                    <option value="2">一般</option>
                    <option value="1">较差</option>
                </select>
            </div>
            <div class="row">
                <label>课程难度</label>
                <select id="cnu-s-diff">
                    <option value="3">适中</option>
                    <option value="4">较深</option>
                    <option value="5">过深</option>
                    <option value="2">较浅</option>
                    <option value="1">过浅</option>
                </select>
            </div>
            <div class="row">
                <label>满意度</label>
                <select id="cnu-s-sat">
                    <option value="5">很满意</option>
                    <option value="4">满意</option>
                    <option value="3">基本满意</option>
                    <option value="2">不满意</option>
                    <option value="1">很不满意</option>
                </select>
            </div>
            <div class="row" style="justify-content:flex-start !important;gap:6px !important;">
                <input type="checkbox" id="cnu-s-autosubmit" checked>
                <label for="cnu-s-autosubmit">自动提交</label>
            </div>
            <div class="row" style="justify-content:flex-start !important;gap:6px !important;">
                <input type="checkbox" id="cnu-s-random">
                <label for="cnu-s-random">随机评语</label>
                <span id="cnu-pool-count" style="font-size:11px;color:#999;cursor:pointer;"
                      title="点击管理评语池">📝 ${cfg.commentPool?.length || 10}条</span>
            </div>
            <button class="btn btn-primary" id="cnu-start-btn">
                🚀 开始批量评教 (${links.length})
            </button>
            <div class="status" id="cnu-status">📌 共 ${links.length} 位教师待评教</div>
            <div class="progress-wrap">
                <div class="progress-bar" id="cnu-progress"></div>
            </div>
        `;
        document.body.appendChild(panel);

        // 恢复配置
        const cfg = loadConfig();
        const teachSel = document.getElementById("cnu-s-teach");
        const diffSel = document.getElementById("cnu-s-diff");
        const satSel = document.getElementById("cnu-s-sat");
        const autoCb = document.getElementById("cnu-s-autosubmit");
        const randomCb = document.getElementById("cnu-s-random");
        const poolCount = document.getElementById("cnu-pool-count");
        if (teachSel) teachSel.value = cfg.teachingScore;
        if (diffSel) diffSel.value = cfg.contentDifficulty;
        if (satSel) satSel.value = cfg.satisfactionScore;
        if (autoCb) autoCb.checked = cfg.autoSubmit;
        if (randomCb) randomCb.checked = cfg.useRandomComment !== false;
        if (poolCount) poolCount.textContent = `📝 ${(cfg.commentPool || DEFAULTS.commentPool).length}条`;

        // 评语管理弹窗
        if (poolCount) poolCount.onclick = () => showCommentManager();

        document.getElementById("cnu-close").onclick = () => panel.remove();

        document.getElementById("cnu-start-btn").onclick = () => {
            const saved = loadConfig();
            const config = {
                teachingScore: parseInt(document.getElementById("cnu-s-teach").value),
                contentDifficulty: parseInt(document.getElementById("cnu-s-diff").value),
                satisfactionScore: parseInt(document.getElementById("cnu-s-sat").value),
                autoSubmit: document.getElementById("cnu-s-autosubmit").checked,
                useRandomComment: document.getElementById("cnu-s-random").checked,
                improvementSuggestion: DEFAULTS.improvementSuggestion,
                commentPool: saved.commentPool || DEFAULTS.commentPool,
            };
            saveConfig(config);
            startBatchEval(config);
        };
    }

    function startBatchEval(config) {
        const allLinks = getPendingLinks();
        if (allLinks.length === 0) {
            const st = document.getElementById("cnu-status");
            if (st) st.innerHTML = "✅ 没有待评教的课程！";
            return;
        }

        const batchState = {
            urls: allLinks.map(a => a.href),
            current: 0,
            total: allLinks.length,
            config: config,
        };
        localStorage.setItem("cnu_batch_eval", JSON.stringify(batchState));
        window.location.href = batchState.urls[0];
    }

    // ==================== 评教页面逻辑 ====================

    function handleEvalPage() {
        const batchRaw = localStorage.getItem("cnu_batch_eval");
        const isBatch = batchRaw ? JSON.parse(batchRaw) : null;

        let config = loadConfig();
        let autoSubmit = config.autoSubmit;

        if (isBatch) {
            config = { ...config, ...isBatch.config };
            autoSubmit = config.autoSubmit;
        }

        // 添加按钮
        const btn = document.createElement("button");
        btn.id = "cnu-quick-eval";
        btn.textContent = isBatch
            ? `⏩ 批量评教中 [${isBatch.current + 1}/${isBatch.total}]`
            : "⭐ 一键评教（随机评语）";
        document.body.appendChild(btn);

        // 创建取消按钮（初始隐藏）
        const cancelBtn = document.createElement("button");
        cancelBtn.id = "cnu-cancel-btn";
        cancelBtn.textContent = "✕ 取消提交";
        cancelBtn.style.cssText =
            "position:fixed;top:60px;right:12px;z-index:99999;" +
            "padding:6px 14px;background:#d93025;color:#fff;border:none;border-radius:6px;" +
            "font-size:13px;cursor:pointer;display:none;font-family:Microsoft YaHei,sans-serif;" +
            "box-shadow:0 2px 8px rgba(0,0,0,0.2);";
        document.body.appendChild(cancelBtn);

        let countdownTimer = null;
        let cancelled = false;

        btn.onclick = function () {
            // 先填表
            const result = fillEvaluation(config);
            if (!result.success) {
                btn.textContent = "❌ " + result.reason;
                btn.style.background = "#d93025";
                btn.disabled = true;
                return;
            }

            // 显示评语内容
            const comment = result.commentUsed || "";
            btn.textContent = `⏳ 即将提交 (3s)...`;
            btn.style.background = "#f9ab00";
            btn.disabled = true;
            cancelBtn.style.display = "block";
            cancelled = false;

            let remain = 3;
            countdownTimer = setInterval(() => {
                remain--;
                btn.textContent = `⏳ 即将提交 (${remain}s)...`;
                if (remain <= 0) {
                    clearInterval(countdownTimer);
                    countdownTimer = null;
                    doSubmit();
                }
            }, 1000);

            function doSubmit() {
                if (cancelled) return;
                cancelBtn.style.display = "none";

                // 提交前更新批量状态（提交后页面会重新加载，计时器会丢失）
                if (isBatch) {
                    const state = JSON.parse(localStorage.getItem("cnu_batch_eval"));
                    if (state) {
                        state.current++;
                        localStorage.setItem("cnu_batch_eval", JSON.stringify(state));
                        localStorage.setItem("cnu_batch_advance", "true");
                    }
                }

                const clicked = clickSubmit();
                btn.textContent = clicked ? "✅ 已提交！" : "⚠️ 请手动提交";
                btn.style.background = clicked ? "#0f9d58" : "#d93025";
                btn.disabled = true;
            }
        };

        cancelBtn.onclick = function () {
            cancelled = true;
            if (countdownTimer) {
                clearInterval(countdownTimer);
                countdownTimer = null;
            }
            btn.textContent = "⏹ 已取消，可检查后手动提交";
            btn.style.background = "#666";
            btn.disabled = true;
            cancelBtn.style.display = "none";
        };

        // 批量模式自动点击
        if (isBatch) {
            setTimeout(() => btn.click(), 1000);
        }
    }

    // ==================== 初始化 ====================

    function init() {
        const url = window.location.href;

        if (url.includes("stdEvaluate!finishAnswer")) {
            // 提交后的过渡页面，无需处理，等重定向到列表页即可
            return;
        }

        if (url.includes("stdEvaluate!answer.action")) {
            // 评教填写页面
            handleEvalPage();
        } else if (url.includes("stdEvaluate.action") || url.includes("stdEvaluate!main") || url.includes("stdEvaluate!innerIndex")) {
            // 评教列表页面（直接访问或在 iframe 中）

            // 检测是否刚从评教页面提交返回，需要继续批量处理
            const advance = localStorage.getItem("cnu_batch_advance");
            if (advance === "true") {
                localStorage.removeItem("cnu_batch_advance");
                const batchRaw = localStorage.getItem("cnu_batch_eval");
                if (batchRaw) {
                    const state = JSON.parse(batchRaw);
                    if (state.current < state.total) {
                        // 还有下一个，直接跳转
                        window.location.href = state.urls[state.current];
                        return;
                    } else {
                        // 全部完成
                        localStorage.removeItem("cnu_batch_eval");
                        setTimeout(() => showCompletion(state.total), 500);
                        return;
                    }
                }
            }

            const batchRaw = localStorage.getItem("cnu_batch_eval");
            if (batchRaw) {
                const state = JSON.parse(batchRaw);
                if (state.current >= state.total) {
                    localStorage.removeItem("cnu_batch_eval");
                    setTimeout(() => showCompletion(state.total), 500);
                    return;
                }
                window.location.href = state.urls[state.current];
                return;
            }
            setTimeout(createBatchPanel, 800);
        } else if (url.includes("homeExt")) {
            // 首页 - 直接显示评教面板，点击后打开新标签页执行
            setTimeout(createHomePanel, 800);
            tryInjectIntoIframe();
        }
    }

    let _panelCreated = false; // 全局防重复标志

    /** 首页：直接显示完整的评教配置面板 */
    function createHomePanel() {
        if (_panelCreated) return;
        _panelCreated = true;
        const panel = document.createElement("div");
        panel.id = "cnu-panel";
        const cfg = loadConfig();
        const pool = cfg.commentPool || DEFAULTS.commentPool;
        panel.innerHTML = `
            <button class="close-btn" id="cnu-close">✕</button>
            <h3>📊 量化评教</h3>
            <div class="row">
                <label>教学评分</label>
                <select id="cnu-s-teach">
                    <option value="5">很好</option>
                    <option value="4">好</option>
                    <option value="3">较好</option>
                    <option value="2">一般</option>
                    <option value="1">较差</option>
                </select>
            </div>
            <div class="row">
                <label>课程难度</label>
                <select id="cnu-s-diff">
                    <option value="3">适中</option>
                    <option value="4">较深</option>
                    <option value="5">过深</option>
                    <option value="2">较浅</option>
                    <option value="1">过浅</option>
                </select>
            </div>
            <div class="row">
                <label>满意度</label>
                <select id="cnu-s-sat">
                    <option value="5">很满意</option>
                    <option value="4">满意</option>
                    <option value="3">基本满意</option>
                    <option value="2">不满意</option>
                    <option value="1">很不满意</option>
                </select>
            </div>
            <div class="row" style="justify-content:flex-start !important;gap:6px !important;">
                <input type="checkbox" id="cnu-s-autosubmit" checked>
                <label for="cnu-s-autosubmit">自动提交</label>
            </div>
            <div class="row" style="justify-content:flex-start !important;gap:6px !important;">
                <input type="checkbox" id="cnu-s-random">
                <label for="cnu-s-random">随机评语</label>
                <span id="cnu-pool-count" style="font-size:11px;color:#999;cursor:pointer;"
                      title="点击管理评语池">📝 ${pool.length}条</span>
            </div>
            <button class="btn btn-primary" id="cnu-home-start-btn">
                🚀 打开评教并开始
            </button>
            <div class="status" id="cnu-status">💡 点击按钮将在新标签页打开评教</div>
        `;
        document.body.appendChild(panel);

        // 恢复配置
        const teachSel = document.getElementById("cnu-s-teach");
        const diffSel = document.getElementById("cnu-s-diff");
        const satSel = document.getElementById("cnu-s-sat");
        const autoCb = document.getElementById("cnu-s-autosubmit");
        const randomCb = document.getElementById("cnu-s-random");
        const poolCount = document.getElementById("cnu-pool-count");
        if (teachSel) teachSel.value = cfg.teachingScore;
        if (diffSel) diffSel.value = cfg.contentDifficulty;
        if (satSel) satSel.value = cfg.satisfactionScore;
        if (autoCb) autoCb.checked = cfg.autoSubmit;
        if (randomCb) randomCb.checked = cfg.useRandomComment !== false;
        if (poolCount) poolCount.textContent = `📝 ${pool.length}条`;
        if (poolCount) poolCount.onclick = () => showCommentManager();

        document.getElementById("cnu-close").onclick = () => panel.remove();

        document.getElementById("cnu-home-start-btn").onclick = () => {
            // 保存配置
            const saved = loadConfig();
            const config = {
                teachingScore: parseInt(document.getElementById("cnu-s-teach").value),
                contentDifficulty: parseInt(document.getElementById("cnu-s-diff").value),
                satisfactionScore: parseInt(document.getElementById("cnu-s-sat").value),
                autoSubmit: document.getElementById("cnu-s-autosubmit").checked,
                useRandomComment: document.getElementById("cnu-s-random").checked,
                improvementSuggestion: DEFAULTS.improvementSuggestion,
                commentPool: saved.commentPool || DEFAULTS.commentPool,
            };
            saveConfig(config);
            // 在新标签页打开评教列表，脚本会自动检测配置并开始
            window.open("https://urp.cnu.edu.cn/eams/quality/stdEvaluate.action", "_blank");
        };
    }

    /** 尝试在 iframe 中注入评教面板 */
    function tryInjectIntoIframe() {
        const iframes = document.querySelectorAll("iframe");
        iframes.forEach((iframe) => {
            try {
                const src = iframe.src || iframe.getAttribute("src") || "";
                if (!src.includes("quality") && !src.includes("stdEvaluate")) return;
                // iframe 已加载且同源，尝试注入
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc && iframeDoc.readyState === "complete") {
                    // 让 iframe 中的脚本来处理（脚本会通过 @match quality/* 自动运行）
                }
            } catch (e) {
                // 跨域 iframe，忽略
            }
        });
        // 每 2 秒检查一次是否有新 iframe 加载
        let checks = 0;
        const iv = setInterval(() => {
            checks++;
            if (checks > 15) { clearInterval(iv); return; } // 最多等30秒
            const frames = document.querySelectorAll("iframe");
            let found = false;
            frames.forEach((iframe) => {
                try {
                    const src = iframe.src || iframe.getAttribute("src") || "";
                    if (src.includes("quality") || src.includes("stdEvaluate")) {
                        found = true;
                    }
                } catch (e) { }
            });
            if (found) clearInterval(iv);
        }, 2000);
    }

    function showCompletion(total) {
        const div = document.createElement("div");
        div.style.cssText =
            "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);" +
            "background:#fff;padding:30px 50px;border-radius:16px;" +
            "box-shadow:0 8px 40px rgba(0,0,0,0.2);z-index:999999;" +
            "text-align:center;font-family:Microsoft YaHei,sans-serif;";
        div.innerHTML =
            `<div style="font-size:48px;margin-bottom:10px;">🎉</div>` +
            `<h2 style="margin:0 0 8px;color:#0f9d58;">全部评教完成！</h2>` +
            `<p style="color:#666;margin:0;">共完成 ${total} 位教师的评教</p>`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 5000);
    }

    if (document.readyState === "complete") {
        init();
    } else {
        window.addEventListener("load", init);
    }

    // 菜单命令
    GM_registerMenuCommand("📊 打开评教列表", () => {
        window.location.href = "https://urp.cnu.edu.cn/eams/quality/stdEvaluate.action";
    });
    GM_registerMenuCommand("⚙️ 设置评分参数", () => {
        const cfg = loadConfig();
        const s = prompt("教学评分 (1-5，当前: " + cfg.teachingScore + ")", cfg.teachingScore);
        if (s && s >= 1 && s <= 5) cfg.teachingScore = parseInt(s);
        const d = prompt("课程难度 (1-5，当前: " + cfg.contentDifficulty + ")", cfg.contentDifficulty);
        if (d && d >= 1 && d <= 5) cfg.contentDifficulty = parseInt(d);
        const sat = prompt("满意度 (1-5，当前: " + cfg.satisfactionScore + ")", cfg.satisfactionScore);
        if (sat && sat >= 1 && sat <= 5) cfg.satisfactionScore = parseInt(sat);
        saveConfig(cfg);
        alert("配置已保存！");
    });

})();
