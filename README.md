<div align="center">

# Scientific Color Lab

**面向科研图表、论文插图和科学可视化的专业配色工作台**  
*Scientific color workspace for palettes, colormaps, figure-color diagnostics, and export-ready visualization workflows.*

![Type](https://img.shields.io/badge/type-Web%20App%20%2F%20PWA-blue?style=flat-square)
![Domain](https://img.shields.io/badge/domain-scientific%20visualization-green?style=flat-square)
![Architecture](https://img.shields.io/badge/architecture-local--first-purple?style=flat-square)
![Export](https://img.shields.io/badge/export-MATLAB%20%2F%20Matplotlib%20%2F%20CSS-orange?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-yellow?style=flat-square)

Part of **ResearchFlow Lab** — a local-first research productivity ecosystem for literature, manuscripts, data, and scientific visualization.

</div>

---

## 01. Overview

**Scientific Color Lab** is a local-first scientific color workspace for research figures, manuscript illustrations, heatmaps, mechanism diagrams, and online academic documents. It is not a generic color picker; it focuses on research semantics, perceptual structure, accessibility, reproducible export, and publication-oriented figure design.

**Scientific Color Lab** 是一个面向科研图表和论文插图的专业配色工作台。它服务于折线图、散点图、热图、机制图、显微图像、光谱图和论文配色方案的构建、诊断与导出。

---

## 02. Why this project exists

Scientific figures often fail not because the data are weak, but because color choices are inconsistent, non-perceptual, inaccessible, or difficult to reproduce across MATLAB, Python, Origin, PowerPoint, and manuscript figures. Scientific Color Lab provides a controlled workspace for building and checking color systems before they enter the final figure pipeline.

核心目标：

- Build palettes with scientific semantics instead of decorative color choices.
- Diagnose common color risks such as rainbow/jet misuse, red-green conflict, poor luminance order, and category overlap.
- Extract and reconstruct palettes from screenshots, heatmaps, microscopy images, and paper figures.
- Export reusable color assets to MATLAB, Matplotlib, Plotly, CSS, Tailwind, JSON, and CSV.
- Provide a consistent visual style for research software and manuscript figures.

---

## 03. Key features

| Module | What it does | 中文说明 |
|---|---|---|
| Palette Workspace | Builds categorical, sequential, diverging, and cyclic palettes | 构建类别色、顺序色、发散色和循环色图 |
| Scientific Grid | Expands color families into controlled scientific color matrices | 将颜色扩展为有结构的科研配色矩阵 |
| Image Analyzer | Extracts dominant colors from screenshots, figures, heatmaps, and microscopy images | 从截图、图表、热图和显微图中提取主色 |
| Color Diagnostics | Checks jet/rainbow risk, red-green conflict, category overlap, luminance order, and diverging midpoint issues | 检查彩虹色风险、红绿冲突、类别色过近、明度结构和发散中点问题 |
| Palette Reconstruction | Rebuilds raw image colors into cleaner figure-ready palettes | 将原始图片颜色重构为更适合论文表达的调色板 |
| Project Library | Stores palettes, presets, and reusable visual assets | 管理调色板、预设和可复用视觉资产 |
| Export Adapters | Exports JSON, CSV, CSS variables, Tailwind JSON, MATLAB, Matplotlib, Plotly, and text summaries | 导出 JSON、CSV、CSS、Tailwind、MATLAB、Matplotlib、Plotly 等格式 |
| Local Preview | Runs as a local web/PWA workflow for private figure work | 支持本地运行，适合未发表图件和私有数据 |

---

## 04. Product philosophy

Scientific Color Lab follows four design principles:

1. **Perception first** — colors should encode structure, contrast, and visual order.
2. **Research semantics** — palette design should reflect data type and scientific meaning.
3. **Export reproducibility** — colors should be reusable across plotting environments.
4. **Visual discipline** — publication figures should look precise, restrained, and consistent.

---

## 05. Architecture

```text
Scientific Color Lab
├── Workspace UI
│   ├── palette builder
│   ├── scientific grid
│   ├── analyzer
│   └── library
├── Color Engine
│   ├── palette generation
│   ├── colormap construction
│   ├── image color extraction
│   └── diagnostic rules
├── Export Layer
│   ├── JSON / CSV
│   ├── CSS variables
│   ├── Tailwind JSON
│   ├── MATLAB
│   ├── Matplotlib
│   └── Plotly
└── Local Workflow
    ├── project presets
    ├── reusable palettes
    └── browser-based preview
```

---

## 06. Quick start

```bash
git clone https://github.com/groele/Scientific-Color-Lab.git
cd Scientific-Color-Lab
npm install --legacy-peer-deps
npm run build
npm run preview
```

Then open:

```text
http://127.0.0.1:4173/workspace
```

For development:

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:5173/workspace
```

---

## 07. Recommended workflow

```text
Choose figure type → Build palette / colormap
                   → Run color diagnostics
                   → Export to MATLAB / Matplotlib / CSS
                   → Apply to manuscript figure
                   → Store reusable palette in library
```

Typical use cases:

- Designing publication-ready line and scatter plot palettes.
- Replacing risky rainbow/jet colormaps in heatmaps.
- Extracting color systems from existing manuscript figures.
- Building a consistent visual identity across a paper or project.
- Exporting exact color values into MATLAB or Python plotting scripts.

---

## 08. Project structure

```text
Scientific-Color-Lab
├── artifacts/
│   ├── studio-swatches.png
│   ├── studio-grid.png
│   ├── analyzer-png.png
│   └── library.png
├── source files
├── package.json
├── startup scripts
└── README.md
```

---

## 09. Roadmap

- [ ] Add color-blindness simulation and export report
- [ ] Add perceptual-uniformity scoring for colormaps
- [ ] Add manuscript-level palette packs
- [ ] Add direct MATLAB `.m` palette export templates
- [ ] Add Origin-compatible palette exports
- [ ] Add journal-style presets for Nature / Science / ACS / Wiley-like figure aesthetics
- [ ] Add image-to-palette comparison across multiple figures in one manuscript

---

## 10. Privacy and data ownership

Scientific Color Lab is designed for local-first use. Uploaded or analyzed images should remain within the local application workflow unless the user manually exports or shares them. Unpublished figures and manuscript screenshots should not be uploaded to external services without explicit user control.

---

## 11. Related projects

- **ResearchFlow Companion** — research workflow operating system
- **Witec-Matlab** — spectroscopy data analysis workflow
- **ManuGuide** — Microsoft Word manuscript formatting and style checker
- **PaperPilot Pro** — academic search and publisher-page enhancement
- **ClipNote** — browser-native quick notes and Markdown capture

---

## 12. License

MIT License.

Developed by **Shikun Hou / groele**.
