/**
 * Screenshot harness — drives the real app in headless Chromium and
 * captures every key screen at iPhone size. Also used as a smoke test:
 * it plays a full lesson by solving exercises through the QA bridge.
 *
 * Usage: node scripts/shots.mjs [outDir] [baseUrl]
 */
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const OUT = process.argv[2] ?? 'shots'
const BASE = process.argv[3] ?? 'http://localhost:4173'
mkdirSync(OUT, { recursive: true })

const RICH_STATE = {
  state: {
    onboarded: true,
    goalMin: 10,
    sound: true,
    neuralDeclined: true,
    xp: 385,
    todayXp: { day: today(), xp: 60 },
    streak: { count: 6, lastDay: today() },
    lessonsDone: {
      'hola-1': { best: 1, times: 1 },
      'hola-2': { best: 0.9, times: 1 },
      'hola-3': { best: 0.95, times: 2 },
      'hola-dialogue': { best: 1, times: 1 },
      'nombres-1': { best: 0.85, times: 1 },
      'nombres-2': { best: 0.9, times: 1 },
      'nombres-3': { best: 1, times: 1 },
      'nombres-dialogue': { best: 1, times: 1 },
      'rest-1': { best: 0.9, times: 1 },
    },
    srs: srsFor(
      ['hola', 'bon-dia', 'adeu', 'gracies', 'sisplau', 'de-res', 'perdo', 'com-estas', 'molt-be', 'em-dic',
       'u', 'dos', 'tres', 'quatre', 'cinc', 'vuit', 'deu', 'vint', 'quant-val', 'taula-per-dos', 'la-carta', 'tinc-gana'],
    ),
  },
  version: 0,
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function srsFor(ids) {
  const now = Date.now()
  const out = {}
  ids.forEach((id, i) => {
    out[id] = { due: i < 8 ? now - 1000 : now + 86400000, ivl: 86400000, seen: 1, lapses: 0 }
  })
  return out
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

async function newPage(state) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  if (state) {
    await ctx.addInitScript((s) => localStorage.setItem('vinga-v1', JSON.stringify(s)), state)
  }
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  return { ctx, page }
}

async function shot(page, name, delay = 600) {
  await page.waitForTimeout(delay)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log('📸', name)
}

/* ---------- 1. onboarding ---------- */
{
  const { ctx, page } = await newPage(null)
  await shot(page, '01-onboarding-1', 1400)
  await page.getByRole('button', { name: 'Continuer' }).click()
  await shot(page, '02-onboarding-2', 900)
  await page.getByRole('button', { name: 'Continuer' }).click()
  await shot(page, '03-onboarding-3', 900)
  await ctx.close()
}

/* ---------- 2. fresh home (+ voice banner & its offline error state) ---------- */
{
  const { ctx, page } = await newPage({ state: { onboarded: true, goalMin: 10, sound: true, neuralDeclined: false, xp: 0, todayXp: { day: today(), xp: 0 }, streak: { count: 0, lastDay: '' }, lessonsDone: {}, srs: {} }, version: 0 })
  await shot(page, '04-home-fresh', 2200)
  const activate = page.getByRole('button', { name: 'Activer la voix' })
  if (await activate.count()) {
    await activate.click()
    await page.waitForTimeout(2500)
    await shot(page, '16-voice-error', 400)
  }
  await ctx.close()
}

/* ---------- 3. rich home + tabs ---------- */
{
  const { ctx, page } = await newPage(RICH_STATE)
  await shot(page, '05-home-rich', 1600)
  await page.getByRole('button', { name: 'Repàs' }).click()
  await shot(page, '06-repas', 900)
  await page.getByRole('button', { name: 'Perfil' }).click()
  await shot(page, '07-perfil', 1400)
  await ctx.close()
}

/* ---------- 4. full lesson playthrough (solved via QA bridge) ---------- */
{
  const { ctx, page } = await newPage({ state: { ...RICH_STATE.state, lessonsDone: {} }, version: 0 })
  await page.evaluate(() => window.__vinga.store.getState().openLesson('rest-2'))
  await page.waitForTimeout(800)
  await shot(page, '08-lesson-discover', 500)

  const words = await page.evaluate(() => window.__vinga.words)
  const byFr = new Map(words.map((w) => [w.fr, w]))
  const byCa = new Map(words.map((w) => [w.ca, w]))
  const exByFr = new Map(words.filter((w) => w.ex).map((w) => [w.ex.fr, w.ex.ca]))

  let qcmShot = false
  let pairsShot = false
  let buildShot = false
  let feedbackShot = false
  let echoShot = false

  for (let step = 0; step < 200; step++) {
    await page.waitForTimeout(260)
    if (await page.locator('.complete').count()) break

    // feedback banner open → continue
    if (await page.locator('.feedback').count()) {
      if (!feedbackShot) {
        await shot(page, '11-lesson-feedback', 200)
        feedbackShot = true
      }
      await page.locator('.feedback .btn').click({ timeout: 3000 }).catch(() => {})
      continue
    }
    // discover card
    if (await page.getByRole('button', { name: 'Compris !' }).count()) {
      await page.getByRole('button', { name: 'Compris !' }).first().click({ timeout: 2500 }).catch(() => {})
      continue
    }
    // echo (pronunciation) → self-validate
    if (await page.locator('.echo').count()) {
      if (!echoShot) {
        await shot(page, '10b-lesson-echo', 300)
        echoShot = true
      }
      await page.locator('.echo-skip').click({ timeout: 3000 }).catch(() => {})
      continue
    }
    // pairs
    if (await page.locator('.pairs').count()) {
      if (!pairsShot) {
        await shot(page, '09-lesson-pairs', 300)
        pairsShot = true
      }
      const left = page.locator('.pairs-col').first().locator('.chip:not(.is-matched)')
      if ((await left.count()) === 0) continue
      const caText = (await left.first().innerText()).trim()
      const frText = byCa.get(caText)?.fr
      await left.first().click({ timeout: 2500 }).catch(() => {})
      await page
        .locator('.pairs-col')
        .nth(1)
        .locator('.chip', { hasText: frText })
        .first()
        .click({ timeout: 2500 })
        .catch(() => {})
      continue
    }
    // build
    if (await page.locator('.build-pool').count()) {
      const fr = (await page.locator('.build-fr').innerText()).replace(/[«»]/g, '').trim()
      const ca = exByFr.get(fr)
      const chips = (ca ?? '').replace(/[.!?…]/g, '').split(' ').filter(Boolean)
      if (!buildShot) {
        await shot(page, '10-lesson-build', 300)
        buildShot = true
      }
      for (const c of chips) {
        await page
          .locator('.build-pool .word-chip:not(.is-used)', { hasText: new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) })
          .first()
          .click({ timeout: 2500 })
          .catch(() => {})
        await page.waitForTimeout(120)
      }
      await page.getByRole('button', { name: 'Vérifier' }).click({ timeout: 2500 }).catch(() => {})
      continue
    }
    // qcm / listen
    if (await page.locator('.ex-options .chip').count()) {
      const kind = (await page.locator('.ex-kind').innerText()).trim().toLowerCase()
      const promptText = (await page.locator('.ex-prompt-word').innerText()).trim()
      let target
      if (kind.includes('comment dit-on')) target = byFr.get(promptText)?.ca
      else target = byCa.get(promptText)?.fr
      const chip = target
        ? page.locator('.ex-options .chip', { hasText: target }).first()
        : page.locator('.ex-options .chip').first()
      await chip.click({ timeout: 2500 }).catch(() => {})
      if (!qcmShot) {
        await shot(page, '08b-lesson-qcm', 200)
        qcmShot = true
      }
      await page.getByRole('button', { name: 'Vérifier' }).click({ timeout: 2500 }).catch(() => {})
      continue
    }
  }
  await shot(page, '12-lesson-complete', 1200)
  await ctx.close()
}

/* ---------- 5. dialogue ---------- */
{
  const { ctx, page } = await newPage(RICH_STATE)
  await page.evaluate(() => window.__vinga.store.getState().openLesson('rest-dialogue'))
  await page.waitForTimeout(2500)
  // answer the first two turns correctly
  const answers = ['Una taula per a dos, si us plau.', 'Gràcies! Què em recomana?', 'Voldria pa amb tomàquet i vi negre.']
  for (const a of answers) {
    const chip = page.locator('.dlg-chip', { hasText: a })
    try {
      await chip.waitFor({ timeout: 6000 })
      await chip.click()
      await page.waitForTimeout(2200)
    } catch {
      break
    }
  }
  await shot(page, '13-dialogue', 800)
  await ctx.close()
}

/* ---------- 6. artwork 2 (the bench) + A2 modules ---------- */
{
  const done = {}
  for (const m of ['hola', 'nombres', 'rest', 'mercat', 'carrer', 'temps']) {
    for (const s of ['1', '2', '3', 'dialogue']) done[`${m}-${s}`] = { best: 0.94, times: 1 }
  }
  done['familia-1'] = { best: 0.9, times: 1 }
  done['familia-2'] = { best: 1, times: 1 }
  const { ctx, page } = await newPage({
    state: { ...RICH_STATE.state, xp: 1240, streak: { count: 18, lastDay: today() }, lessonsDone: done },
    version: 0,
  })
  await shot(page, '14-artwork-banc', 1800)
  await page.locator('.home').evaluate((el) => el.scrollTo(0, el.scrollHeight))
  await shot(page, '15-ruta-a2', 900)
  await ctx.close()
}

await browser.close()
console.log('✅ done —', OUT)
