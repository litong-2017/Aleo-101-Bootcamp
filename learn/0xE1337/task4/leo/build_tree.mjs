// Off-chain builder for the revocation Merkle tree + a non-inclusion proof.
//
// It computes every leaf/node hash by calling the contract's own `hash_pair`
// (snarkVM BHP256) via `leo run`, so the tree it builds is bit-identical to what
// `prove_access` recomputes on-chain. No BHP256 re-implementation in JS.
//
// Output: the Merkle root (to set on-chain via set_revocation_root) and, for a
// chosen non-revoked serial, the interval (low, high) + Merkle path that proves
// the serial is NOT in the revocation list.
//
// Usage: node build_tree.mjs

import { execFileSync } from "node:child_process";

const DIR = new URL(".", import.meta.url).pathname;
const U128_MAX = 2n ** 128n - 1n; // sentinel upper bound

// ── Demo scenario ────────────────────────────────────────────────────────────
const REVOKED = [100n, 500n]; // the "freeze list": revoked credential serials
const SERIAL = 300n; // the prover's serial — NOT revoked, falls in gap (100,500)
const DEPTH = 3; // 2^3 = 8 leaves (≤ 7 revoked + sentinels)
// ─────────────────────────────────────────────────────────────────────────────

function hashPair(a, b) {
  const out = execFileSync("leo", ["run", "hash_pair", `${a}field`, `${b}field`], {
    cwd: DIR,
    encoding: "utf8",
    maxBuffer: 1 << 24,
  });
  const m = out.match(/•\s*(\d+)field/);
  if (!m) throw new Error("hash_pair: could not parse output");
  return BigInt(m[1]);
}

const NLEAVES = 1 << DEPTH;
const revoked = [...REVOKED].sort((a, b) => (a < b ? -1 : 1));

// sorted boundaries with sentinels → consecutive gap intervals
const bounds = [0n, ...revoked, U128_MAX];
const intervals = [];
for (let i = 0; i < bounds.length - 1; i++) intervals.push([bounds[i], bounds[i + 1]]);
if (intervals.length > NLEAVES) throw new Error("too many intervals for this DEPTH");

// leaves: real gap intervals, padded with inert (MAX,MAX) leaves
const leafInputs = [];
for (let i = 0; i < NLEAVES; i++) {
  leafInputs.push(i < intervals.length ? intervals[i] : [U128_MAX, U128_MAX]);
}
const leaves = leafInputs.map(([lo, hi]) => hashPair(lo, hi));

// build the tree bottom-up
const levels = [leaves];
while (levels[levels.length - 1].length > 1) {
  const cur = levels[levels.length - 1];
  const next = [];
  for (let i = 0; i < cur.length; i += 2) next.push(hashPair(cur[i], cur[i + 1]));
  levels.push(next);
}
const root = levels[levels.length - 1][0];

// authentication path for a leaf index
function pathFor(idx) {
  const steps = [];
  let i = idx;
  for (let lvl = 0; lvl < DEPTH; lvl++) {
    const isRight = i % 2 === 0; // I'm the left child → sibling is on my right
    const sibIdx = isRight ? i + 1 : i - 1;
    steps.push({ hash: levels[lvl][sibIdx], is_right: isRight });
    i = Math.floor(i / 2);
  }
  return steps;
}

// locate the gap interval that strictly contains SERIAL
const idx = intervals.findIndex(([lo, hi]) => lo < SERIAL && SERIAL < hi);
if (idx < 0) throw new Error("SERIAL is revoked or equals a sentinel — no proof exists");
const [low, high] = intervals[idx];
const path = pathFor(idx);

// self-verify: walk leaf + path → must reach the root
let cur = leaves[idx];
for (const s of path) cur = s.is_right ? hashPair(cur, s.hash) : hashPair(s.hash, cur);
const selfCheck = cur === root;

const leoPath =
  "[" + path.map((s) => `{hash: ${s.hash}field, is_right: ${s.is_right}}`).join(", ") + "]";

console.log(
  JSON.stringify(
    {
      revoked: revoked.map(String),
      root: root.toString() + "field",
      serial: SERIAL.toString() + "u128",
      low: low.toString() + "u128",
      high: high.toString() + "u128",
      leafIndex: idx,
      selfCheck: selfCheck ? "OK — path walks to root" : "FAIL",
      leoPath,
    },
    null,
    2,
  ),
);
