// packages/tooling/scripts/verify-cloud-deploy.mjs
// Principal DevOps & QA Cloud Deployment Verification Suite for TrustPassz

const SERVER_URL = process.env.SERVER_URL || 'https://trustpassz-server.onrender.com';
const PIPELINE_URL = process.env.PIPELINE_URL || 'https://trustpassz-ai-pipeline.onrender.com';
const CL_USER_URL = process.env.CL_USER_URL || 'https://trustpassz-cl-user.vercel.app';
const CL_ADMIN_URL = process.env.CL_ADMIN_URL || 'https://trustpassz-cl-admin.vercel.app';
const EXPECTED_CONTRACT = '0xef976eb14fdba8cb722789b451e2b9f903005c26';

const results = {
  server: {},
  pipeline: {},
  cl_user: {},
  cl_admin: {},
  cors_auth: {},
  payos_webhook: {},
  swagger: {}
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, maxRetries = 3, delayMs = 10000, timeoutMs = 45000) {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    const start = Date.now();
    try {
      console.log(`[HTTP PROBE] Attempt ${attempt}/${maxRetries}: ${options.method || 'GET'} ${url}`);
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(timeoutMs)
      });
      const latencyMs = Date.now() - start;
      const contentType = res.headers.get('content-type') || '';
      let body;
      if (contentType.includes('application/json')) {
        body = await res.json();
      } else {
        body = await res.text();
      }
      return { ok: true, status: res.status, headers: res.headers, body, latencyMs, attempt };
    } catch (err) {
      const latencyMs = Date.now() - start;
      console.warn(`[HTTP RETRY] Attempt ${attempt} failed after ${latencyMs}ms: ${err.message}`);
      if (attempt < maxRetries) {
        console.log(`[WAIT] Sleeping ${delayMs / 1000}s for cold-start...`);
        await sleep(delayMs);
      } else {
        return { ok: false, error: err.message, latencyMs, attempt };
      }
    }
  }
}

async function runVerification() {
  console.log('======================================================================');
  console.log(' TRUSTPASSZ CLOUD DEPLOYMENT VERIFICATION');
  console.log(' Server   : ' + SERVER_URL);
  console.log(' Pipeline : ' + PIPELINE_URL);
  console.log(' Cl User  : ' + CL_USER_URL);
  console.log(' Cl Admin : ' + CL_ADMIN_URL);
  console.log(' Contract : ' + EXPECTED_CONTRACT);
  console.log('======================================================================\n');

  // 1. Backend Server - Health check (standard & deep)
  console.log('--- 1. Backend Server Health Checks ---');
  const healthRes = await fetchWithRetry(`${SERVER_URL}/api/v1/health`, {}, 3, 10000, 45000);
  results.server.lightweight = healthRes;
  console.log('Lightweight Health Result:', JSON.stringify({
    status: healthRes.status,
    body: healthRes.body,
    latencyMs: healthRes.latencyMs
  }, null, 2));

  const deepHealthRes = await fetchWithRetry(`${SERVER_URL}/api/v1/health?deep=true`, {}, 3, 10000, 45000);
  results.server.deep = deepHealthRes;
  console.log('Deep Health Result:', JSON.stringify({
    status: deepHealthRes.status,
    body: deepHealthRes.body,
    latencyMs: deepHealthRes.latencyMs
  }, null, 2));

  // Swagger Docs
  console.log('\n--- 1b. Backend Swagger UI Docs ---');
  const docsRes = await fetchWithRetry(`${SERVER_URL}/docs`, {}, 2, 5000, 30000);
  results.swagger = {
    status: docsRes.status,
    ok: docsRes.status === 200,
    isHtml: docsRes.headers?.get('content-type')?.includes('text/html'),
    latencyMs: docsRes.latencyMs
  };
  console.log('Swagger Docs Result:', results.swagger);

  // 2. AI Pipeline
  console.log('\n--- 2. AI Pipeline Health Check ---');
  const pipelineRes = await fetchWithRetry(`${PIPELINE_URL}/health`, {}, 3, 10000, 45000);
  results.pipeline = {
    status: pipelineRes.status,
    body: pipelineRes.body,
    latencyMs: pipelineRes.latencyMs,
    attempt: pipelineRes.attempt
  };
  console.log('AI Pipeline Result:', JSON.stringify(results.pipeline, null, 2));

  // 3. Frontend Clients
  console.log('\n--- 3. Frontend Clients Probes ---');
  const userRoutes = ['/', '/login', '/explore'];
  results.cl_user.routes = {};
  for (const route of userRoutes) {
    const r = await fetchWithRetry(`${CL_USER_URL}${route}`, { redirect: 'manual' }, 2, 5000, 25000);
    const bodyStr = typeof r.body === 'string' ? r.body : JSON.stringify(r.body || '');
    results.cl_user.routes[route] = {
      status: r.status,
      hasPreReleaseBanner: bodyStr.includes('[PRE-RELEASE TESTNET') || bodyStr.includes('PRE-RELEASE TESTNET') || bodyStr.includes('Pre-release') || bodyStr.includes('pre-release'),
      hasLocalhost: bodyStr.includes('http://localhost'),
      location: r.headers?.get('location') || null
    };
  }
  console.log('Client User Routes Result:', results.cl_user.routes);

  const adminRoutes = ['/', '/login', '/admin'];
  results.cl_admin.routes = {};
  for (const route of adminRoutes) {
    const r = await fetchWithRetry(`${CL_ADMIN_URL}${route}`, { redirect: 'manual' }, 2, 5000, 25000);
    const bodyStr = typeof r.body === 'string' ? r.body : JSON.stringify(r.body || '');
    results.cl_admin.routes[route] = {
      status: r.status,
      hasPreReleaseBanner: bodyStr.includes('[PRE-RELEASE TESTNET') || bodyStr.includes('PRE-RELEASE TESTNET') || bodyStr.includes('Pre-release') || bodyStr.includes('pre-release'),
      hasLocalhost: bodyStr.includes('http://localhost'),
      location: r.headers?.get('location') || null
    };
  }
  console.log('Client Admin Routes Result:', results.cl_admin.routes);

  // 4. CORS & Auth verification
  console.log('\n--- 4. CORS & Auth Verification ---');
  const origins = [
    { name: 'cl_user', origin: CL_USER_URL },
    { name: 'cl_admin', origin: CL_ADMIN_URL }
  ];
  for (const item of origins) {
    // OPTIONS preflight
    const preflight = await fetchWithRetry(`${SERVER_URL}/api/v1/auth/verify`, {
      method: 'OPTIONS',
      headers: {
        'Origin': item.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    }, 2, 5000, 20000);

    const allowOrigin = preflight.headers?.get('access-control-allow-origin');
    
    // POST request simulation
    const postReq = await fetchWithRetry(`${SERVER_URL}/api/v1/auth/verify`, {
      method: 'POST',
      headers: {
        'Origin': item.origin,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: 'test-synthetic-smoke-token' })
    }, 2, 5000, 20000);

    results.cors_auth[item.name] = {
      origin: item.origin,
      preflightStatus: preflight.status,
      allowOriginHeader: allowOrigin,
      postStatus: postReq.status,
      postAllowOriginHeader: postReq.headers?.get('access-control-allow-origin'),
      postBody: postReq.body
    };
  }
  console.log('CORS & Auth Result:', JSON.stringify(results.cors_auth, null, 2));

  // 5. PayOS Webhook Endpoint
  console.log('\n--- 5. PayOS Webhook Endpoint ---');
  const webhookRes = await fetchWithRetry(`${SERVER_URL}/api/v1/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: '00',
      desc: 'Test ping',
      data: { orderCode: 12345, amount: 1000 }
    })
  }, 2, 5000, 20000);

  results.payos_webhook = {
    status: webhookRes.status,
    body: webhookRes.body,
    isNot404: webhookRes.status !== 404
  };
  console.log('PayOS Webhook Result:', JSON.stringify(results.payos_webhook, null, 2));

  console.log('\n======================================================================');
  console.log(' VERIFICATION COMPLETE');
  console.log('======================================================================');
}

runVerification();
