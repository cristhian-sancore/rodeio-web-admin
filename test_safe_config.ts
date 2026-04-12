import { getSafeConfig } from "./src/lib/config-safe";

async function test() {
  const config = await getSafeConfig();
  console.log("Config Result:", config);
  if (config) {
    console.log("rankingPage field value:", config.rankingPage);
    console.log("rankingPage type:", typeof config.rankingPage);
  } else {
    console.log("No config found!");
  }
}

test();
