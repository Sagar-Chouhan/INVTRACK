import http from 'http'

function check(host) {
  return new Promise((resolve) => {
    const options = { host, port: 4000, path: '/api/health', method: 'GET', timeout: 3000 }
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => resolve({ ok: true, host, statusCode: res.statusCode, body: data }))
    })
    req.on('error', (err) => resolve({ ok: false, host, error: err.message }))
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, host, error: 'timeout' }) })
    req.end()
  })
}

async function run() {
  console.log('Checking localhost and 127.0.0.1 on port 4000...')
  const hosts = ['localhost', '127.0.0.1', '::1']
  for (const h of hosts) {
    const r = await check(h)
    console.log(JSON.stringify(r))
  }
}

run()
