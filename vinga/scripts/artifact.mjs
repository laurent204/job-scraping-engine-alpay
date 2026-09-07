/**
 * Turns the single-file build (dist-artifact/index.html) into a body-only
 * fragment suitable for publishing platforms that provide their own
 * <!doctype>/<head>/<body> skeleton: strips the document wrapper and
 * meta/link tags, keeps <title>, inlined <style> and <script>, and #root.
 *
 * Wrapper tags are only stripped OUTSIDE the inline <script> region —
 * the bundled JS legitimately contains strings like
 * "#include <metalnessmap_fragment>" (three.js shader chunks) that a
 * whole-file regex would destroy.
 *
 * Usage: node scripts/artifact.mjs <outFile>
 */
import { readFileSync, writeFileSync } from 'node:fs'

const out = process.argv[2]
if (!out) {
  console.error('usage: node scripts/artifact.mjs <outFile>')
  process.exit(1)
}

const html = readFileSync('dist-artifact/index.html', 'utf8')

const firstScript = html.search(/<script/i)
const lastScriptEnd = html.lastIndexOf('</script>') + '</script>'.length
if (firstScript === -1 || lastScriptEnd < firstScript) {
  console.error('no <script> region found — unexpected build output')
  process.exit(1)
}

const stripWrapper = (s) =>
  s
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<\/?html[^>]*>/gi, '')
    .replace(/<\/?head[^>]*>/gi, '')
    .replace(/<\/?body[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')

const head = stripWrapper(html.slice(0, firstScript)).trim()
const scripts = html.slice(firstScript, lastScriptEnd)
const tail = stripWrapper(html.slice(lastScriptEnd)).trim()

const result = `${head}\n${scripts}\n${tail}`
writeFileSync(out, result)
console.log(`${out}: ${(result.length / 1024 / 1024).toFixed(2)} MB`)
