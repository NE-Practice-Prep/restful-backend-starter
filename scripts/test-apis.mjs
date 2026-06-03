/**
 * Run: node scripts/test-apis.mjs
 * Requires API gateway on http://localhost:3001
 */
const BASE = process.env.API_BASE_URL ?? "http://localhost:3001";

const accounts = [
  { role: "admin", email: "admin@example.com", password: "password123" },
  { role: "user", email: "samuellamugisha207@gmail.com", password: "1234qwerty", fallback: ["user@tzw.local", "password123"] },
  { role: "inspector", email: "samuellamugisha964@gmail.com", password: "1234qwerty", fallback: ["inspector@tzw.local", "password123"] },
];

const results = [];

function record(entry) {
  results.push({ ...entry, at: new Date().toISOString() });
}

async function request(method, path, { token, body, expect = [200] } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  let text = "";
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    text = await res.text();
  } catch (e) {
    record({ method, path, status: 0, ok: false, note: e.message });
    return null;
  }
  const ok = expect.includes(res.status);
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text.slice(0, 200);
  }
  record({
    method,
    path,
    status: res.status,
    ok,
    note: ok ? "OK" : (parsed?.message ?? text.slice(0, 120)),
  });
  return ok ? parsed : null;
}

async function login(account) {
  for (const creds of [
    { email: account.email, password: account.password },
    ...(account.fallback
      ? [{ email: account.fallback[0], password: account.fallback[1] }]
      : []),
  ]) {
    const data = await request("POST", "/auth/login", {
      body: { email: creds.email, password: creds.password, rememberMe: true },
      expect: [200, 201, 403],
    });
    if (data?.accessToken) return { token: data.accessToken, email: creds.email };
  }
  return null;
}

async function main() {
  console.log(`Testing ${BASE}\n`);

  await request("GET", "/", { expect: [200] });

  const tokens = {};
  for (const acc of accounts) {
    const session = await login(acc);
    tokens[acc.role] = session;
    console.log(`${acc.role}: ${session ? session.email : "login failed"}`);
  }

  const admin = tokens.admin?.token;
  const user = tokens.user?.token;
  const inspector = tokens.inspector?.token;

  if (admin) {
    for (const p of [
      "/users/me",
      "/users?limit=5",
      "/extinguishers?limit=5",
      "/inspections?limit=5",
      "/reports/compliance",
      "/reports/inventory",
      "/reports/inspections",
      "/reports/maintenance",
      "/reports/overview",
    ]) {
      await request("GET", p, { token: admin });
    }
    await request("POST", "/users/admin/run-expiry-check", {
      token: admin,
      body: {},
      expect: [200, 201],
    });
  }

  if (user) {
    await request("GET", "/users/me", { token: user });
    await request("GET", "/extinguishers?limit=3", { token: user });
    await request("GET", "/reports/compliance", { token: user });
    await request("GET", "/reports/maintenance", {
      token: user,
      expect: [200, 403],
    });
    await request("GET", "/reports/overview", { token: user, expect: [200, 404] });
  }

  if (inspector) {
    await request("GET", "/users/me", { token: inspector });
    await request("GET", "/inspections?limit=3", { token: inspector });
    await request("GET", "/reports/maintenance", { token: inspector });
    await request("GET", "/reports/overview", { token: inspector, expect: [200, 404] });
  }

  await request("GET", "/users/me", { expect: [401] });

  const pass = results.filter((r) => r.ok).length;
  const fail = results.length - pass;
  console.log(`\n${pass}/${results.length} checks passed (${fail} failed or expected errors)`);

  const fs = await import("node:fs");
  const path = await import("node:path");
  const outDir = path.join(process.cwd(), "..", "..", "docs");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "api-test-results.json");
  fs.writeFileSync(
    outFile,
    JSON.stringify({ baseUrl: BASE, testedAt: new Date().toISOString(), summary: { pass, fail, total: results.length }, results }, null, 2),
  );
  console.log(`Wrote ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
