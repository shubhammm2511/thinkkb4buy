// Bundles index.html + style.css + data.js + app.js into one self-contained page fragment
// (the format claude.ai artifacts expect). This is NOT the Vercel build (that is `npm run build`).
// Usage: npm run build:artifact   or   node build.js <output.html>
const fs = require("fs"), path = require("path");
const d = __dirname, out = process.argv[2] || path.join(d, "artifact", "thinkb4buy.html");
const idx = fs.readFileSync(path.join(d, "index.html"), "utf8");
const body = idx.match(/<!--BODY-->([\s\S]*?)<!--\/BODY-->/)[1];
const fonts = idx.match(/<link rel="stylesheet" href="https:\/\/fonts[^>]+>/)[0];
const css = fs.readFileSync(path.join(d, "style.css"), "utf8");
const js = ["data.js", "app.js"].map((f) => fs.readFileSync(path.join(d, f), "utf8")).join("\n");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `<title>ThinkB4Buy</title>
<meta name="claude:viewport-fit-sides" content="cover">
${fonts}
<style>
${css}</style>
${body}
<script>
${js}
</script>
`);
console.log("wrote", out);
