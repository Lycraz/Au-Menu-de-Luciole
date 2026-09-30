// Plugin Expo : signe l'APK de release avec la clé stable fournie par les secrets GitHub
// (indispensable pour qu'Android accepte les mises à jour). Sans clé, on garde la clé debug.
const { withAppBuildGradle } = require('expo/config-plugins');

const RELEASE_SIGNING = `
        release {
            if (System.getenv("ANDROID_KEYSTORE_FILE")) {
                storeFile file(System.getenv("ANDROID_KEYSTORE_FILE"))
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias(System.getenv("ANDROID_KEY_ALIAS") ?: "scantickets")
                keyPassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (c) => {
    let g = c.modResults.contents;
    if (g.includes('ANDROID_KEYSTORE_FILE')) return c;

    // 1. Déclarer la config de signature "release"
    g = g.replace(/signingConfigs\s*\{/, (m) => m + RELEASE_SIGNING);

    // 2. L'utiliser dans le buildType "release"
    const bt = g.indexOf('buildTypes {');
    const rel = g.indexOf('release {', bt);
    const target = 'signingConfig signingConfigs.debug';
    const at = g.indexOf(target, rel);
    if (bt < 0 || rel < 0 || at < 0) throw new Error('withReleaseSigning : build.gradle inattendu');
    g = g.slice(0, at) + 'signingConfig(System.getenv("ANDROID_KEYSTORE_FILE") ? signingConfigs.release : signingConfigs.debug)' + g.slice(at + target.length);

    c.modResults.contents = g;
    return c;
  });
};
