#!/usr/bin/env python3
"""Ajoute la nouvelle version de l'app à la source SideStore (sidestore/source.json)."""
import argparse, datetime, json, os

NAME = "Au Menu de Luciole"
IPA = "AuMenuDeLuciole.ipa"
BUNDLE = "com.lemercier.aumenudeluciole"
TINT = "#2F6B4A"
SUBTITLE = "Menus de la semaine et liste de courses"
DESCRIPTION = ("Planifie les repas de la semaine en quelques touches : l'app choisit des plats simples, "
               "vérifie la fraîcheur des produits et prépare la liste de courses rayon par rayon.")

p = argparse.ArgumentParser()
p.add_argument("--ipa", required=True)
p.add_argument("--version", required=True)
p.add_argument("--build", required=True)
p.add_argument("--repo", required=True)          # ex. Lycraz/au-menu-de-luciole
p.add_argument("--notes", default="")
p.add_argument("--min-os", default="15.1")
p.add_argument("--source", default="sidestore/source.json")
a = p.parse_args()

raw = f"https://raw.githubusercontent.com/{a.repo}/main"
owner = a.repo.split("/")[0]

src = {}
if os.path.exists(a.source):
    with open(a.source, encoding="utf-8") as f:
        src = json.load(f)

src.update({
    "name": NAME,
    "subtitle": SUBTITLE,
    "iconURL": f"{raw}/sidestore/icon.png",
    "website": f"https://github.com/{a.repo}",
    "tintColor": TINT,
    "nsfw": False,
    "news": src.get("news", []),
})

apps = src.get("apps") or [{}]
app = apps[0]
app.update({
    "name": NAME,
    "bundleIdentifier": BUNDLE,
    "developerName": owner,
    "subtitle": SUBTITLE,
    "localizedDescription": DESCRIPTION,
    "iconURL": f"{raw}/sidestore/icon.png",
    "tintColor": TINT,
    "category": "lifestyle",
    "appPermissions": {"entitlements": [], "privacy": {}},
})

now = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat()
url = f"https://github.com/{a.repo}/releases/download/v{a.version}/{IPA}"
size = os.path.getsize(a.ipa)
version = {
    "version": a.version,
    "buildVersion": a.build,
    "date": now,
    "localizedDescription": a.notes.strip() or f"Version {a.version}",
    "downloadURL": url,
    "size": size,
    "minOSVersion": a.min_os,
}
versions = [v for v in app.get("versions", []) if v.get("version") != a.version]
app["versions"] = ([version] + versions)[:10]
# Champs de l'ancien format, pour compatibilité
app.update({"version": a.version, "versionDate": now, "versionDescription": version["localizedDescription"],
            "downloadURL": url, "size": size})
src["apps"] = [app]

with open(a.source, "w", encoding="utf-8") as f:
    json.dump(src, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(f"Source mise à jour : {a.version} ({size} octets)")
