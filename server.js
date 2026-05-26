/**
 * MLM SaaS Platform — Servidor de Producción
 * Zero dependencies: solo módulos nativos de Node.js
 * Ejecutar: node server.js
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'mlm_saas_super_secret_2024_cambiar_en_produccion';
const DB_PATH = path.join(__dirname, 'data', 'db.json');

// ─────────────────────────────────────────────────────────────
// BASE DE DATOS JSON (en memoria + persistencia a archivo)
// ─────────────────────────────────────────────────────────────
class JsonDB {
  constructor(filePath) {
    this.path = filePath;
    this.data = this._load();
  }

  _load() {
    try {
      if (!fs.existsSync(path.dirname(this.path))) {
        fs.mkdirSync(path.dirname(this.path), { recursive: true });
      }
      if (fs.existsSync(this.path)) {
        return JSON.parse(fs.readFileSync(this.path, 'utf8'));
      }
    } catch {}
    return this._seed();
  }

  _seed() {
    const adminPassword = this._hashPassword('Admin123!');
    const data = {
      tenants: [
        { id: 'tenant_1', name: 'Equipo Alpha MLM', slug: 'alpha-mlm', plan: 'PRO', status: 'active', createdAt: '2024-01-15', usersCount: 12, leadsCount: 847, mrr: 299, logoUrl: null },
        { id: 'tenant_2', name: 'Marketing Afiliados Pro', slug: 'mkt-afiliados', plan: 'BUSINESS', status: 'active', createdAt: '2024-02-03', usersCount: 34, leadsCount: 3204, mrr: 599, logoUrl: null },
        { id: 'tenant_3', name: 'Red de Distribución Nacional', slug: 'red-dist', plan: 'STARTER', status: 'trial', createdAt: '2024-05-01', usersCount: 3, leadsCount: 45, mrr: 0, logoUrl: null },
        { id: 'tenant_4', name: 'Ventas Directas Corp', slug: 'ventas-corp', plan: 'PRO', status: 'active', createdAt: '2024-03-12', usersCount: 8, leadsCount: 521, mrr: 299, logoUrl: null },
        { id: 'tenant_5', name: 'Afiliados Digital Hub', slug: 'afiliados-hub', plan: 'BUSINESS', status: 'active', createdAt: '2024-04-08', usersCount: 21, leadsCount: 1893, mrr: 599, logoUrl: null },
        { id: 'tenant_6', name: 'MLM Express', slug: 'mlm-express', plan: 'STARTER', status: 'suspended', createdAt: '2024-01-20', usersCount: 2, leadsCount: 89, mrr: 0, logoUrl: null },
      ],
      users: [
        { id: 'user_super', tenantId: null, email: 'super@mlmsaas.com', password: adminPassword, firstName: 'Super', lastName: 'Admin', role: 'SUPER_ADMIN', isActive: true, createdAt: '2024-01-01' },
        { id: 'user_1', tenantId: 'tenant_1', email: 'admin@alpha-mlm.com', password: adminPassword, firstName: 'María', lastName: 'González', role: 'AGENCY_ADMIN', isActive: true, createdAt: '2024-01-15' },
        { id: 'user_2', tenantId: 'tenant_2', email: 'admin@mkt-afiliados.com', password: adminPassword, firstName: 'Carlos', lastName: 'Rodríguez', role: 'AGENCY_ADMIN', isActive: true, createdAt: '2024-02-03' },
        { id: 'user_3', tenantId: 'tenant_1', email: 'lider@alpha-mlm.com', password: adminPassword, firstName: 'Ana', lastName: 'Martínez', role: 'MLM_LEADER', isActive: true, createdAt: '2024-01-20' },
        { id: 'user_4', tenantId: 'tenant_3', email: 'admin@red-dist.com', password: adminPassword, firstName: 'Pedro', lastName: 'Sánchez', role: 'AGENCY_ADMIN', isActive: true, createdAt: '2024-05-01' },
      ],
      leads: [],
      campaigns: [
        { id: 'camp_1', tenantId: 'tenant_1', name: 'Campaña Meta Verano', platform: 'META', status: 'ACTIVE', spend: 1250.50, leads: 234, conversions: 18, cpc: 5.34, ctr: 2.8, roas: 3.2, createdAt: '2024-05-01' },
        { id: 'camp_2', tenantId: 'tenant_2', name: 'TikTok Afiliados Q2', platform: 'TIKTOK', status: 'ACTIVE', spend: 3400.00, leads: 892, conversions: 67, cpc: 3.81, ctr: 4.1, roas: 5.8, createdAt: '2024-04-15' },
        { id: 'camp_3', tenantId: 'tenant_4', name: 'Meta Leads Mayo', platform: 'META', status: 'PAUSED', spend: 780.00, leads: 123, conversions: 9, cpc: 6.34, ctr: 1.9, roas: 2.1, createdAt: '2024-05-10' },
      ],
      refreshTokens: [],
      analytics: {
        revenueByMonth: [
          { month: 'Ene', mrr: 1200 }, { month: 'Feb', mrr: 1800 }, { month: 'Mar', mrr: 2400 },
          { month: 'Abr', mrr: 3100 }, { month: 'May', mrr: 3800 }, { month: 'Jun', mrr: 4600 },
        ],
        leadsPerDay: [
          { day: 'Lun', leads: 145 }, { day: 'Mar', leads: 223 }, { day: 'Mié', leads: 189 },
          { day: 'Jue', leads: 312 }, { day: 'Vie', leads: 287 }, { day: 'Sáb', leads: 167 }, { day: 'Dom', leads: 98 },
        ],
      },
    };
    this._save(data);
    return data;
  }

  _hashPassword(password) {
    return crypto.pbkdf2Sync(password, 'mlm_salt_2024', 100000, 64, 'sha512').toString('hex');
  }

  verifyPassword(password, hash) {
    const hashed = this._hashPassword(password);
    return crypto.timingSafeEqual(Buffer.from(hashed), Buffer.from(hash));
  }

  _save(data) {
    try { fs.writeFileSync(this.path, JSON.stringify(data, null, 2)); } catch {}
  }

  get(collection) { return this.data[collection] || []; }

  findOne(collection, predicate) {
    return (this.data[collection] || []).find(predicate);
  }

  create(collection, item) {
    if (!this.data[collection]) this.data[collection] = [];
    const newItem = { id: `${collection}_${Date.now()}`, createdAt: new Date().toISOString(), ...item };
    this.data[collection].push(newItem);
    this._save(this.data);
    return newItem;
  }

  update(collection, id, updates) {
    const idx = (this.data[collection] || []).findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.data[collection][idx] = { ...this.data[collection][idx], ...updates, updatedAt: new Date().toISOString() };
    this._save(this.data);
    return this.data[collection][idx];
  }

  delete(collection, id) {
    const before = (this.data[collection] || []).length;
    this.data[collection] = (this.data[collection] || []).filter(i => i.id !== id);
    this._save(this.data);
    return before !== this.data[collection].length;
  }

  stats() {
    const tenants = this.data.tenants || [];
    const users = this.data.users || [];
    const leads = this.data.leads || [];
    const campaigns = this.data.campaigns || [];
    const mrr = tenants.filter(t => t.status === 'active').reduce((s, t) => s + (t.mrr || 0), 0);
    return {
      tenants: { total: tenants.length, active: tenants.filter(t => t.status === 'active').length, trial: tenants.filter(t => t.status === 'trial').length, suspended: tenants.filter(t => t.status === 'suspended').length },
      users: { total: users.length, admins: users.filter(u => u.role === 'AGENCY_ADMIN').length },
      leads: { total: leads.length + tenants.reduce((s, t) => s + (t.leadsCount || 0), 0) },
      campaigns: { total: campaigns.length, active: campaigns.filter(c => c.status === 'ACTIVE').length },
      mrr, arr: mrr * 12,
      revenue: this.data.analytics,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// JWT NATIVO (sin dependencias)
// ─────────────────────────────────────────────────────────────
const JWT = {
  sign(payload, expiresIn = 3600) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + expiresIn * 1000 })).toString('base64url');
    const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${sig}`;
  },
  verify(token) {
    try {
      const [header, body, sig] = token.split('.');
      const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
      if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
      if (payload.exp < Date.now()) return null;
      return payload;
    } catch { return null; }
  },
};

// ─────────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────────
const db = new JsonDB(DB_PATH);

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); } });
  });
}

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });
  res.end(JSON.stringify(data));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  const mimes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon' };
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mimes[ext] || 'text/plain' });
    res.end(content);
  } catch {
    send(res, 404, { error: 'Not found' });
  }
}

function authMiddleware(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  return JWT.verify(authHeader.slice(7));
}

// ─────────────────────────────────────────────────────────────
// RUTAS API
// ─────────────────────────────────────────────────────────────
async function handleAPI(req, res, pathname) {
  const method = req.method;
  const segments = pathname.replace('/api/v1/', '').split('/');
  const [resource, id, action] = segments;

  // ─ POST /api/v1/auth/login
  if (resource === 'auth' && id === 'login' && method === 'POST') {
    const { email, password } = await parseBody(req);
    const user = db.findOne('users', u => u.email === email);
    if (!user || !db.verifyPassword(password, user.password)) return send(res, 401, { message: 'Credenciales incorrectas' });
    if (!user.isActive) return send(res, 401, { message: 'Cuenta desactivada' });
    const { password: _, ...safeUser } = user;
    const tenant = user.tenantId ? db.findOne('tenants', t => t.id === user.tenantId) : null;
    const token = JWT.sign({ sub: user.id, tenantId: user.tenantId, role: user.role }, 86400);
    return send(res, 200, { user: safeUser, tenant, accessToken: token, refreshToken: token });
  }

  // ─ GET /api/v1/auth/me
  if (resource === 'auth' && id === 'me' && method === 'GET') {
    const payload = authMiddleware(req);
    if (!payload) return send(res, 401, { message: 'No autorizado' });
    const user = db.findOne('users', u => u.id === payload.sub);
    if (!user) return send(res, 404, { message: 'Usuario no encontrado' });
    const { password: _, ...safeUser } = user;
    const tenant = user.tenantId ? db.findOne('tenants', t => t.id === user.tenantId) : null;
    return send(res, 200, { user: safeUser, tenant });
  }

  // ─── A partir de aquí, requiere auth ───────────────────────
  const payload = authMiddleware(req);
  if (!payload) return send(res, 401, { message: 'Token requerido' });

  // ─ GET /api/v1/analytics/dashboard
  if (resource === 'analytics' && id === 'dashboard' && method === 'GET') {
    return send(res, 200, db.stats());
  }

  // ─ TENANTS
  if (resource === 'tenants') {
    if (method === 'GET' && !id) return send(res, 200, { data: db.get('tenants'), meta: { total: db.get('tenants').length } });
    if (method === 'GET' && id) {
      const tenant = db.findOne('tenants', t => t.id === id);
      return tenant ? send(res, 200, tenant) : send(res, 404, { message: 'No encontrado' });
    }
    if (method === 'POST') {
      const body = await parseBody(req);
      const tenant = db.create('tenants', { ...body, status: 'active', mrr: 0, usersCount: 0, leadsCount: 0 });
      return send(res, 201, tenant);
    }
    if (method === 'PATCH' && id) {
      const body = await parseBody(req);
      const updated = db.update('tenants', id, body);
      return updated ? send(res, 200, updated) : send(res, 404, { message: 'No encontrado' });
    }
    if (method === 'DELETE' && id) {
      return send(res, 200, { deleted: db.delete('tenants', id) });
    }
  }

  // ─ USERS
  if (resource === 'users') {
    if (method === 'GET') {
      const tenantId = new URL(`http://x${req.url}`).searchParams.get('tenantId');
      let users = db.get('users').map(({ password: _, ...u }) => u);
      if (tenantId) users = users.filter(u => u.tenantId === tenantId);
      return send(res, 200, { data: users, meta: { total: users.length } });
    }
    if (method === 'POST') {
      const body = await parseBody(req);
      const hashed = crypto.pbkdf2Sync(body.password || 'Temp123!', 'mlm_salt_2024', 100000, 64, 'sha512').toString('hex');
      const user = db.create('users', { ...body, password: hashed, isActive: true });
      const { password: _, ...safeUser } = user;
      return send(res, 201, safeUser);
    }
    if (method === 'PATCH' && id) {
      const body = await parseBody(req);
      const updated = db.update('users', id, body);
      if (updated) { const { password: _, ...safe } = updated; return send(res, 200, safe); }
      return send(res, 404, { message: 'No encontrado' });
    }
  }

  // ─ CAMPAIGNS
  if (resource === 'campaigns') {
    if (method === 'GET') return send(res, 200, { data: db.get('campaigns') });
    if (method === 'POST') {
      const body = await parseBody(req);
      return send(res, 201, db.create('campaigns', { ...body, tenantId: payload.tenantId, status: 'DRAFT', spend: 0, leads: 0, conversions: 0 }));
    }
    if (method === 'PATCH' && id) {
      const body = await parseBody(req);
      const updated = db.update('campaigns', id, body);
      return updated ? send(res, 200, updated) : send(res, 404, { message: 'No encontrado' });
    }
    if (method === 'GET' && id === 'stats') return send(res, 200, { total: db.get('campaigns').length });
  }

  // ─ CRM
  if (resource === 'crm') {
    if (id === 'leads' && method === 'GET') return send(res, 200, { data: [], meta: { total: 0 } });
    if (id === 'leads' && method === 'POST') {
      const body = await parseBody(req);
      return send(res, 201, db.create('leads', { ...body, tenantId: payload.tenantId }));
    }
    if (id === 'leads' && action === 'stats') return send(res, 200, { total: 0, byStatus: [] });
    if (id === 'leads' && action === 'pipeline') return send(res, 200, []);
    if (id === 'contacts' && method === 'GET') return send(res, 200, { data: [], meta: { total: 0 } });
  }

  // ─ WHATSAPP
  if (resource === 'whatsapp') {
    if (id === 'accounts') return send(res, 200, []);
    if (id === 'webhook') return send(res, 200, { ok: true });
  }

  send(res, 404, { message: `Ruta no encontrada: ${method} ${pathname}` });
}

// ─────────────────────────────────────────────────────────────
// SERVIDOR HTTP
// ─────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = urlObj.pathname;

  // OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    });
    return res.end();
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    return handleAPI(req, res, pathname);
  }

  // Static files (backoffice)
  const staticDir = path.join(__dirname, 'backoffice');
  if (pathname === '/' || pathname === '/index.html') {
    return sendFile(res, path.join(staticDir, 'index.html'));
  }
  if (pathname === '/admin' || pathname === '/admin/') {
    return sendFile(res, path.join(staticDir, 'admin.html'));
  }

  // Serve static file
  const filePath = path.join(staticDir, pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return sendFile(res, filePath);
  }

  // SPA fallback
  return sendFile(res, path.join(staticDir, 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   MLM SaaS Platform — Servidor Iniciado        ║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log(`║  🌐 App:      http://localhost:${PORT}             ║`);
  console.log(`║  🔐 Admin:    http://localhost:${PORT}/admin        ║`);
  console.log(`║  📡 API:      http://localhost:${PORT}/api/v1       ║`);
  console.log('╠════════════════════════════════════════════════╣');
  console.log('║  👤 super@mlmsaas.com / Admin123!              ║');
  console.log('╚════════════════════════════════════════════════╝\n');
});
