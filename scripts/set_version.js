// Écrit la version (1.0.N) et le numéro de build dans app.json avant la génération native.
const fs = require('fs');
const [version, build] = process.argv.slice(2);
const a = JSON.parse(fs.readFileSync('app.json', 'utf8'));
a.expo.version = version;
a.expo.ios = { ...a.expo.ios, buildNumber: String(build) };
a.expo.android = { ...a.expo.android, versionCode: Number(build) };
fs.writeFileSync('app.json', JSON.stringify(a, null, 2) + '\n');
console.log(`app.json : ${version} (${build})`);
