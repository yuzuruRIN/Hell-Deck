// Tiny ESM -> classic-script bundler for the pixelfx subset Hell's Deck uses.
// Reads the source as text only (nothing from pixelfx is executed here).
// usage: node bundle.mjs <entry.js> <out.js>
import fs from "node:fs";
import path from "node:path";

const [entry, out] = process.argv.slice(2);
const mods = new Map();          // abs path -> { id, deps:[abs], code }
const order = [];

// scan one top-level declaration list after `export const|let|var` and return the declared names
function declNames(src, i) {
  const names = [];
  let depth = 0, expectName = true, s = null;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (s) { if (ch === "\\") { i++; continue; } if (ch === s) s = null; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { s = ch; continue; }
    if (ch === "/" && src[i + 1] === "/") { i = src.indexOf("\n", i); continue; }
    if (ch === "/" && src[i + 1] === "*") { i = src.indexOf("*/", i) + 1; continue; }
    if ("([{".includes(ch)) { if (expectName && depth === 0 && ch !== "(") throw new Error("destructuring export not supported"); depth++; continue; }
    if (")]}".includes(ch)) { depth--; continue; }
    if (depth === 0 && ch === ";") break;
    if (depth === 0 && ch === "\n") {
      // a newline ends the statement when the next non-space char can't continue an expression
      const rest = src.slice(i + 1).match(/^\s*(\S)/);
      if (!expectName && rest && !/[,.?:+\-*/%&|=<>([`]/.test(rest[1]) && !/[,=+\-*/%&|<>?:(\[{]\s*$/.test(src.slice(0, i))) break;
    }
    if (depth === 0 && ch === ",") { expectName = true; continue; }
    if (expectName && /[A-Za-z_$]/.test(ch)) {
      const m = src.slice(i).match(/^[A-Za-z_$][\w$]*/);
      names.push(m[0]); i += m[0].length - 1; expectName = false;
    }
  }
  return names;
}

function load(file) {
  file = path.resolve(file);
  if (mods.has(file)) return mods.get(file);
  const rec = { id: mods.size, file, deps: [], code: "" };
  mods.set(file, rec);
  let src = fs.readFileSync(file, "utf8");
  const dir = path.dirname(file);
  const req = (spec) => { const abs = path.resolve(dir, spec); const d = load(abs); if (!rec.deps.includes(abs)) rec.deps.push(abs); return `__req(${d.id})`; };
  const exps = [];   // lines added at the top: getters on __exports
  // imports
  src = src.replace(/^import\s+\*\s+as\s+(\w+)\s+from\s+["']([^"']+)["'];?/gm, (_, n, s) => `const ${n} = ${req(s)};`);
  src = src.replace(/^import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["'];?/gms, (_, list, s) => {
    const parts = list.split(",").map(x => x.trim()).filter(Boolean).map(x => { const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim(); });
    return `const { ${parts.join(", ")} } = ${req(s)};`;
  });
  if (/^import\s/m.test(src)) throw new Error("unhandled import in " + file);
  // re-exports
  src = src.replace(/^export\s*\*\s*from\s*["']([^"']+)["'];?/gm, (_, s) => `__star(__exports, ${req(s)});`);
  src = src.replace(/^export\s*\{([^}]*)\}\s*from\s*["']([^"']+)["'];?/gms, (_, list, s) => {
    const m = req(s);
    return list.split(",").map(x => x.trim()).filter(Boolean).map(x => { const [a, b] = x.split(/\s+as\s+/); return `__get(__exports, "${(b || a).trim()}", () => ${m}.${a.trim()});`; }).join(" ");
  });
  src = src.replace(/^export\s*\{([^}]*)\};?/gms, (_, list) =>
    list.split(",").map(x => x.trim()).filter(Boolean).map(x => { const [a, b] = x.split(/\s+as\s+/); exps.push(`__get(__exports, "${(b || a).trim()}", () => ${a.trim()});`); return ""; }).join(""));
  // declarations
  src = src.replace(/^export\s+(async\s+function\*?|function\*?|class)\s+([\w$]+)/gm, (_, kw, n) => { exps.push(`__get(__exports, "${n}", () => ${n});`); return `${kw} ${n}`; });
  let m;
  const declRe = /^export\s+(const|let|var)\s+/gm;
  while ((m = declRe.exec(src))) {
    for (const n of declNames(src, m.index + m[0].length)) exps.push(`__get(__exports, "${n}", () => ${n});`);
  }
  src = src.replace(/^export\s+(const|let|var)\s+/gm, "$1 ");
  if (/^export\s/m.test(src)) throw new Error("unhandled export in " + file);
  rec.code = `${exps.join("\n")}\n${src}`;
  order.push(rec);
  return rec;
}

// cycle check (getters keep live bindings, but destructured imports need deps evaluated first)
const seen = new Set(), stack = new Set();
function visit(f, trail) {
  if (stack.has(f)) throw new Error("import cycle: " + [...trail, f].map(x => path.basename(x)).join(" -> "));
  if (seen.has(f)) return;
  stack.add(f); seen.add(f);
  for (const d of mods.get(f).deps) visit(d, [...trail, f]);
  stack.delete(f);
}
const root = load(entry);
visit(root.file, []);

const base = path.resolve(path.dirname(entry));
const parts = order.map(r => `/* ${path.relative(base, r.file).replace(/\\/g, "/")} */\n__defs[${r.id}] = function (__exports) {\n${r.code}\n};`);
const outSrc = `(function () {
"use strict";
var __defs = [], __cache = [];
function __get(o, k, g) { Object.defineProperty(o, k, { get: g, enumerable: true, configurable: true }); }
function __star(o, m) { Object.keys(m).forEach(function (k) { if (k !== "default" && !(k in o)) __get(o, k, function () { return m[k]; }); }); }
function __req(id) { if (__cache[id]) return __cache[id]; var e = __cache[id] = {}; __defs[id](e); return e; }
${parts.join("\n")}
__req(${root.id});
})();
`;
fs.writeFileSync(out, outSrc);
console.log("modules", order.length, "bytes", outSrc.length);
