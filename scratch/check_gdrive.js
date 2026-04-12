import { prisma } from "./src/lib/db.js";

async function diagnoseGDrive() {
  const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
  const folderId = config?.googleDriveFolderId;
  const apiKey = config?.googleDriveApiKey;

  console.log("Folder ID:", folderId);
  console.log("API Key exists:", !!apiKey);

  if (!folderId || !apiKey) {
    console.log("Missing config");
    return;
  }

  // Test 1: Original query (direct children)
  const url1 = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name)&pageSize=1000&key=${apiKey}`;
  const resp1 = await fetch(url1);
  const data1 = await resp1.json();
  console.log("\n--- Test 1 (Direct Children) ---");
  console.log("Status:", resp1.status);
  console.log("Files found:", data1.files?.length || 0);
  if (data1.files?.length > 0) {
    console.log("First 5 files:", data1.files.slice(0, 5).map(f => f.name));
  }

  // Test 2: Search for all MP4s (Global in the account)
  const url2 = `https://www.googleapis.com/drive/v3/files?q=name+contains+'.mp4'+and+trashed=false&fields=files(id,name)&pageSize=1000&key=${apiKey}`;
  const resp2 = await fetch(url2);
  const data2 = await resp2.json();
  console.log("\n--- Test 2 (Global MP4 Search) ---");
  console.log("Status:", resp2.status);
  console.log("Files found:", data2.files?.length || 0);
  if (data2.files?.length > 0) {
    console.log("First 5 files:", data2.files.slice(0, 5).map(f => f.name));
  }
}

diagnoseGDrive();
