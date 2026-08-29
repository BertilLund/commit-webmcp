param(
  [string]$Voice = 'Microsoft David Desktop',
  [int]$Rate = 0,
  [string]$Transcript = (Join-Path $PSScriptRoot '..\submission\media\commit-narration-current.txt'),
  [string]$Output = (Join-Path $PSScriptRoot '..\submission\media\commit-narration-current.wav')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech

$paragraphs = (Get-Content -Raw -LiteralPath $Transcript).Trim() -split "\r?\n\r?\n"
$breaks = @(2000, 8000, 22000, 2000, 8000, 7000, 1000, 0)
if ($paragraphs.Count -ne $breaks.Count) {
  throw "Expected $($breaks.Count) narration paragraphs, found $($paragraphs.Count)."
}

$body = for ($index = 0; $index -lt $paragraphs.Count; $index += 1) {
  [Security.SecurityElement]::Escape($paragraphs[$index])
  if ($breaks[$index] -gt 0) { "<break time='$($breaks[$index])ms'/>" }
}
$ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='$Voice'>$($body -join ' ')</voice></speak>"

$synth = [System.Speech.Synthesis.SpeechSynthesizer]::new()
try {
  $synth.SelectVoice($Voice)
  $synth.Rate = $Rate
  $synth.SetOutputToWaveFile($Output)
  $synth.SpeakSsml($ssml)
} finally {
  $synth.Dispose()
}

Get-Item -LiteralPath $Output | Select-Object FullName, Length, LastWriteTime
