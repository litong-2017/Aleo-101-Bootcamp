// Real on-chain interaction for compliant_gate_pass.aleo (Task 4).
//
// Flow:  issue (mint a credential, serial=300)  →  set_revocation_root(R)
//        →  prove_access (non-inclusion proof: serial 300 is NOT revoked)
//        →  read the public gate_access_count to confirm it bumped on-chain.
//
// The root R + interval (low,high) + Merkle path come from build_tree.mjs (which
// computes them with the contract's own BHP256 via `leo run hash_pair`).
// The signing key stays in .env (gitignored); the QuickNode endpoint is read
// from an env var (ALEO_ENDPOINT), never hardcoded.

import { execFileSync } from "node:child_process";

const DIR = new URL(".", import.meta.url).pathname;
const QN = process.env.ALEO_ENDPOINT || "https://api.explorer.provable.com/v1";
const HOLDER = "aleo1ntxq2hsvnh4s5rmh23z2hvdlkd5j97mrxpjutk0ze6nys7ll25zquq3zyr";
const READ = "https://api.provable.com/v2/testnet";

// ── demo proof material (from build_tree.mjs; revoked = {100,500}) ────────────
const ROOT = "912103969807347439333265442746745942256736829627223958776186084812658740945field";
const ISSUER = "12345field";
const GATE = "777field";
const EPOCH = "100u32";
const SERIAL = "300u128";
const LOW = "100u128";
const HIGH = "500u128";
const PATH =
  "[{hash: 5611213398571946616222230507176963638035991533539240279407776804432956422843field, is_right: false}, {hash: 5633730121757710301847440459691938035052225802320057167935082260888777620299field, is_right: true}, {hash: 4521814782175746018573811752607206240920512919524781036018725799994588950265field, is_right: true}]";
// ──────────────────────────────────────────────────────────────────────────────

const redact = (s) => s.replace(/A(Private|View)Key1[1-9A-HJ-NP-Za-km-z]+/g, "A$1Key1***");
const sleep = (s) => execFileSync("sleep", [String(s)]);
const parseTx = (o) => (o.match(/transaction ID:\s*'(at1[a-z0-9]+)'/) || [])[1] ?? null;
const parseRec = (o) => {
  const m = o.match(/\{\s*owner:[\s\S]*?_version:\s*\d+u8\.public\s*\}/);
  return m ? m[0].replace(/\s+/g, " ").trim() : null;
};
const transient = (m) => /522|503|504|fetch|broadcast|timed?\s*out|timeout|reqwest|decoding|block\/height|connection|ECONN/i.test(m);

function execute(fn, inputs) {
  const args = ["execute", fn, ...inputs, "--broadcast", "-y", "--network", "testnet",
    "--endpoint", QN, "--network-retries", "8", "--max-wait", "60"];
  let last = "";
  for (let i = 1; i <= 5; i++) {
    try {
      const out = execFileSync("leo", args, { cwd: DIR, encoding: "utf8", timeout: 280000, maxBuffer: 1 << 24 });
      const tx = parseTx(out);
      if (tx) return { tx, record: parseRec(out) };
      last = "no tx id";
    } catch (e) {
      const out = `${e.stdout ?? ""}\n${e.stderr ?? ""}`;
      const tx = parseTx(out);
      if (tx) return { tx, record: parseRec(out) };
      last = redact((e.stderr || e.stdout || e.message || String(e)).trim());
      console.log(`  ${fn} attempt ${i} failed: ${last.slice(-160)}`);
      if (!transient(last)) break;
    }
  }
  throw new Error(`${fn} failed: ${last.slice(-200)}`);
}

const confirmed = (tx) => {
  const code = execFileSync("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", "-m", "15", `${READ}/transaction/${tx}`], { encoding: "utf8" }).trim();
  return code === "200";
};
function waitConfirm(tx, label) {
  for (let i = 0; i < 20; i++) { sleep(6); if (confirmed(tx)) { console.log(`  ${label} confirmed after ~${(i + 1) * 6}s`); return true; } }
  console.log(`  ${label} not confirmed in 120s (continuing)`);
  return false;
}

console.log("counter BEFORE:", execFileSync("curl", ["-s", "-m", "15", `${READ}/program/compliant_gate_pass.aleo/mapping/gate_access_count/${GATE}`], { encoding: "utf8" }).trim());

console.log("1) issue (serial=300)…");
const issue = execute("issue", [HOLDER, ISSUER, "3u8", "999999u32", "42field", SERIAL]);
console.log("   issue tx:", issue.tx);
if (!issue.record) throw new Error("no credential record returned");

console.log("2) set_revocation_root(R)…");
const setRoot = execute("set_revocation_root", [ROOT]);
console.log("   set_root tx:", setRoot.tx);

waitConfirm(issue.tx, "issue");
waitConfirm(setRoot.tx, "set_root");

console.log("3) prove_access (non-inclusion: serial 300 NOT revoked)…");
const prove = execute("prove_access", [issue.record, ISSUER, "2u8", GATE, EPOCH, LOW, HIGH, PATH]);
console.log("   prove tx:", prove.tx);
waitConfirm(prove.tx, "prove");

sleep(8);
console.log("counter AFTER:", execFileSync("curl", ["-s", "-m", "15", `${READ}/program/compliant_gate_pass.aleo/mapping/gate_access_count/${GATE}`], { encoding: "utf8" }).trim());
console.log("\nTX IDS:", JSON.stringify({ issue: issue.tx, set_root: setRoot.tx, prove_access: prove.tx }, null, 2));
