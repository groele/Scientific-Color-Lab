const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");
const {
  imageSizingContain,
  imageSizingCrop,
  warnIfSlideHasOverlaps,
  warnIfSlideElementsOutOfBounds,
} = require("./pptxgenjs_helpers");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "OpenAI Codex";
pptx.company = "Scientific Color Lab";
pptx.subject = "Scientific Color Lab overview deck";
pptx.title = "Scientific Color Lab - Project Overview";
pptx.lang = "zh-CN";
pptx.theme = {
  headFontFace: "Aptos",
  bodyFontFace: "Aptos",
  lang: "zh-CN",
};

const ROOT = __dirname;
const OUT_PPTX = path.join(ROOT, "scientific-color-lab-overview.pptx");
const SCREENSHOT_DIR = path.join(ROOT, "assets", "screenshots");
const FALLBACK_DIR = path.resolve(ROOT, "..", "..", "artifacts");

const COLORS = {
  bg: "F4F2EC",
  panel: "FBFAF7",
  panelAlt: "EEF2F8",
  ink: "132033",
  inkSoft: "55657A",
  line: "D7DEE9",
  lineStrong: "A8B5C9",
  blue: "1D4ED8",
  teal: "0F766E",
  cyan: "0891B2",
  orange: "EA580C",
  gold: "C08B2D",
  violet: "6D28D9",
  rose: "C2416C",
  green: "10B981",
  navy: "0B1B34",
  white: "FFFFFF",
  slate: "CBD5E1",
};

const FONT = {
  zh: "Microsoft YaHei",
  en: "Aptos",
  mono: "Consolas",
};

function asset(name, fallbacks = []) {
  const direct = path.join(SCREENSHOT_DIR, name);
  if (fs.existsSync(direct)) return direct;
  for (const fallback of fallbacks) {
    const fallbackPath = path.join(FALLBACK_DIR, fallback);
    if (fs.existsSync(fallbackPath)) return fallbackPath;
  }
  return null;
}

const assets = {
  workspaceMain: asset("workspace-main.png", ["studio-swatches.png"]),
  workspaceTemplates: asset("workspace-templates.png", ["studio-swatches.png"]),
  workspaceGrid: asset("workspace-grid.png", ["studio-grid.png"]),
  workspacePairing: asset("workspace-pairing.png", ["studio-swatches.png"]),
  workspaceDiagnostics: asset("workspace-diagnostics.png", ["studio-swatches.png"]),
  analyzerRaw: asset("analyzer-raw.png", ["analyzer-png.png"]),
  analyzerScientific: asset("analyzer-scientific.png", ["analyzer-png.png"]),
  library: asset("library.png", ["library.png"]),
  exports: asset("exports.png", ["studio-swatches.png"]),
  shareability: asset("shareability.png", ["studio-swatches.png"]),
};

function background(slide) {
  slide.background = { color: COLORS.bg };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.18,
    y: 0.18,
    w: 12.96,
    h: 7.12,
    fill: { color: COLORS.bg },
    line: { color: COLORS.line, transparency: 20, width: 1.1 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4,
    y: 0.4,
    w: 12.52,
    h: 6.68,
    fill: { color: COLORS.bg, transparency: 100 },
    line: { color: COLORS.line, transparency: 55, width: 0.8 },
  });
}

function header(slide, section, page) {
  slide.addText(section, {
    x: 0.56,
    y: 0.34,
    w: 3.6,
    h: 0.18,
    fontFace: FONT.en,
    fontSize: 8.5,
    bold: true,
    color: COLORS.blue,
    margin: 0,
    charSpace: 1.3,
  });
  slide.addText(String(page).padStart(2, "0"), {
    x: 12.1,
    y: 0.3,
    w: 0.56,
    h: 0.18,
    fontFace: FONT.mono,
    fontSize: 8,
    color: COLORS.inkSoft,
    align: "right",
    margin: 0,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.56,
    y: 0.58,
    w: 0.92,
    h: 0.03,
    fill: { color: COLORS.blue },
    line: { color: COLORS.blue, transparency: 100 },
  });
}

function titleBlock(slide, zhTitle, enTitle, body, x = 0.72, y = 0.86, w = 5.6) {
  slide.addText(zhTitle, {
    x,
    y,
    w,
    h: 0.4,
    fontFace: FONT.zh,
    fontSize: 24,
    bold: true,
    color: COLORS.ink,
    margin: 0,
  });
  slide.addText(enTitle, {
    x,
    y: y + 0.42,
    w,
    h: 0.18,
    fontFace: FONT.en,
    fontSize: 10,
    italic: true,
    color: COLORS.inkSoft,
    margin: 0,
  });
  if (body) {
    slide.addText(body, {
      x,
      y: y + 0.75,
      w,
      h: 0.6,
      fontFace: FONT.zh,
      fontSize: 11.2,
      color: COLORS.inkSoft,
      margin: 0,
    });
  }
}

function panel(slide, x, y, w, h, fill = COLORS.panel, line = COLORS.line) {
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    line: { color: line, width: 1.05 },
  });
}

function text(slide, value, x, y, w, h, options = {}) {
  slide.addText(value, {
    x,
    y,
    w,
    h,
    fontFace: options.fontFace || FONT.zh,
    fontSize: options.fontSize || 11,
    color: options.color || COLORS.ink,
    bold: options.bold || false,
    italic: options.italic || false,
    align: options.align || "left",
    margin: options.margin ?? 0,
    breakLine: options.breakLine,
  });
}

function infoCard(slide, x, y, w, h, zhTitle, enTitle, body, accent) {
  panel(slide, x, y, w, h, COLORS.white, COLORS.lineStrong);
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.08,
    h,
    fill: { color: accent },
    line: { color: accent, transparency: 100 },
  });
  text(slide, zhTitle, x + 0.18, y + 0.16, w - 0.28, 0.2, { fontSize: 13.5, bold: true });
  text(slide, enTitle, x + 0.18, y + 0.4, w - 0.28, 0.16, {
    fontFace: FONT.en,
    fontSize: 8.1,
    italic: true,
    color: COLORS.inkSoft,
  });
  text(slide, body, x + 0.18, y + 0.66, w - 0.32, h - 0.76, { fontSize: 9.6, color: COLORS.inkSoft });
}

function metricCard(slide, x, y, w, h, metric, label, body, accent) {
  panel(slide, x, y, w, h, COLORS.white, accent);
  text(slide, metric, x + 0.14, y + 0.12, w - 0.28, 0.18, {
    fontFace: FONT.en,
    fontSize: 12.4,
    bold: true,
    color: accent,
  });
  text(slide, label, x + 0.14, y + 0.34, w - 0.28, 0.14, {
    fontFace: FONT.en,
    fontSize: 7.8,
    italic: true,
    color: COLORS.inkSoft,
  });
  text(slide, body, x + 0.14, y + 0.54, w - 0.28, h - 0.64, {
    fontSize: 8.4,
    color: COLORS.inkSoft,
  });
}

function bullets(slide, items, x, y, w, options = {}) {
  const gap = options.gap || 0.34;
  const size = options.fontSize || 10.2;
  const dot = options.dot || COLORS.blue;
  items.forEach((item, idx) => {
    const yy = y + idx * gap;
    slide.addShape(pptx.ShapeType.ellipse, {
      x,
      y: yy + 0.08,
      w: 0.06,
      h: 0.06,
      fill: { color: dot },
      line: { color: dot, transparency: 100 },
    });
    text(slide, item, x + 0.14, yy, w - 0.14, 0.22, { fontSize: size, color: COLORS.ink });
  });
}

function colorStrip(slide, colors, x, y, w, h, captionText = "") {
  const step = w / colors.length;
  colors.forEach((color, idx) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: x + idx * step,
      y,
      w: step + 0.01,
      h,
      fill: { color },
      line: { color, transparency: 100 },
    });
  });
  if (captionText) {
    text(slide, captionText, x, y + h + 0.08, w, 0.16, {
      fontFace: FONT.en,
      fontSize: 8,
      italic: true,
      color: COLORS.inkSoft,
    });
  }
}

function screenshot(slide, imgPath, x, y, w, h, crop = true) {
  panel(slide, x, y, w, h, COLORS.white, COLORS.lineStrong);
  if (!imgPath || !fs.existsSync(imgPath)) {
    text(slide, "Screenshot unavailable", x + 0.2, y + h / 2 - 0.1, w - 0.4, 0.2, {
      fontFace: FONT.en,
      fontSize: 11,
      italic: true,
      color: COLORS.inkSoft,
      align: "center",
    });
    return;
  }
  const sizing = crop
    ? imageSizingCrop(imgPath, x + 0.08, y + 0.08, w - 0.16, h - 0.16)
    : imageSizingContain(imgPath, x + 0.08, y + 0.08, w - 0.16, h - 0.16);
  slide.addImage({
    path: imgPath,
    ...sizing,
  });
}

function footer(slide, value, x = 0.74, y = 7.02, w = 4.5) {
  text(slide, value, x, y, w, 0.14, {
    fontFace: FONT.en,
    fontSize: 7.8,
    italic: true,
    color: COLORS.inkSoft,
  });
}

function finalize(slide) {
  warnIfSlideHasOverlaps(slide, pptx, { includePlaceholders: false, includeNotes: false });
  warnIfSlideElementsOutOfBounds(slide, pptx);
}

function slide1() {
  const slide = pptx.addSlide();
  background(slide);
  header(slide, "PROJECT OVERVIEW", 1);
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.74,
    y: 1.04,
    w: 0.92,
    h: 0.06,
    fill: { color: COLORS.blue },
    line: { color: COLORS.blue, transparency: 100 },
  });
  text(slide, "Scientific Color Lab", 0.74, 1.28, 5.2, 0.4, {
    fontFace: FONT.en,
    fontSize: 23,
    bold: true,
    color: COLORS.navy,
  });
  text(slide, "科研配色工作台", 0.74, 1.74, 4.6, 0.4, {
    fontSize: 26,
    bold: true,
    color: COLORS.navy,
  });
  text(
    slide,
    "面向论文图表、热图、概念图、机制示意图与在线学术文档的专业配色系统。它不是普通色盘，而是把模板、调色、预览、诊断、导出与分享收束为一套科研工作流。",
    0.74,
    2.28,
    4.9,
    0.92,
    { fontSize: 12, color: COLORS.inkSoft }
  );
  metricCard(slide, 0.74, 3.52, 1.66, 1.12, "OKLCH", "Perceptual engine", "以感知一致的色彩逻辑做生成与调整。", COLORS.blue);
  metricCard(slide, 2.54, 3.52, 1.66, 1.12, "PWA", "Share-ready", "可在线访问，也可安装为类应用体验。", COLORS.teal);
  metricCard(slide, 4.34, 3.52, 1.66, 1.12, "3-PANEL", "Workspace", "左侧导航，中间主任务，右侧高频上下文。", COLORS.violet);
  screenshot(slide, assets.workspaceMain, 6.28, 0.94, 6.08, 5.42, true);
  text(slide, "Latest interface capture", 6.48, 6.48, 2.2, 0.14, {
    fontFace: FONT.en,
    fontSize: 7.8,
    italic: true,
    color: COLORS.inkSoft,
  });
  text(slide, "在线地址 / Live URL", 0.74, 6.46, 1.8, 0.16, {
    fontSize: 10.2,
    bold: true,
    color: COLORS.blue,
  });
  text(slide, "https://groele.github.io/Scientific-Color-Lab/", 0.74, 6.72, 4.8, 0.18, {
    fontFace: FONT.en,
    fontSize: 10,
    color: COLORS.ink,
  });
  footer(slide, "A scientific, screen-first color workspace for academic communication.");
  finalize(slide);
}

function slide2() {
  const slide = pptx.addSlide();
  background(slide);
  header(slide, "WHY THIS MATTERS", 2);
  titleBlock(
    slide,
    "为什么科研配色不是普通取色问题",
    "Why scientific color is not the same as generic color picking",
    "在科研沟通里，颜色不是装饰，而是信息结构的一部分。颜色系统如果缺乏感知秩序，就会制造伪边界、误导趋势判断，或者在灰度和色觉缺陷条件下失效。"
  );
  infoCard(slide, 0.78, 1.96, 3.66, 1.18, "彩虹式渐变误用", "Rainbow misuse", "高彩度跳跃会制造并不存在的边界，尤其不适合连续数据。", COLORS.orange);
  infoCard(slide, 0.78, 3.3, 3.66, 1.18, "红绿冲突", "Red-green conflict", "对色觉缺陷用户不友好，也常在灰度打印里失去区分度。", COLORS.rose);
  infoCard(slide, 0.78, 4.64, 3.66, 1.18, "非单调顺序色图", "Non-monotonic ramps", "如果明度不稳，读者会把颜色起伏误读为数据结构变化。", COLORS.gold);
  panel(slide, 4.92, 1.88, 7.42, 4.92, COLORS.panelAlt, COLORS.lineStrong);
  text(slide, "Misuse vs better strategy", 5.18, 2.08, 2.8, 0.18, {
    fontFace: FONT.en,
    fontSize: 10,
    color: COLORS.inkSoft,
  });
  text(slide, "错误示例：彩虹色图制造伪边界", 5.18, 2.42, 3.0, 0.18, { fontSize: 12.4, bold: true });
  colorStrip(slide, ["3B4CC0", "56A2D9", "7FD5D3", "F5D547", "EB7C3A", "B40426"], 5.18, 2.72, 2.92, 0.28);
  text(slide, "更稳妥：使用感知更有序的顺序渐变", 8.52, 2.42, 3.0, 0.18, { fontSize: 12.4, bold: true });
  colorStrip(slide, ["081D58", "253494", "2C7FB8", "41B6C4", "A1DAB4", "FFFFCC"], 8.52, 2.72, 2.92, 0.28);
  text(slide, "错误示例：红绿在灰度与 CVD 场景下易失效", 5.18, 3.86, 3.1, 0.18, { fontSize: 12.4, bold: true });
  colorStrip(slide, ["C83E4D", "8BAA38"], 5.18, 4.16, 2.92, 0.28);
  text(slide, "更稳妥：用明度与色相都可分离的组合", 8.52, 3.86, 3.1, 0.18, { fontSize: 12.4, bold: true });
  colorStrip(slide, ["2B6CB0", "9F7AEA"], 8.52, 4.16, 2.92, 0.28);
  text(slide, "因此项目默认强调 perceptually uniform、ordered、CVD-aware 与 grayscale-aware 的颜色策略。", 5.18, 5.1, 6.0, 0.46, {
    fontSize: 10.4,
    color: COLORS.inkSoft,
  });
  bullets(slide, [
    "顺序色图强调单调明度",
    "发散色图强调清晰中点",
    "周期色图强调首尾连续",
  ], 0.84, 6.3, 5.4, { gap: 0.32, fontSize: 10.1, dot: COLORS.blue });
  finalize(slide);
}

function slide3() {
  const slide = pptx.addSlide();
  background(slide);
  header(slide, "CURRENT PAIN POINTS", 3);
  titleBlock(
    slide,
    "科研配色工作流里的常见痛点",
    "The friction points researchers face in day-to-day figure work",
    "真正影响效率的并不只是“选不到好看的颜色”，而是模板、调色、图表预览、图片提色、诊断、导出和分享被拆散在多个工具里。"
  );
  infoCard(slide, 0.78, 1.94, 2.94, 1.5, "只给色块", "Pretty swatches only", "很多工具停留在“给几个好看的颜色”，没有图表语义和后续工作流。", COLORS.blue);
  infoCard(slide, 3.96, 1.94, 2.94, 1.5, "调色看不到预览", "Adjust without seeing", "参数调节和主画布不在同一屏，判断成本很高。", COLORS.teal);
  infoCard(slide, 7.14, 1.94, 2.94, 1.5, "原始提色不够安全", "Raw extraction only", "图片主色不一定适合做论文图、文本或连续色图。", COLORS.orange);
  infoCard(slide, 10.32, 1.94, 2.0, 1.5, "难以分享", "Hard to share", "做好配色后，往往还缺少导出、归档和让别人试用的路径。", COLORS.violet);
  panel(slide, 0.78, 3.86, 11.56, 2.18, COLORS.white, COLORS.lineStrong);
  text(slide, "A tighter workflow chain", 1.02, 4.12, 2.4, 0.16, {
    fontFace: FONT.en,
    fontSize: 10,
    color: COLORS.inkSoft,
  });
  text(slide, "把零散动作收束成一条连续路径", 1.02, 4.42, 3.3, 0.24, { fontSize: 18, bold: true });
  text(slide, "Template  →  Adjust  →  Preview  →  Diagnose  →  Export  →  Share", 1.02, 5.0, 7.2, 0.2, {
    fontFace: FONT.en,
    fontSize: 13,
    bold: true,
    color: COLORS.blue,
  });
  bullets(slide, [
    "模板不只是颜色列表，而是带有任务标签和科学约束的起点",
    "调色、预览与诊断联动，减少反复跳转的认知成本",
    "输出路径覆盖 Library、Exports、GitHub Pages 与 PWA",
  ], 7.24, 4.28, 4.6, { gap: 0.34, fontSize: 10.1, dot: COLORS.teal });
  finalize(slide);
}

function slide4() {
  const slide = pptx.addSlide();
  background(slide);
  header(slide, "POSITIONING", 4);
  titleBlock(
    slide,
    "Scientific Color Lab 是什么，不是什么",
    "Product positioning",
    "它强调科研语义与工作流秩序，而不是把复杂任务简化成“换几种颜色”。"
  );
  panel(slide, 0.82, 1.94, 5.54, 4.74, COLORS.panel, COLORS.lineStrong);
  text(slide, "不是什么 / What it is not", 1.08, 2.2, 2.8, 0.22, { fontSize: 18, bold: true, color: COLORS.rose });
  bullets(slide, [
    "不是只有几组漂亮色块的玩具色盘",
    "不是没有图表语义和风险提示的静态配色库",
    "不是把科研场景等同于普通 UI 配色的视觉工具",
    "不是只能在终端里跑起来的开发者演示",
  ], 1.08, 2.76, 4.86, { gap: 0.56, fontSize: 11, dot: COLORS.rose });
  panel(slide, 6.74, 1.94, 5.6, 4.74, COLORS.white, COLORS.blue);
  text(slide, "是什么 / What it is", 7.0, 2.2, 2.2, 0.22, { fontSize: 18, bold: true, color: COLORS.blue });
  bullets(slide, [
    "面向论文图、热图、机制图与在线学术文档的专业配色工作台",
    "以 OKLCH 与感知逻辑为内核，主动避免误导性用色",
    "把模板、调色、预览、诊断、导出和分享整合进同一界面",
    "既支持本地优先，也支持 GitHub Pages 与 PWA 分享",
  ], 7.0, 2.76, 4.9, { gap: 0.56, fontSize: 11, dot: COLORS.blue });
  metricCard(slide, 0.98, 6.9, 3.1, 0.56, "Research-first", "Product principle", "科研工作流契合度优先于纯视觉修饰。", COLORS.navy);
  metricCard(slide, 4.34, 6.9, 3.3, 0.56, "Screen-first", "Communication focus", "优先服务于屏幕阅读与在线学术文档。", COLORS.teal);
  metricCard(slide, 7.92, 6.9, 3.36, 0.56, "Share-ready", "Delivery path", "从设计到分享，不止停留在本地调色。", COLORS.orange);
  finalize(slide);
}

function slide5() {
  const slide = pptx.addSlide();
  background(slide);
  header(slide, "CORE VALUE", 5);
  titleBlock(
    slide,
    "核心价值总览",
    "What makes the product useful",
    "一句话概括：它让科研配色从“找几种颜色”升级为“围绕图形任务做结构化决策”。"
  );
  metricCard(slide, 0.84, 2.0, 2.84, 1.42, "01", "Research semantics", "按 qualitative、sequential、diverging、cyclic 的图形语义组织颜色。", COLORS.blue);
  metricCard(slide, 3.98, 2.0, 2.84, 1.42, "02", "Perceptual logic", "以 OKLCH / perceptual ordering 做生成、插值与扩展。", COLORS.teal);
  metricCard(slide, 7.12, 2.0, 2.84, 1.42, "03", "Live workflow", "模板、调色、预览、诊断在一个连续工作区里联动。", COLORS.orange);
  metricCard(slide, 10.26, 2.0, 2.06, 1.42, "04", "Shareability", "GitHub Pages 与 PWA 让试用和传播更轻。", COLORS.violet);
  panel(slide, 0.84, 3.92, 11.48, 2.16, COLORS.white, COLORS.lineStrong);
  text(slide, "One sentence value proposition", 1.08, 4.16, 2.4, 0.16, {
    fontFace: FONT.en,
    fontSize: 10,
    color: COLORS.inkSoft,
  });
  text(
    slide,
    "让研究者在同一个环境里完成“选择一套更科学的颜色 → 观察图形效果 → 修正潜在风险 → 导出并分享”的完整流程。",
    1.08,
    4.46,
    5.96,
    0.44,
    { fontSize: 16.5, bold: true }
  );
  bullets(slide, [
    "默认模板和建议围绕科研图语义，而不是视觉噱头",
    "高频调色保持在主画布同屏，避免“调了但看不到”",
    "诊断模块弱化打扰感，强化 quick fix 的可执行性",
  ], 7.12, 4.18, 4.46, { gap: 0.42, fontSize: 10.4, dot: COLORS.blue });
  finalize(slide);
}

function slide6() {
  const slide = pptx.addSlide();
  background(slide);
  header(slide, "WORKSPACE STRUCTURE", 6);
  titleBlock(
    slide,
    "三栏工作区结构",
    "A three-panel workspace with clear responsibilities",
    "界面重组的目标是把主任务放回中间，把高频上下文留在右侧，把导航和入口压缩到左侧。"
  );
  panel(slide, 0.92, 2.04, 2.02, 4.52, COLORS.panel, COLORS.lineStrong);
  panel(slide, 3.16, 2.04, 6.02, 4.52, COLORS.white, COLORS.blue);
  panel(slide, 9.4, 2.04, 2.98, 4.52, COLORS.panelAlt, COLORS.lineStrong);
  text(slide, "左侧 / Left rail", 1.16, 2.34, 1.4, 0.18, { fontSize: 15, bold: true, color: COLORS.blue });
  bullets(slide, ["路由导航", "进入 Templates", "项目与最近入口", "Analyzer / Export 快捷入口"], 1.16, 2.84, 1.46, {
    gap: 0.56,
    fontSize: 10.2,
    dot: COLORS.blue,
  });
  text(slide, "中间 / Main workspace", 3.42, 2.34, 2.0, 0.18, { fontSize: 15, bold: true, color: COLORS.blue });
  bullets(slide, ["Palette Canvas", "Templates", "Scientific Grid", "Pairing / Gradient", "Chart Preview / Analyzer"], 3.42, 2.84, 2.2, {
    gap: 0.5,
    fontSize: 10.4,
    dot: COLORS.teal,
  });
  text(slide, "右侧 / Context rail", 9.66, 2.34, 1.8, 0.18, { fontSize: 15, bold: true, color: COLORS.blue });
  bullets(slide, ["Adjustment", "Diagnostics Summary", "History", "Inspector（降权）"], 9.66, 2.84, 2.0, {
    gap: 0.56,
    fontSize: 10.2,
    dot: COLORS.orange,
  });
  text(slide, "Template  →  Adjust  →  Preview  →  Diagnose  →  Export", 3.4, 5.76, 5.2, 0.2, {
    fontFace: FONT.en,
    fontSize: 13,
    bold: true,
    color: COLORS.violet,
    align: "center",
  });
  text(slide, "设计重点：避免把 Analyzer、Template Library 这类主任务再次挤回侧栏。", 1.02, 6.92, 7.2, 0.18, {
    fontSize: 10.2,
    color: COLORS.inkSoft,
  });
  footer(slide, "The three-panel shell is a workflow decision, not just a layout decision.", 8.2, 6.92, 4.0);
  finalize(slide);
}

function slide7() {
  const slide = pptx.addSlide();
  background(slide);
  header(slide, "PALETTE STUDIO", 7);
  titleBlock(
    slide,
    "Palette Studio：从模板进入真正的工作会话",
    "Templates become the start of an editable session",
    "模板库不再只是静态样例，而是带着图形语义、科学标签和应用前对比预览进入调色工作流。"
  );
  screenshot(slide, assets.workspaceTemplates, 0.9, 1.96, 7.3, 4.9, true);
  infoCard(slide, 8.54, 2.04, 3.2, 1.18, "模板不是孤立色块", "Templates as systems", "每个模板都携带适用图形、对比度取向与科学标签。", COLORS.blue);
  infoCard(slide, 8.54, 3.42, 3.2, 1.18, "应用前可比较", "Preview before apply", "current vs candidate 让选择更稳，不需要频繁撤销。", COLORS.teal);
  infoCard(slide, 8.54, 4.8, 3.2, 1.18, "按任务优先排序", "Task-aware ranking", "thin-line safe、heatmap-safe、concept scaffold 等更适合科研使用。", COLORS.orange);
  bullets(slide, [
    "模板面向 line plot、scatter、bar、heatmap、concept figure 等具体任务",
    "高对比科研模板族强调可区分性、可读性和图形结构表达",
    "模板说明会直接解释“为什么适合”，降低选择门槛",
  ], 0.98, 6.96, 11.1, { gap: 0.3, fontSize: 10.0, dot: COLORS.blue });
  finalize(slide);
}

function slide8() {
  const slide = pptx.addSlide();
  background(slide);
  header(slide, "HIGH-FREQUENCY ADJUSTMENT", 8);
  titleBlock(
    slide,
    "High-Frequency Adjustment：高频调色必须与画布同屏",
    "Fine-tuning only works when the main preview stays visible",
    "这个模块被放回 Palette Canvas 附近，是为了让研究者能边调 Hue、Lightness、Chroma、Alpha，边看整体效果。"
  );
  screenshot(slide, assets.workspaceMain, 0.92, 1.96, 7.34, 4.9, true);
  infoCard(slide, 8.56, 2.04, 3.18, 1.1, "同屏调色", "Adjustment stays near canvas", "避免滑到页面下方再回头看预览的低效循环。", COLORS.blue);
  infoCard(slide, 8.56, 3.36, 3.18, 1.1, "整板同步调整", "Palette-wide deltas", "以选中色为锚点，对整个调色板同步施加 H/L/C/A 增量。", COLORS.teal);
  infoCard(slide, 8.56, 4.68, 3.18, 1.1, "撤销与历史", "Undo, redo, history", "高频试探需要快速回退，因此历史被视为主工作流的一部分。", COLORS.orange);
  text(slide, "Hue  /  Lightness  /  Chroma  /  Alpha", 8.7, 6.24, 3.0, 0.18, {
    fontFace: FONT.en,
    fontSize: 11.5,
    bold: true,
    color: COLORS.violet,
    align: "center",
  });
  footer(slide, "Live preview is not a visual luxury; it is the basis for correct tuning.");
  finalize(slide);
}

function slide9() {
  const slide = pptx.addSlide();
  background(slide);
  header(slide, "SCIENTIFIC GRID", 9);
  titleBlock(
    slide,
    "Scientific Grid：二维颜色扩展矩阵",
    "A 2D extension system around the current anchor color",
    "它让单个颜色不再只是一个点，而是一个可以围绕 hue、lightness 和 chroma 扩展的结构化空间。"
  );
  screenshot(slide, assets.workspaceGrid, 0.94, 1.96, 7.2, 4.94, true);
  infoCard(slide, 8.42, 2.02, 3.42, 1.12, "Hue × Lightness", "Perceptual exploration", "围绕当前色做轻微色相偏移，同时保持明度层次可控。", COLORS.blue);
  infoCard(slide, 8.42, 3.38, 3.42, 1.12, "Chroma × Lightness", "Editorial expansion", "适合构建更克制的学术风子集，尤其适合概念图与在线文档。", COLORS.teal);
  infoCard(slide, 8.42, 4.74, 3.42, 1.12, "Clickable cells", "Copy and insert", "任何格子都可以复制、查看或加入当前调色板。", COLORS.orange);
  bullets(slide, [
    "中心色固定为当前主色，降低探索时的语义漂移",
    "对 out-of-gamut 结果做安全处理，减少跳色与失真",
    "可直接生成 tonal ramp、concept figure 子集或更稳妥的 categorical 扩展",
  ], 0.98, 6.98, 11.1, { gap: 0.31, fontSize: 10.0, dot: COLORS.blue });
  finalize(slide);
}

function slide10() {
  const slide = pptx.addSlide();
  background(slide);
  header(slide, "PAIRING AND GRADIENTS", 10);
  titleBlock(
    slide,
    "Pairing + Gradient：不止给互补色",
    "Recommendation logic goes beyond naive complements",
    "项目把搭配与渐变都视为“图形任务的一部分”，而不是简单的色相数学结果。"
  );
  screenshot(slide, assets.workspacePairing, 0.9, 1.96, 6.28, 4.98, true);
  panel(slide, 7.48, 2.02, 4.96, 1.28, COLORS.white, COLORS.lineStrong);
  text(slide, "Gradient logic", 7.74, 2.2, 1.4, 0.18, {
    fontFace: FONT.en,
    fontSize: 10.6,
    bold: true,
    color: COLORS.blue,
  });
  colorStrip(slide, ["081D58", "1D4ED8", "38BDF8", "A7F3D0", "FEF3C7"], 7.74, 2.5, 1.08, 0.22);
  colorStrip(slide, ["0F172A", "2563EB", "F8FAFC", "F97316", "7F1D1D"], 8.98, 2.5, 1.08, 0.22);
  colorStrip(slide, ["3B82F6", "A855F7", "EC4899", "F59E0B", "3B82F6"], 10.22, 2.5, 1.08, 0.22);
  text(slide, "Sequential / Diverging / Cyclic", 7.74, 2.82, 3.6, 0.14, {
    fontFace: FONT.en,
    fontSize: 8,
    italic: true,
    color: COLORS.inkSoft,
  });
  infoCard(slide, 7.48, 3.62, 2.32, 2.06, "Most natural", "Editorial pairing", "优先给出更克制、更适合论文与机制图的搭配，而不是追求视觉刺激。", COLORS.blue);
  infoCard(slide, 10.08, 3.62, 2.36, 2.06, "Figure-aware", "Chart-aware", "区分 line plot、heatmap endpoints、concept figure 等场景。", COLORS.orange);
  bullets(slide, [
    "顺序色图强调单调明度",
    "发散色图强调结构化中点",
    "周期色图强调首尾闭合",
    "搭配推荐优先回答“适不适合这类图”",
  ], 7.62, 6.0, 4.7, { gap: 0.29, fontSize: 9.7, dot: COLORS.teal });
  finalize(slide);
}

function slide11() {
  const slide = pptx.addSlide();
  background(slide);
  header(slide, "IMAGE ANALYZER", 11);
  titleBlock(
    slide,
    "Analyzer：从图片提色到 scientific reconstruction",
    "Image extraction becomes a safer palette-building workflow",
    "图片提色不应停留在“抽几个主色”，更重要的是判断这些颜色是否适合做分类色、文本、背景或连续渐变端点。"
  );
  screenshot(slide, assets.analyzerRaw, 0.9, 1.98, 5.56, 4.52, true);
  screenshot(slide, assets.analyzerScientific, 6.86, 1.98, 5.56, 4.52, true);
  text(slide, "原始提取 / Raw extraction", 1.88, 6.66, 3.5, 0.18, {
    fontSize: 12.5,
    bold: true,
    align: "center",
  });
  text(slide, "科学重构 / Scientific reconstruction", 7.78, 6.66, 3.8, 0.18, {
    fontSize: 12.5,
    bold: true,
    align: "center",
  });
  text(slide, "→", 6.28, 3.96, 0.5, 0.3, {
    fontFace: FONT.en,
    fontSize: 24,
    bold: true,
    color: COLORS.blue,
    align: "center",
  });
  bullets(slide, [
    "支持上传、拖拽、粘贴截图与示例图像",
    "输出 dominant colors、占比、合并近似色与 suitability 判断",
    "允许在“原始提取”和“更安全的科研重构”之间切换",
  ], 0.98, 7.02, 11.1, { gap: 0.28, fontSize: 9.8, dot: COLORS.blue });
  finalize(slide);
}

function slide12() {
  const slide = pptx.addSlide();
  background(slide);
  header(slide, "DIAGNOSTICS", 12);
  titleBlock(
    slide,
    "Diagnostics：低干扰，但能给出可执行修正",
    "Diagnostics should guide action, not dominate the interface",
    "这个模块被降级成次级助手：平时只给摘要和 quick fix，高风险时才提升显著性。"
  );
  screenshot(slide, assets.workspaceDiagnostics || assets.workspaceMain, 0.92, 1.96, 6.88, 4.86, true);
  infoCard(slide, 8.16, 2.02, 4.08, 1.08, "诊断摘要", "Summary, not warning wall", "默认只展示状态、评分、前两条关键问题和可直接执行的修正动作。", COLORS.blue);
  infoCard(slide, 8.16, 3.3, 4.08, 1.08, "Quick fixes", "Actionable suggestions", "如 reduce chroma、replace red-green pair、rebuild sequential ramp。", COLORS.orange);
  infoCard(slide, 8.16, 4.58, 4.08, 1.08, "科研语义解释", "Why it matters", "说明颜色问题会如何误导读者、影响灰度/CVD 或削弱图形结构。", COLORS.teal);
  bullets(slide, [
    "诊断的目标是帮助做决定，而不是制造噪音",
    "高风险 palette 会自动提升诊断可见度",
    "低风险场景下，工作流重点仍然是模板、调色和预览",
  ], 0.98, 6.98, 11.0, { gap: 0.31, fontSize: 10.0, dot: COLORS.violet });
  finalize(slide);
}

function slide13() {
  const slide = pptx.addSlide();
  background(slide);
  header(slide, "ASSETS AND EXPORTS", 13);
  titleBlock(
    slide,
    "Library + Exports：把颜色资产管理起来",
    "A useful tool must also help you save, reuse, and export",
    "真正可用的科研工具不只负责“设计当下”，还要负责“保留、复用、导出、传递给别人”。"
  );
  screenshot(slide, assets.library, 0.88, 1.98, 6.04, 4.84, true);
  screenshot(slide, assets.exports, 7.12, 1.98, 5.34, 4.84, true);
  text(slide, "Library", 2.78, 6.96, 1.2, 0.16, {
    fontFace: FONT.en,
    fontSize: 10.5,
    bold: true,
    align: "center",
  });
  text(slide, "Projects / Favorites / Recents", 1.8, 7.18, 3.0, 0.14, {
    fontFace: FONT.en,
    fontSize: 8,
    color: COLORS.inkSoft,
    align: "center",
  });
  text(slide, "Exports", 9.42, 6.96, 1.0, 0.16, {
    fontFace: FONT.en,
    fontSize: 10.5,
    bold: true,
    align: "center",
  });
  text(slide, "JSON / CSV / CSS / Tailwind / Matplotlib / Plotly / MATLAB", 7.22, 7.18, 4.2, 0.14, {
    fontFace: FONT.en,
    fontSize: 7.6,
    color: COLORS.inkSoft,
    align: "center",
  });
  finalize(slide);
}

function slide14() {
  const slide = pptx.addSlide();
  background(slide);
  header(slide, "SHAREABILITY", 14);
  titleBlock(
    slide,
    "GitHub Pages + PWA：让别人更容易直接使用",
    "Sharing matters when a research tool needs adoption",
    "如果工具只能停留在本地终端，它就很难进入真实科研协作。项目把部署、安装和分享路径也视为产品的一部分。"
  );
  screenshot(slide, assets.shareability || assets.workspaceMain, 0.88, 1.98, 6.18, 4.82, true);
  panel(slide, 7.34, 2.0, 5.02, 1.16, COLORS.white, COLORS.blue);
  text(slide, "Online access", 7.6, 2.18, 1.6, 0.18, {
    fontFace: FONT.en,
    fontSize: 10.8,
    bold: true,
    color: COLORS.blue,
  });
  text(slide, "https://groele.github.io/Scientific-Color-Lab/", 7.6, 2.48, 4.3, 0.18, {
    fontFace: FONT.en,
    fontSize: 9.2,
    color: COLORS.ink,
  });
  infoCard(slide, 7.34, 3.42, 2.38, 2.26, "在线即用", "Web first", "直接把网址发给同事、学生或评审，即可进入最新版本。", COLORS.blue);
  infoCard(slide, 9.98, 3.42, 2.38, 2.26, "安装即可用", "Installable PWA", "支持安装为类应用体验，适合反复打开、教学演示与试用。", COLORS.teal);
  bullets(slide, [
    "GitHub Pages 适合作为轻量级对外展示和体验入口",
    "PWA 提供更像桌面应用的使用方式与快捷访问",
    "本地优先与在线部署并存，更符合真实科研协作",
  ], 0.98, 6.96, 11.0, { gap: 0.3, fontSize: 10.0, dot: COLORS.blue });
  finalize(slide);
}

function slide15() {
  const slide = pptx.addSlide();
  background(slide);
  header(slide, "WHY IT HELPS", 15);
  titleBlock(
    slide,
    "主要优势总结",
    "Why this tool helps real scientific communication",
    "它的价值不只在于颜色更好看，而在于让颜色选择更可信、更高效，也更容易复用和分享。"
  );
  infoCard(slide, 0.84, 2.02, 2.94, 1.56, "更快", "Shorter path", "模板、调色、预览、诊断与导出被压缩到一条更短的路径里。", COLORS.blue);
  infoCard(slide, 4.0, 2.02, 2.94, 1.56, "更稳", "Safer defaults", "主动规避彩虹图、红绿冲突、非单调顺序色图等常见风险。", COLORS.orange);
  infoCard(slide, 7.16, 2.02, 2.94, 1.56, "更可解释", "Explainable choices", "从模板标签到 quick fix，都能解释“为什么适合”。", COLORS.teal);
  infoCard(slide, 10.32, 2.02, 2.0, 1.56, "更易分享", "Share-ready", "网页部署与 PWA 降低试用和传播门槛。", COLORS.violet);
  panel(slide, 0.84, 4.08, 11.5, 2.2, COLORS.white, COLORS.lineStrong);
  text(slide, "适用人群 / Best suited for", 1.08, 4.34, 2.8, 0.18, {
    fontSize: 12.5,
    bold: true,
    color: COLORS.blue,
  });
  bullets(slide, [
    "需要高质量论文图表与机制图配色的研究者和研究生",
    "需要教学、课程 slides 或在线学术文档的教师与工程师",
    "需要把图片主色重构成更专业色彩系统的设计协作者",
    "需要一套既能本地使用又能在线分享的科研工具的人",
  ], 1.08, 4.78, 5.6, { gap: 0.38, fontSize: 10.0, dot: COLORS.blue });
  colorStrip(slide, ["0B1B34", "1D4ED8", "0891B2", "10B981", "C08B2D"], 7.02, 4.76, 4.62, 0.34, "Project accent direction");
  text(
    slide,
    "从视觉语言到交互结构，这个项目都围绕“让科研颜色更可信、更高效、更可分享”来组织，而不是只追求漂亮的色块。",
    7.02,
    5.34,
    4.62,
    0.58,
    { fontSize: 11, color: COLORS.inkSoft }
  );
  finalize(slide);
}

function slide16() {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.navy };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.36,
    y: 0.36,
    w: 12.6,
    h: 6.78,
    fill: { color: COLORS.navy },
    line: { color: "2D4365", width: 1.1 },
  });
  header(slide, "CLOSING", 16);
  text(slide, "Scientific Color Lab", 0.9, 1.16, 4.4, 0.36, {
    fontFace: FONT.en,
    fontSize: 24,
    bold: true,
    color: COLORS.white,
  });
  text(slide, "面向科研沟通的专业配色工作台", 0.9, 1.62, 5.2, 0.34, {
    fontSize: 24,
    bold: true,
    color: COLORS.white,
  });
  text(
    slide,
    "从模板开始，经过高频微调、图形预览、科学诊断和导出分享，形成一条真正可用的科研配色工作流。",
    0.9,
    2.18,
    5.1,
    0.56,
    { fontSize: 12.4, color: "D9E2F2" }
  );
  text(slide, "Project URL", 0.9, 3.28, 1.2, 0.14, {
    fontFace: FONT.en,
    fontSize: 9,
    bold: true,
    color: "8FB3FF",
  });
  text(slide, "https://groele.github.io/Scientific-Color-Lab/", 0.9, 3.54, 4.8, 0.18, {
    fontFace: FONT.en,
    fontSize: 10.8,
    color: COLORS.white,
  });
  bullets(slide, [
    "Research-first semantics",
    "Perceptual color logic",
    "Live adjustment and preview",
    "Deployable and installable",
  ], 0.94, 4.26, 3.8, { gap: 0.34, fontSize: 10.2, dot: "8FB3FF" });
  screenshot(slide, assets.workspaceMain, 7.02, 1.32, 4.9, 3.5, true);
  text(slide, "Future directions", 7.02, 5.18, 1.8, 0.16, {
    fontFace: FONT.en,
    fontSize: 10,
    bold: true,
    color: COLORS.white,
  });
  text(
    slide,
    "More task presets, richer diagnostics, stronger template guidance, and deeper project workflows.",
    7.02,
    5.46,
    4.46,
    0.42,
    { fontFace: FONT.en, fontSize: 9.6, color: "DDE8FA" }
  );
  footer(slide, "Project overview deck generated with PptxGenJS.", 0.9, 6.98, 5.4);
  finalize(slide);
}

slide1();
slide2();
slide3();
slide4();
slide5();
slide6();
slide7();
slide8();
slide9();
slide10();
slide11();
slide12();
slide13();
slide14();
slide15();
slide16();

pptx.writeFile({ fileName: OUT_PPTX }).then(() => {
  console.log(`PPTX written to ${OUT_PPTX}`);
});
