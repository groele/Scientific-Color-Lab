from __future__ import annotations

from pathlib import Path
from typing import Iterable
import textwrap

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SCREENSHOT_DIR = ROOT / "assets" / "screenshots"
RENDERED_DIR = ROOT / "rendered"
PDF_PATH = ROOT / "scientific-color-lab-overview.pdf"

WIDTH = 1920
HEIGHT = 1080

COLORS = {
    "bg": "#F4F2EC",
    "panel": "#FBFAF7",
    "panel_alt": "#EEF2F8",
    "ink": "#132033",
    "ink_soft": "#55657A",
    "line": "#D7DEE9",
    "line_strong": "#A8B5C9",
    "blue": "#1D4ED8",
    "teal": "#0F766E",
    "cyan": "#0891B2",
    "orange": "#EA580C",
    "gold": "#C08B2D",
    "violet": "#6D28D9",
    "rose": "#C2416C",
    "green": "#10B981",
    "navy": "#0B1B34",
    "white": "#FFFFFF",
}

ZH_FONT = str(Path(r"C:\Windows\Fonts\msyh.ttc"))
ZH_FONT_BOLD = str(Path(r"C:\Windows\Fonts\msyhbd.ttc"))
EN_FONT = str(Path(r"C:\Windows\Fonts\segoeui.ttf"))
EN_FONT_BOLD = str(Path(r"C:\Windows\Fonts\segoeuib.ttf"))
EN_FONT_ITALIC = str(Path(r"C:\Windows\Fonts\segoeuii.ttf"))


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


FONTS = {
    "zh_title": font(ZH_FONT_BOLD, 52),
    "zh_heading": font(ZH_FONT_BOLD, 42),
    "zh_body": font(ZH_FONT, 24),
    "zh_small": font(ZH_FONT, 20),
    "zh_card": font(ZH_FONT_BOLD, 28),
    "en_title": font(EN_FONT_BOLD, 48),
    "en_body": font(EN_FONT, 22),
    "en_small": font(EN_FONT, 18),
    "en_small_bold": font(EN_FONT_BOLD, 18),
    "en_metric": font(EN_FONT_BOLD, 24),
    "en_italic": font(EN_FONT_ITALIC, 18),
    "mono": font(EN_FONT_BOLD, 16),
}


ASSETS = {
    "workspace_main": SCREENSHOT_DIR / "workspace-main.png",
    "workspace_templates": SCREENSHOT_DIR / "workspace-templates.png",
    "workspace_grid": SCREENSHOT_DIR / "workspace-grid.png",
    "workspace_pairing": SCREENSHOT_DIR / "workspace-pairing.png",
    "workspace_diagnostics": SCREENSHOT_DIR / "workspace-diagnostics.png",
    "analyzer_raw": SCREENSHOT_DIR / "analyzer-raw.png",
    "analyzer_scientific": SCREENSHOT_DIR / "analyzer-scientific.png",
    "library": SCREENSHOT_DIR / "library.png",
    "exports": SCREENSHOT_DIR / "exports.png",
    "shareability": SCREENSHOT_DIR / "shareability.png",
}


def create_canvas(dark: bool = False) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    bg = COLORS["navy"] if dark else COLORS["bg"]
    image = Image.new("RGB", (WIDTH, HEIGHT), bg)
    draw = ImageDraw.Draw(image)
    outline = "#2D4365" if dark else COLORS["line"]
    inner = bg if dark else COLORS["bg"]
    draw.rectangle((36, 36, WIDTH - 36, HEIGHT - 36), fill=inner, outline=outline, width=2)
    draw.rectangle((72, 72, WIDTH - 72, HEIGHT - 72), outline=outline if dark else COLORS["line"], width=1)
    return image, draw


def draw_header(draw: ImageDraw.ImageDraw, section: str, page: int, dark: bool = False) -> None:
    section_color = "#8FB3FF" if dark else COLORS["blue"]
    page_color = "#DDE8FA" if dark else COLORS["ink_soft"]
    draw.text((80, 52), section, font=FONTS["en_small_bold"], fill=section_color)
    draw.rectangle((80, 92, 220, 98), fill=section_color)
    page_text = str(page).zfill(2)
    bbox = draw.textbbox((0, 0), page_text, font=FONTS["mono"])
    draw.text((WIDTH - 80 - (bbox[2] - bbox[0]), 50), page_text, font=FONTS["mono"], fill=page_color)


def wrap_text(value: str, width_chars: int) -> str:
    return "\n".join(textwrap.wrap(value, width=width_chars, break_long_words=False))


def wrap_text_lines(value: str, width_chars: int, max_lines: int) -> str:
    lines = textwrap.wrap(value, width=width_chars, break_long_words=False)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        if lines[-1] and not lines[-1].endswith("…"):
            trimmed = lines[-1]
            if len(trimmed) > 1:
                trimmed = trimmed[:-1]
            lines[-1] = f"{trimmed}…"
    return "\n".join(lines)


def draw_title(draw: ImageDraw.ImageDraw, zh: str, en: str, body: str, x: int = 110, y: int = 120, dark: bool = False) -> None:
    title_color = COLORS["white"] if dark else COLORS["ink"]
    body_color = "#DDE8FA" if dark else COLORS["ink_soft"]
    draw.text((x, y), zh, font=FONTS["zh_title"], fill=title_color)
    draw.text((x, y + 64), en, font=FONTS["en_italic"], fill=body_color)
    draw.multiline_text((x, y + 114), wrap_text(body, 34), font=FONTS["zh_body"], fill=body_color, spacing=10)


def draw_panel(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: str, outline: str) -> None:
    draw.rectangle(box, fill=fill, outline=outline, width=2)


def draw_info_card(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], zh: str, en: str, body: str, accent: str) -> None:
    x1, y1, x2, y2 = box
    draw_panel(draw, box, COLORS["white"], COLORS["line_strong"])
    draw.rectangle((x1, y1, x1 + 12, y2), fill=accent)
    draw.text((x1 + 26, y1 + 18), zh, font=FONTS["zh_card"], fill=COLORS["ink"])
    draw.text((x1 + 26, y1 + 58), en, font=FONTS["en_italic"], fill=COLORS["ink_soft"])
    max_lines = max(2, int((y2 - y1 - 116) / 30))
    wrapped = wrap_text_lines(body, max(10, int((x2 - x1) / 32)), max_lines)
    draw.multiline_text((x1 + 26, y1 + 96), wrapped, font=FONTS["zh_small"], fill=COLORS["ink_soft"], spacing=7)


def draw_metric_card(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], metric: str, label: str, body: str, accent: str) -> None:
    x1, y1, x2, y2 = box
    draw_panel(draw, box, COLORS["white"], accent)
    draw.text((x1 + 18, y1 + 14), metric, font=FONTS["en_metric"], fill=accent)
    draw.text((x1 + 18, y1 + 52), label, font=FONTS["en_italic"], fill=COLORS["ink_soft"])
    max_lines = max(2, int((y2 - y1 - 102) / 28))
    wrapped = wrap_text_lines(body, max(10, int((x2 - x1) / 28)), max_lines)
    draw.multiline_text((x1 + 18, y1 + 88), wrapped, font=FONTS["zh_small"], fill=COLORS["ink_soft"], spacing=6)


def draw_bullets(draw: ImageDraw.ImageDraw, items: Iterable[str], x: int, y: int, line_gap: int = 58, dot: str = COLORS["blue"], dark: bool = False) -> None:
    text_color = "#DDE8FA" if dark else COLORS["ink"]
    for idx, item in enumerate(items):
        yy = y + idx * line_gap
        draw.ellipse((x, yy + 14, x + 12, yy + 26), fill=dot)
        draw.text((x + 28, yy), item, font=FONTS["zh_small"], fill=text_color)


def draw_color_strip(draw: ImageDraw.ImageDraw, colors: list[str], box: tuple[int, int, int, int], caption: str | None = None) -> None:
    x1, y1, x2, y2 = box
    step = (x2 - x1) / len(colors)
    for idx, color in enumerate(colors):
        left = round(x1 + idx * step)
        right = round(x1 + (idx + 1) * step)
        draw.rectangle((left, y1, right, y2), fill=color)
    if caption:
        draw.text((x1, y2 + 10), caption, font=FONTS["en_italic"], fill=COLORS["ink_soft"])


def paste_screenshot(canvas: Image.Image, img_path: Path, box: tuple[int, int, int, int]) -> None:
    x1, y1, x2, y2 = box
    border = 2
    draw = ImageDraw.Draw(canvas)
    draw_panel(draw, box, COLORS["white"], COLORS["line_strong"])
    if not img_path.exists():
        draw.text((x1 + 30, y1 + 40), "Screenshot unavailable", font=FONTS["en_body"], fill=COLORS["ink_soft"])
        return
    source = Image.open(img_path).convert("RGB")
    fitted = ImageOps.fit(source, (x2 - x1 - 24, y2 - y1 - 24), method=Image.Resampling.LANCZOS)
    canvas.paste(fitted, (x1 + 12, y1 + 12))
    draw.rectangle((x1, y1, x2, y2), outline=COLORS["line_strong"], width=border)


def save_pdf_from_pngs(png_paths: list[Path], pdf_path: Path) -> None:
    images = [Image.open(path).convert("RGB") for path in png_paths]
    images[0].save(pdf_path, save_all=True, append_images=images[1:], resolution=150)
    for image in images:
        image.close()


def slide_1() -> Image.Image:
    image, draw = create_canvas()
    draw_header(draw, "PROJECT OVERVIEW", 1)
    draw.rectangle((110, 150, 250, 160), fill=COLORS["blue"])
    draw.text((110, 190), "Scientific Color Lab", font=FONTS["en_title"], fill=COLORS["navy"])
    draw.text((110, 258), "科研配色工作台", font=FONTS["zh_title"], fill=COLORS["navy"])
    draw.multiline_text((110, 336), wrap_text("面向论文图表、热图、概念图、机制图与在线学术文档的专业配色系统。\n它不是普通色盘，而是把模板、调色、预览、诊断、导出与分享收束为一套科研工作流。", 14), font=FONTS["zh_body"], fill=COLORS["ink_soft"], spacing=10)
    draw_metric_card(draw, (110, 528, 360, 692), "OKLCH", "Perceptual engine", "感知一致的色彩逻辑。", COLORS["blue"])
    draw_metric_card(draw, (390, 528, 640, 692), "PWA", "Share-ready", "在线访问，也可安装。", COLORS["teal"])
    draw_metric_card(draw, (670, 528, 920, 692), "3-PANEL", "Workspace", "左侧导航，中间主任务。", COLORS["violet"])
    paste_screenshot(image, ASSETS["workspace_main"], (930, 120, 1810, 810))
    draw.text((110, 840), "在线地址 / Live URL", font=FONTS["zh_small"], fill=COLORS["blue"])
    draw.text((110, 884), "https://groele.github.io/Scientific-Color-Lab/", font=FONTS["en_body"], fill=COLORS["ink"])
    draw.text((110, 1010), "A scientific, screen-first color workspace for academic communication.", font=FONTS["en_italic"], fill=COLORS["ink_soft"])
    return image


def slide_2() -> Image.Image:
    image, draw = create_canvas()
    draw_header(draw, "WHY THIS MATTERS", 2)
    draw_title(draw, "为什么科研配色不是普通取色问题", "Why scientific color is not the same as generic color picking", "在科研沟通里，颜色不是装饰，而是信息结构的一部分。颜色系统如果缺乏感知秩序，就会制造伪边界、误导趋势判断，或者在灰度和色觉缺陷条件下失效。")
    draw_info_card(draw, (110, 290, 620, 450), "彩虹式渐变误用", "Rainbow misuse", "高彩度跳跃会制造并不存在的边界，尤其不适合连续数据。", COLORS["orange"])
    draw_info_card(draw, (110, 470, 620, 630), "红绿冲突", "Red-green conflict", "对色觉缺陷用户不友好，也常在灰度打印里失去区分度。", COLORS["rose"])
    draw_info_card(draw, (110, 650, 620, 810), "非单调顺序色图", "Non-monotonic ramps", "如果明度不稳，读者会把颜色起伏误读为数据结构变化。", COLORS["gold"])
    draw_panel(draw, (680, 278, 1800, 840), COLORS["panel_alt"], COLORS["line_strong"])
    draw.text((720, 310), "Misuse vs better strategy", font=FONTS["en_small_bold"], fill=COLORS["ink_soft"])
    draw.text((720, 360), "错误示例：彩虹色图制造伪边界", font=FONTS["zh_card"], fill=COLORS["ink"])
    draw_color_strip(draw, ["#3B4CC0", "#56A2D9", "#7FD5D3", "#F5D547", "#EB7C3A", "#B40426"], (720, 412, 1090, 446))
    draw.text((1220, 360), "更稳妥：感知更有序的顺序渐变", font=FONTS["zh_card"], fill=COLORS["ink"])
    draw_color_strip(draw, ["#081D58", "#253494", "#2C7FB8", "#41B6C4", "#A1DAB4", "#FFFFCC"], (1220, 412, 1590, 446))
    draw.text((720, 542), "错误示例：红绿在灰度与 CVD 场景下易失效", font=FONTS["zh_card"], fill=COLORS["ink"])
    draw_color_strip(draw, ["#C83E4D", "#8BAA38"], (720, 594, 1090, 628))
    draw.text((1220, 542), "更稳妥：用明度与色相都可分离的组合", font=FONTS["zh_card"], fill=COLORS["ink"])
    draw_color_strip(draw, ["#2B6CB0", "#9F7AEA"], (1220, 594, 1590, 628))
    draw.multiline_text((720, 690), wrap_text("因此项目默认强调 perceptually uniform、ordered、CVD-aware 与 grayscale-aware 的颜色策略。", 30), font=FONTS["zh_small"], fill=COLORS["ink_soft"], spacing=8)
    draw_bullets(draw, ["顺序色图强调单调明度", "发散色图强调清晰中点", "周期色图强调首尾连续"], 110, 962, line_gap=42, dot=COLORS["blue"])
    return image


def slide_3() -> Image.Image:
    image, draw = create_canvas()
    draw_header(draw, "CURRENT PAIN POINTS", 3)
    draw_title(draw, "科研配色工作流里的常见痛点", "The friction points researchers face in day-to-day figure work", "真正影响效率的并不只是“选不到好看的颜色”，而是模板、调色、图表预览、图片提色、诊断、导出和分享被拆散在多个工具里。")
    draw_info_card(draw, (110, 288, 495, 490), "只给色块", "Pretty swatches only", "很多工具停留在“给几个好看的颜色”，没有图表语义和后续工作流。", COLORS["blue"])
    draw_info_card(draw, (535, 288, 920, 490), "调色看不到预览", "Adjust without seeing", "参数调节和主画布不在同一屏，判断成本很高。", COLORS["teal"])
    draw_info_card(draw, (960, 288, 1345, 490), "原始提色不够安全", "Raw extraction only", "图片主色不一定适合做论文图、文本或连续色图。", COLORS["orange"])
    draw_info_card(draw, (1385, 288, 1800, 490), "难以分享", "Hard to share", "做好配色后，往往还缺少导出、归档和让别人试用的路径。", COLORS["violet"])
    draw_panel(draw, (110, 560, 1800, 860), COLORS["white"], COLORS["line_strong"])
    draw.text((150, 610), "A tighter workflow chain", font=FONTS["en_small_bold"], fill=COLORS["ink_soft"])
    draw.text((150, 654), "把零散动作收束成一条连续路径", font=FONTS["zh_heading"], fill=COLORS["ink"])
    draw.text((150, 736), "Template  →  Adjust  →  Preview  →  Diagnose  →  Export  →  Share", font=FONTS["en_metric"], fill=COLORS["blue"])
    draw_bullets(draw, ["模板不只是颜色列表，而是带有任务标签和科学约束的起点", "调色、预览与诊断联动，减少反复跳转的认知成本", "输出路径覆盖 Library、Exports、GitHub Pages 与 PWA"], 1040, 618, dot=COLORS["teal"])
    return image


def slide_4() -> Image.Image:
    image, draw = create_canvas()
    draw_header(draw, "POSITIONING", 4)
    draw_title(draw, "Scientific Color Lab 是什么，不是什么", "Product positioning", "它强调科研语义与工作流秩序，而不是把复杂任务简化成“换几种颜色”。")
    draw_panel(draw, (110, 290, 830, 860), COLORS["panel"], COLORS["line_strong"])
    draw.text((150, 340), "不是什么 / What it is not", font=FONTS["zh_heading"], fill=COLORS["rose"])
    draw_bullets(draw, ["不是只有几组漂亮色块的玩具色盘", "不是没有图表语义和风险提示的静态配色库", "不是把科研场景等同于普通 UI 配色的视觉工具", "不是只能在终端里跑起来的开发者演示"], 150, 430, line_gap=92, dot=COLORS["rose"])
    draw_panel(draw, (920, 290, 1810, 860), COLORS["white"], COLORS["blue"])
    draw.text((960, 340), "是什么 / What it is", font=FONTS["zh_heading"], fill=COLORS["blue"])
    draw_bullets(draw, ["面向论文图、热图、机制图与在线学术文档的专业配色工作台", "以 OKLCH 与感知逻辑为内核，主动避免误导性用色", "把模板、调色、预览、诊断、导出和分享整合进同一界面", "既支持本地优先，也支持 GitHub Pages 与 PWA 分享"], 960, 430, line_gap=92, dot=COLORS["blue"])
    return image


def slide_5() -> Image.Image:
    image, draw = create_canvas()
    draw_header(draw, "CORE VALUE", 5)
    draw_title(draw, "核心价值总览", "What makes the product useful", "一句话概括：它让科研配色从“找几种颜色”升级为“围绕图形任务做结构化决策”。")
    draw_metric_card(draw, (110, 290, 500, 490), "01", "Research semantics", "按 qualitative、sequential、diverging、cyclic 的图形语义组织颜色。", COLORS["blue"])
    draw_metric_card(draw, (540, 290, 930, 490), "02", "Perceptual logic", "以 OKLCH / perceptual ordering 做生成、插值与扩展。", COLORS["teal"])
    draw_metric_card(draw, (970, 290, 1360, 490), "03", "Live workflow", "模板、调色、预览、诊断在一个连续工作区里联动。", COLORS["orange"])
    draw_metric_card(draw, (1400, 290, 1790, 490), "04", "Shareability", "GitHub Pages 与 PWA 让试用和传播更轻。", COLORS["violet"])
    draw_panel(draw, (110, 560, 1800, 870), COLORS["white"], COLORS["line_strong"])
    draw.text((150, 612), "One sentence value proposition", font=FONTS["en_small_bold"], fill=COLORS["ink_soft"])
    draw.multiline_text((150, 656), wrap_text("让研究者在同一个环境里完成“选择一套更科学的颜色 → 观察图形效果 → 修正潜在风险 → 导出并分享”的完整流程。", 26), font=FONTS["zh_heading"], fill=COLORS["ink"], spacing=12)
    draw_bullets(draw, ["默认模板和建议围绕科研图语义，而不是视觉噱头", "高频调色保持在主画布同屏，避免“调了但看不到”", "诊断模块弱化打扰感，强化 quick fix 的可执行性"], 1120, 620, line_gap=78, dot=COLORS["blue"])
    return image


def slide_6() -> Image.Image:
    image, draw = create_canvas()
    draw_header(draw, "WORKSPACE STRUCTURE", 6)
    draw_title(draw, "三栏工作区结构", "A three-panel workspace with clear responsibilities", "界面重组的目标是把主任务放回中间，把高频上下文留在右侧，把导航和入口压缩到左侧。")
    draw_panel(draw, (120, 308, 440, 864), COLORS["panel"], COLORS["line_strong"])
    draw_panel(draw, (500, 308, 1310, 864), COLORS["white"], COLORS["blue"])
    draw_panel(draw, (1370, 308, 1800, 864), COLORS["panel_alt"], COLORS["line_strong"])
    draw.text((156, 350), "左侧 / Left rail", font=FONTS["zh_card"], fill=COLORS["blue"])
    draw_bullets(draw, ["路由导航", "进入 Templates", "项目与最近入口", "Analyzer / Export 快捷入口"], 156, 426, line_gap=88, dot=COLORS["blue"])
    draw.text((536, 350), "中间 / Main workspace", font=FONTS["zh_card"], fill=COLORS["blue"])
    draw_bullets(draw, ["Palette Canvas", "Templates", "Scientific Grid", "Pairing / Gradient", "Chart Preview / Analyzer"], 536, 426, line_gap=74, dot=COLORS["teal"])
    draw.text((1406, 350), "右侧 / Context rail", font=FONTS["zh_card"], fill=COLORS["blue"])
    draw_bullets(draw, ["Adjustment", "Diagnostics Summary", "History", "Inspector（降权）"], 1406, 426, line_gap=88, dot=COLORS["orange"])
    draw.text((630, 836), "Template  →  Adjust  →  Preview  →  Diagnose  →  Export", font=FONTS["en_metric"], fill=COLORS["violet"])
    return image


def slide_7() -> Image.Image:
    image, draw = create_canvas()
    draw_header(draw, "PALETTE STUDIO", 7)
    draw_title(draw, "Palette Studio：从模板进入真正的工作会话", "Templates become the start of an editable session", "模板库不再只是静态样例，而是带着图形语义、科学标签和应用前对比预览进入调色工作流。")
    paste_screenshot(image, ASSETS["workspace_templates"], (110, 292, 1190, 860))
    draw_info_card(draw, (1260, 304, 1780, 466), "模板不是孤立色块", "Templates as systems", "每个模板都携带适用图形、对比度取向与科学标签。", COLORS["blue"])
    draw_info_card(draw, (1260, 494, 1780, 656), "应用前可比较", "Preview before apply", "current vs candidate 让选择更稳，不需要频繁撤销。", COLORS["teal"])
    draw_info_card(draw, (1260, 684, 1780, 846), "按任务优先排序", "Task-aware ranking", "thin-line safe、heatmap-safe、concept scaffold 等更适合科研使用。", COLORS["orange"])
    return image


def slide_8() -> Image.Image:
    image, draw = create_canvas()
    draw_header(draw, "HIGH-FREQUENCY ADJUSTMENT", 8)
    draw_title(draw, "High-Frequency Adjustment：高频调色必须与画布同屏", "Fine-tuning only works when the main preview stays visible", "这个模块被放回 Palette Canvas 附近，是为了让研究者能边调 Hue、Lightness、Chroma、Alpha，边看整体效果。")
    paste_screenshot(image, ASSETS["workspace_main"], (110, 292, 1190, 860))
    draw_info_card(draw, (1260, 304, 1780, 460), "同屏调色", "Adjustment stays near canvas", "避免滑到页面下方再回头看预览的低效循环。", COLORS["blue"])
    draw_info_card(draw, (1260, 486, 1780, 642), "整板同步调整", "Palette-wide deltas", "以选中色为锚点，对整个调色板同步施加 H/L/C/A 增量。", COLORS["teal"])
    draw_info_card(draw, (1260, 668, 1780, 824), "撤销与历史", "Undo, redo, history", "高频试探需要快速回退，因此历史被视为主工作流的一部分。", COLORS["orange"])
    draw.text((1260, 872), "Hue  /  Lightness  /  Chroma  /  Alpha", font=FONTS["en_metric"], fill=COLORS["violet"])
    return image


def slide_9() -> Image.Image:
    image, draw = create_canvas()
    draw_header(draw, "SCIENTIFIC GRID", 9)
    draw_title(draw, "Scientific Grid：二维颜色扩展矩阵", "A 2D extension system around the current anchor color", "它让单个颜色不再只是一个点，而是一个可以围绕 hue、lightness 和 chroma 扩展的结构化空间。")
    paste_screenshot(image, ASSETS["workspace_grid"], (110, 292, 1180, 860))
    draw_info_card(draw, (1240, 304, 1780, 466), "Hue × Lightness", "Perceptual exploration", "围绕当前色做轻微色相偏移，同时保持明度层次可控。", COLORS["blue"])
    draw_info_card(draw, (1240, 494, 1780, 656), "Chroma × Lightness", "Editorial expansion", "适合构建更克制的学术风子集，尤其适合概念图与在线文档。", COLORS["teal"])
    draw_info_card(draw, (1240, 684, 1780, 846), "Clickable cells", "Copy and insert", "任何格子都可以复制、查看或加入当前调色板。", COLORS["orange"])
    return image


def slide_10() -> Image.Image:
    image, draw = create_canvas()
    draw_header(draw, "PAIRING AND GRADIENTS", 10)
    draw_title(draw, "Pairing + Gradient：不止给互补色", "Recommendation logic goes beyond naive complements", "项目把搭配与渐变都视为“图形任务的一部分”，而不是简单的色相数学结果。")
    paste_screenshot(image, ASSETS["workspace_pairing"], (110, 292, 1040, 860))
    draw_panel(draw, (1090, 304, 1780, 462), COLORS["white"], COLORS["line_strong"])
    draw.text((1126, 330), "Gradient logic", font=FONTS["en_small_bold"], fill=COLORS["blue"])
    draw_color_strip(draw, ["#081D58", "#1D4ED8", "#38BDF8", "#A7F3D0", "#FEF3C7"], (1126, 380, 1320, 414))
    draw_color_strip(draw, ["#0F172A", "#2563EB", "#F8FAFC", "#F97316", "#7F1D1D"], (1350, 380, 1544, 414))
    draw_color_strip(draw, ["#3B82F6", "#A855F7", "#EC4899", "#F59E0B", "#3B82F6"], (1574, 380, 1768, 414))
    draw.text((1126, 430), "Sequential / Diverging / Cyclic", font=FONTS["en_italic"], fill=COLORS["ink_soft"])
    draw_info_card(draw, (1090, 512, 320 + 1090, 820), "Most natural", "Editorial pairing", "优先给出更克制、更适合论文与机制图的搭配。", COLORS["blue"])
    draw_info_card(draw, (1440, 512, 1780, 820), "Figure-aware", "Chart-aware", "区分 line plot、heatmap endpoints、concept figure 等场景。", COLORS["orange"])
    return image


def slide_11() -> Image.Image:
    image, draw = create_canvas()
    draw_header(draw, "IMAGE ANALYZER", 11)
    draw_title(draw, "Analyzer：从图片提色到 scientific reconstruction", "Image extraction becomes a safer palette-building workflow", "图片提色不应停留在“抽几个主色”，更重要的是判断这些颜色是否适合做分类色、文本、背景或连续渐变端点。")
    paste_screenshot(image, ASSETS["analyzer_raw"], (110, 304, 880, 820))
    paste_screenshot(image, ASSETS["analyzer_scientific"], (1040, 304, 1810, 820))
    draw.text((280, 846), "原始提取 / Raw extraction", font=FONTS["zh_card"], fill=COLORS["ink"])
    draw.text((1180, 846), "科学重构 / Scientific reconstruction", font=FONTS["zh_card"], fill=COLORS["ink"])
    draw.text((920, 534), "→", font=FONTS["en_title"], fill=COLORS["blue"])
    return image


def slide_12() -> Image.Image:
    image, draw = create_canvas()
    draw_header(draw, "DIAGNOSTICS", 12)
    draw_title(draw, "Diagnostics：低干扰，但能给出可执行修正", "Diagnostics should guide action, not dominate the interface", "这个模块被降级成次级助手：平时只给摘要和 quick fix，高风险时才提升显著性。")
    paste_screenshot(image, ASSETS["workspace_diagnostics"], (110, 292, 1120, 860))
    draw_info_card(draw, (1180, 304, 1780, 458), "诊断摘要", "Summary, not warning wall", "默认只展示状态、评分、前两条关键问题和可直接执行的修正动作。", COLORS["blue"])
    draw_info_card(draw, (1180, 484, 1780, 638), "Quick fixes", "Actionable suggestions", "如 reduce chroma、replace red-green pair、rebuild sequential ramp。", COLORS["orange"])
    draw_info_card(draw, (1180, 664, 1780, 818), "科研语义解释", "Why it matters", "说明颜色问题会如何误导读者、影响灰度/CVD 或削弱图形结构。", COLORS["teal"])
    return image


def slide_13() -> Image.Image:
    image, draw = create_canvas()
    draw_header(draw, "ASSETS AND EXPORTS", 13)
    draw_title(draw, "Library + Exports：把颜色资产管理起来", "A useful tool must also help you save, reuse, and export", "真正可用的科研工具不只负责“设计当下”，还要负责“保留、复用、导出、传递给别人”。")
    paste_screenshot(image, ASSETS["library"], (110, 302, 980, 850))
    paste_screenshot(image, ASSETS["exports"], (1040, 302, 1810, 850))
    draw.text((460, 876), "Library", font=FONTS["en_metric"], fill=COLORS["ink"])
    draw.text((420, 914), "Projects / Favorites / Recents", font=FONTS["en_italic"], fill=COLORS["ink_soft"])
    draw.text((1360, 876), "Exports", font=FONTS["en_metric"], fill=COLORS["ink"])
    draw.text((1140, 914), "JSON / CSV / CSS / Tailwind / Matplotlib / Plotly / MATLAB", font=FONTS["en_italic"], fill=COLORS["ink_soft"])
    return image


def slide_14() -> Image.Image:
    image, draw = create_canvas()
    draw_header(draw, "SHAREABILITY", 14)
    draw_title(draw, "GitHub Pages + PWA：让别人更容易直接使用", "Sharing matters when a research tool needs adoption", "如果工具只能停留在本地终端，它就很难进入真实科研协作。项目把部署、安装和分享路径也视为产品的一部分。")
    paste_screenshot(image, ASSETS["shareability"], (110, 300, 960, 848))
    draw_panel(draw, (1020, 304, 1780, 460), COLORS["white"], COLORS["blue"])
    draw.text((1060, 332), "Online access", font=FONTS["en_small_bold"], fill=COLORS["blue"])
    draw.text((1060, 390), "https://groele.github.io/Scientific-Color-Lab/", font=FONTS["en_body"], fill=COLORS["ink"])
    draw_info_card(draw, (1020, 520, 1360, 828), "在线即用", "Web first", "直接把网址发给同事、学生或评审，即可进入最新版本。", COLORS["blue"])
    draw_info_card(draw, (1440, 520, 1780, 828), "安装即可用", "Installable PWA", "支持安装为类应用体验，适合反复打开、教学演示与试用。", COLORS["teal"])
    return image


def slide_15() -> Image.Image:
    image, draw = create_canvas()
    draw_header(draw, "WHY IT HELPS", 15)
    draw_title(draw, "主要优势总结", "Why this tool helps real scientific communication", "它的价值不只在于颜色更好看，而在于让颜色选择更可信、更高效，也更容易复用和分享。")
    draw_info_card(draw, (110, 288, 470, 488), "更快", "Shorter path", "模板、调色、预览、诊断与导出被压缩到一条更短的路径里。", COLORS["blue"])
    draw_info_card(draw, (510, 288, 870, 488), "更稳", "Safer defaults", "主动规避彩虹图、红绿冲突、非单调顺序色图等常见风险。", COLORS["orange"])
    draw_info_card(draw, (910, 288, 1270, 488), "更可解释", "Explainable choices", "从模板标签到 quick fix，都能解释“为什么适合”。", COLORS["teal"])
    draw_info_card(draw, (1310, 288, 1670, 488), "更易分享", "Share-ready", "网页部署与 PWA 降低试用和传播门槛。", COLORS["violet"])
    draw_panel(draw, (110, 560, 1800, 860), COLORS["white"], COLORS["line_strong"])
    draw.text((150, 606), "适用人群 / Best suited for", font=FONTS["zh_card"], fill=COLORS["blue"])
    draw_bullets(draw, ["需要高质量论文图表与机制图配色的研究者和研究生", "需要教学、课程 slides 或在线学术文档的教师与工程师", "需要把图片主色重构成更专业色彩系统的协作者", "需要一套既能本地使用又能在线分享的科研工具的人"], 150, 680, line_gap=80, dot=COLORS["blue"])
    draw_color_strip(draw, ["#0B1B34", "#1D4ED8", "#0891B2", "#10B981", "#C08B2D"], (1080, 650, 1650, 692), "Project accent direction")
    draw.multiline_text((1080, 740), wrap_text("从视觉语言到交互结构，这个项目都围绕“让科研颜色更可信、更高效、更可分享”来组织，而不是只追求漂亮的色块。", 18), font=FONTS["zh_small"], fill=COLORS["ink_soft"], spacing=8)
    return image


def slide_16() -> Image.Image:
    image, draw = create_canvas(dark=True)
    draw_header(draw, "CLOSING", 16, dark=True)
    draw.text((110, 180), "Scientific Color Lab", font=FONTS["en_title"], fill=COLORS["white"])
    draw.text((110, 248), "面向科研沟通的专业配色工作台", font=FONTS["zh_title"], fill=COLORS["white"])
    draw.multiline_text((110, 340), wrap_text("从模板开始，经过高频微调、图形预览、科学诊断和导出分享，形成一条真正可用的科研配色工作流。", 18), font=FONTS["zh_body"], fill="#DDE8FA", spacing=10)
    draw.text((110, 490), "Project URL", font=FONTS["en_small_bold"], fill="#8FB3FF")
    draw.text((110, 534), "https://groele.github.io/Scientific-Color-Lab/", font=FONTS["en_body"], fill=COLORS["white"])
    draw_bullets(draw, ["Research-first semantics", "Perceptual color logic", "Live adjustment and preview", "Deployable and installable"], 110, 640, line_gap=62, dot="#8FB3FF", dark=True)
    paste_screenshot(image, ASSETS["workspace_main"], (1040, 180, 1800, 720))
    draw.text((1040, 780), "Future directions", font=FONTS["en_small_bold"], fill=COLORS["white"])
    draw.multiline_text((1040, 828), wrap_text("More task presets, richer diagnostics, stronger template guidance, and deeper project workflows.", 26), font=FONTS["en_body"], fill="#DDE8FA", spacing=10)
    draw.text((110, 1014), "Project overview deck preview generated from the latest screenshots.", font=FONTS["en_italic"], fill="#DDE8FA")
    return image


SLIDE_BUILDERS = [
    slide_1,
    slide_2,
    slide_3,
    slide_4,
    slide_5,
    slide_6,
    slide_7,
    slide_8,
    slide_9,
    slide_10,
    slide_11,
    slide_12,
    slide_13,
    slide_14,
    slide_15,
    slide_16,
]


def main() -> None:
    RENDERED_DIR.mkdir(parents=True, exist_ok=True)

    rendered_paths: list[Path] = []
    for index, builder in enumerate(SLIDE_BUILDERS, start=1):
        image = builder()
        target = RENDERED_DIR / f"slide-{index:02d}.png"
        image.save(target, format="PNG", optimize=True)
        rendered_paths.append(target)

    save_pdf_from_pngs(rendered_paths, PDF_PATH)
    print(f"Rendered {len(rendered_paths)} slides to {RENDERED_DIR}")
    print(f"PDF written to {PDF_PATH}")


if __name__ == "__main__":
    main()
