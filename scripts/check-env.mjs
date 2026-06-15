#!/usr/bin/env node
/**
 * Vérifie la configuration locale TerraSwiftFlow.
 * Usage: npm run setup:check
 */

const url = process.env.NEXT_PUBLIC_INSFORGE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ?? "";
const apiKey = process.env.INSFORGE_API_KEY ?? "";

const placeholders = ["votre-projet", "votre-cle", "your-project", "placeholder"];

function isConfigured() {
  if (!url || !anon || !apiKey) return false;
  const combined = `${url}${anon}${apiKey}`.toLowerCase();
  return !placeholders.some((p) => combined.includes(p));
}

console.log("\n🔍 TerraSwiftFlow — vérification locale\n");

if (!isConfigured()) {
  console.log("❌ InsForge NON configuré");
  console.log("   → Copiez .env.local.example vers .env.local");
  console.log("   → Renseignez les clés InsForge (voir /setup)");
  console.log("   → Guide complet : http://localhost:3000/setup\n");
  process.exit(1);
}

console.log("✅ Variables d'environnement présentes");
console.log(`   URL: ${url.slice(0, 40)}...`);

fetch(`${url}/api/database/records/organizations?select=id&limit=1`, {
  headers: {
    apikey: anon,
    Authorization: `Bearer ${anon}`,
  },
})
  .then(async (res) => {
    if (res.status === 404 || res.status === 406) {
      const text = await res.text();
      if (text.includes("does not exist") || text.includes("42P01")) {
        console.log("⚠️  Connexion OK — tables manquantes");
        console.log("   → npx @insforge/cli db import insforge/schema.sql\n");
        process.exit(1);
      }
    }
    if (!res.ok) {
      console.log(`❌ Erreur API InsForge (${res.status})`);
      process.exit(1);
    }
    console.log("✅ Base de données accessible");
    console.log("   → Lancez: npm run dev");
    console.log("   → Ouvrez: http://localhost:3000\n");
  })
  .catch((err) => {
    console.log("❌ Impossible de joindre InsForge:", err.message);
    process.exit(1);
  });
