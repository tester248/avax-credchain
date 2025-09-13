import fs from "fs";
import path from "path";

function copyArtifacts() {
  // When executed from the onchain folder, artifacts are in ./artifacts
  const srcDir = path.join(process.cwd(), "artifacts");
  // Destination is repo-level shared/onchain-artifacts
  const destDir = path.join(process.cwd(), "..", "shared", "onchain-artifacts");
  if (!fs.existsSync(srcDir)) {
    console.error("No onchain/artifacts directory found. Run deploy first.");
    process.exit(1);
  }
  fs.mkdirSync(destDir, { recursive: true });
  // Copy top-level artifact JSONs and contract JSONs under artifacts/contracts/*/*.json
  // Copy files from srcDir root that end with .json
  const files = fs.readdirSync(srcDir);
  for (const f of files) {
    const full = path.join(srcDir, f);
    if (fs.statSync(full).isFile() && f.endsWith('.json')) {
      const dest = path.join(destDir, f);
      fs.copyFileSync(full, dest);
      console.log(`Copied ${full} -> ${dest}`);
    }
  }

  // Copy compiled contract JSONs
  const contractsDir = path.join(srcDir, 'contracts');
  if (fs.existsSync(contractsDir)) {
    const groups = fs.readdirSync(contractsDir);
    for (const g of groups) {
      const groupDir = path.join(contractsDir, g);
      if (!fs.statSync(groupDir).isDirectory()) continue;
      const contractFiles = fs.readdirSync(groupDir).filter(fn => fn.endsWith('.json'));
      for (const cf of contractFiles) {
        const src = path.join(groupDir, cf);
        // write to destDir with a prefix to avoid collisions
        const dest = path.join(destDir, `${g.replace(/\//g,'_')}_${cf}`);
        fs.copyFileSync(src, dest);
        console.log(`Copied ${src} -> ${dest}`);
      }
    }
  }
}

copyArtifacts();
