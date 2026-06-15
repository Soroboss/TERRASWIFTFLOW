#!/usr/bin/env node
/**
 * Vérifie la configuration locale TerraSwiftFlow.
 * Usage: npm run setup:check
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const placeholders = ["votre-projet", "votre-cle", "your-project", "placeholder"];

function isConfigured() {
  if (!url || !anon || !service) return false;
  const combined = `${url}${anon}${service}`.toLowerCase();
  return !placeholders.some((p) => combined.includes(p));
}

console.log("\n🔍 TerraSwiftFlow — vérification locale\n");

if (!isConfigured()) {
  console.log("❌ Supabase NON configuré");
  console.log("   → Copiez .env.local.example vers .env.local");
  console.log("   → Renseignez les 3 clés depuis supabase.com/dashboard");
  console.log("   → Guide complet : http://localhost:3000/setup\n");
  process.exit(1);
}

console.log("✅ Variables d'environnement présentes");
console.log(`   URL: ${url.slice(0, 40)}...`);

fetch(`${url}/rest/v1/organizations?select=id&limit=1`, {
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
        console.log("   → Exécutez supabase/full_schema.sql dans SQL Editor\n");
        process.exit(1);
      }
    }
    if (!res.ok) {
      console.log(`❌ Erreur API Supabase (${res.status})`);
      process.exit(1);
    }
    console.log("✅ Base de données accessible");
    console.log("   → Lancez: npm run dev");
    console.log("   → Ouvrez: http://localhost:3000\n");
  })
  .catch((err) => {
    console.log("❌ Impossible de joindre Supabase:", err.message);
    process.exit(1);
  });
