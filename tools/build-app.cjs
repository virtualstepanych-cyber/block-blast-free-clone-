const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "block-blast.html");
const pwaDir = path.join(root, "block-blast-app");
const wwwDir = path.join(root, "android-apk", "www");

const source = fs.readFileSync(src, "utf8");
let html = source;

const headTags = `
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23150a2b'/%3E%3Crect x='12' y='12' width='17' height='17' rx='5' fill='%23ff4d6d'/%3E%3Crect x='35' y='12' width='17' height='17' rx='5' fill='%23ffb703'/%3E%3Crect x='12' y='35' width='17' height='17' rx='5' fill='%2306d6a0'/%3E%3Crect x='35' y='35' width='17' height='17' rx='5' fill='%237b61ff'/%3E%3C/svg%3E">
`;

const swScript = `
<script>
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  });
}
</script>
`;

html = html.replace("</head>", headTags + "</head>");
html = html.replace("</body>", swScript + "</body>");

fs.mkdirSync(pwaDir, { recursive: true });
fs.writeFileSync(path.join(pwaDir, "index.html"), html);

fs.mkdirSync(wwwDir, { recursive: true });
fs.writeFileSync(path.join(wwwDir, "index.html"), source);

console.log("written:", path.join(pwaDir, "index.html"));
console.log("written:", path.join(wwwDir, "index.html"));
