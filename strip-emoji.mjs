import fs from "node:fs";
import path from "node:path";

const WRITE = process.argv.includes("--write");
const ROOT = path.resolve("src");
const EXT = new Set([".js", ".jsx", ".css"]);

// Діапазони емодзі (✓ ✔ ✕ ✖ → ← № свідомо не чіпаємо)
const CLASS =
  "\\u{1F000}-\\u{1FAFF}\\u{2600}-\\u{2712}\\u{2733}-\\u{27BF}\\u{2B00}-\\u{2BFF}" +
  "\\u{231A}\\u{231B}\\u{23E9}-\\u{23FF}\\u{25AA}\\u{25AB}\\u{25B6}\\u{25C0}" +
  "\\u{25FB}-\\u{25FE}\\u{2194}-\\u{21AA}\\u{FE0F}\\u{200D}\\u{20E3}";

const HAS = new RegExp(`[${CLASS}]`, "u");
const STRIP = new RegExp(`[${CLASS}]+ ?`, "gu");
const ONLY_ICON = new RegExp(`>\\s*[${CLASS}]+\\s*<`, "u");

// Ці рядки НЕ чіпаємо: це назви категорій, що зберігаються в даних рейсів
const KEEP = {
  "TripExpenses.jsx": [[23, 23], [108, 108], [156, 165], [344, 344], [361, 361]],
  "TripFuel.jsx": [[143, 143], [211, 211], [255, 255]],
};

function isKept(file, lineNo) {
  const ranges = KEEP[path.basename(file)];
  if (!ranges) return false;
  return ranges.some(([a, b]) => lineNo >= a && lineNo <= b);
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXT.has(path.extname(p))) out.push(p);
  }
  return out;
}

let changedLines = 0;
let changedFiles = 0;
const skippedIcons = [];
const skippedData = [];

for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, "utf8");
  if (!HAS.test(src)) continue;

  const rel = path.relative(process.cwd(), file);
  let fileChanged = 0;

  const next = src.split("\n").map((line, i) => {
    const lineNo = i + 1;
    if (!HAS.test(line)) return line;

    if (isKept(file, lineNo)) {
      skippedData.push(`${rel}:${lineNo}  ${line.trim()}`);
      return line;
    }

    const fixed = line.replace(STRIP, "");

    // емодзі було єдиним вмістом (іконка-кнопка) — залишаємо під lucide
    if (fixed.trim() === "" || ONLY_ICON.test(line)) {
      skippedIcons.push(`${rel}:${lineNo}  ${line.trim()}`);
      return line;
    }

    fileChanged++;
    changedLines++;
    console.log(`${rel}:${lineNo}`);
    console.log(`   - ${line.trim()}`);
    console.log(`   + ${fixed.trim()}`);
    return fixed;
  });

  if (fileChanged) {
    changedFiles++;
    if (WRITE) fs.writeFileSync(file, next.join("\n"), "utf8");
  }
}

console.log("\n--- Залишено (дані, категорії) ---");
skippedData.forEach((s) => console.log(s));

console.log("\n--- Залишено (іконки-кнопки, потрібні lucide) ---");
skippedIcons.forEach((s) => console.log(s));

console.log(
  `\n${WRITE ? "ЗАПИСАНО" : "Пробний запуск"}: ${changedLines} рядків у ${changedFiles} файлах.`
);
if (!WRITE) console.log("Щоб застосувати: node strip-emoji.mjs --write");