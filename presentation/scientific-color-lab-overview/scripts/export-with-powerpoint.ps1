param(
  [string]$PptxPath = (Join-Path $PSScriptRoot "..\\scientific-color-lab-overview.pptx"),
  [string]$PdfPath = (Join-Path $PSScriptRoot "..\\scientific-color-lab-overview.pdf"),
  [string]$RenderedDir = (Join-Path $PSScriptRoot "..\\rendered")
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $PptxPath)) {
  throw "PPTX not found: $PptxPath"
}

New-Item -ItemType Directory -Force -Path $RenderedDir | Out-Null
$tempRoot = "D:\\temp_scl_ppt_export"
$tempRendered = Join-Path $tempRoot "rendered"
$tempPptxPath = Join-Path $tempRoot "scientific-color-lab-overview.pptx"
$tempPdfPath = Join-Path $tempRoot "scientific-color-lab-overview.pdf"

if (Test-Path $tempRoot) {
  Remove-Item -Recurse -Force $tempRoot
}
New-Item -ItemType Directory -Force -Path $tempRendered | Out-Null
Copy-Item -Force $PptxPath $tempPptxPath

if (Test-Path $RenderedDir) {
  Get-ChildItem -Path $RenderedDir -File | Remove-Item -Force
}

$powerPoint = $null
$presentation = $null

try {
  $powerPoint = New-Object -ComObject PowerPoint.Application
  $powerPoint.Visible = 1
  $presentation = $powerPoint.Presentations.Open($tempPptxPath, $false, $false, $false)
  $presentation.SaveAs($tempPdfPath, 32)
  $presentation.Export($tempRendered, "PNG", 1920, 1080)
}
finally {
  if ($presentation) {
    $presentation.Close()
  }
  if ($powerPoint) {
    $powerPoint.Quit()
  }
}

Copy-Item -Force $tempPdfPath $PdfPath
Get-ChildItem -Path $tempRendered -Filter "*.PNG" | ForEach-Object {
  Copy-Item -Force $_.FullName (Join-Path $RenderedDir $_.Name.ToLower())
}
