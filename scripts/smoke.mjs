import { startServer } from '../apps/server/dist/index.js'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
const server = await startServer({ dataDir: resolve('.cloudmusic') })
try {
  const base = `http://127.0.0.1:${server.port}`
  for (const path of ['/', '/playlist/123', '/search?q=test']) {
    const response = await fetch(base + path, {
      headers: { 'x-app-token': server.token },
    })
    assert.equal(response.status, 200)
    assert.match(await response.text(), /<div id="root"><\/div>/)
    console.log(`OK SPA ${path}`)
  }
  assert.equal((await fetch(`${base}/api/setup`)).status, 401)
  const exchange = await fetch(`${base}/?t=${server.token}`, {
    redirect: 'manual',
  })
  assert.equal(exchange.status, 302)
  assert.match(exchange.headers.get('set-cookie'), /HttpOnly/)
  console.log('OK production authentication')
} finally {
  await server.close()
}
