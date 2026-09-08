#!/usr/bin/env node
/**
 * Re-verify every address in src/config/tokens.ts against Robinhood Chain.
 * Run before every release: the token beacon is upgradeable, and a token list
 * that was right in September can be wrong in December.
 *
 *   node scripts/verify-tokens.mjs
 *
 * Exits non-zero if any token fails, so it can gate CI.
 */
import { readFileSync } from 'node:fs'
import { request } from 'node:https'

const RPC_HOST = 'rpc.mainnet.chain.robinhood.com'
const BEACON_SLOT = '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50' // ERC-1967
const OFFICIAL_BEACON = '0xe10b6f6b275de231345c20d14ab812db62151b00'
const SELECTOR = { symbol: '0x95d89b41', decimals: '0x313ce567', uiMultiplier: '0xa60bf13d' }

function rpc(method, params) {
  const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  return new Promise((resolve, reject) => {
    const req = request(
      { hostname: RPC_HOST, path: '/', method: 'POST',
        headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } },
      (res) => {
        let raw = ''
        res.on('data', (c) => (raw += c))
        res.on('end', () => {
          try {
            const body = JSON.parse(raw)
            body.error ? reject(new Error(body.error.message)) : resolve(body.result)
          } catch (err) { reject(err) }
        })
      },
    )
    req.on('error', reject)
    req.end(payload)
  })
}

function decodeString(hex) {
  if (!hex || hex === '0x') return null
  const buf = Buffer.from(hex.slice(2), 'hex')
  if (buf.length < 64) return null
  const len = Number(BigInt('0x' + buf.subarray(32, 64).toString('hex')))
  return len > 0 && len <= buf.length - 64 ? buf.subarray(64, 64 + len).toString('utf8') : null
}

const source = readFileSync(new URL('../src/config/tokens.ts', import.meta.url), 'utf8')
const tokens = [...source.matchAll(/ticker: '([^']+)', address: '(0x[0-9a-fA-F]{40})'/g)]
  .map(([, ticker, address]) => ({ ticker, address }))

const chainId = await rpc('eth_chainId', [])
if (chainId !== '0x1237') {
  console.error(`Wrong chain: expected 0x1237 (4663), got ${chainId}`)
  process.exit(1)
}
console.log(`Robinhood Chain ${parseInt(chainId, 16)} · verifying ${tokens.length} tokens\n`)

const failures = []
for (const token of tokens) {
  const slot = await rpc('eth_getStorageAt', [token.address, BEACON_SLOT, 'latest'])
  const beacon = slot && BigInt(slot) !== 0n ? '0x' + slot.slice(-40) : null
  const symbol = decodeString(await rpc('eth_call', [{ to: token.address, data: SELECTOR.symbol }, 'latest']))
  const decimalsHex = await rpc('eth_call', [{ to: token.address, data: SELECTOR.decimals }, 'latest'])
  const decimals = decimalsHex && decimalsHex !== '0x' ? Number(BigInt(decimalsHex)) : null
  const multiplierHex = await rpc('eth_call', [{ to: token.address, data: SELECTOR.uiMultiplier }, 'latest']).catch(() => null)
  const multiplier = multiplierHex && multiplierHex !== '0x' ? Number(BigInt(multiplierHex)) / 1e18 : null

  const problems = []
  if (beacon !== OFFICIAL_BEACON) problems.push(`beacon ${beacon ?? 'missing'}`)
  if (symbol !== token.ticker) problems.push(`symbol ${symbol}`)
  if (decimals !== 18) problems.push(`decimals ${decimals}`)

  if (problems.length) {
    failures.push({ ...token, problems })
    console.log(`FAIL  ${token.ticker.padEnd(6)} ${problems.join(', ')}`)
  } else {
    console.log(`ok    ${token.ticker.padEnd(6)} multiplier ${multiplier?.toFixed(8) ?? 'n/a'}`)
  }
}

if (failures.length) {
  console.error(`\n${failures.length} token(s) failed verification. Do not ship this registry.`)
  process.exit(1)
}
console.log(`\nAll ${tokens.length} tokens verified against beacon ${OFFICIAL_BEACON}.`)
