import { spawn } from "node:child_process";

const tests = [
  "scripts/qa-transparent-water.mjs",
  "scripts/qa-whatsapp-only.mjs",
  "scripts/qa-visual-system.mjs",
];

const child = spawn(process.execPath, ["--test", ...tests], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

child.once("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.once("exit", (code, signal) => {
  if (signal) {
    console.error(`QA interrupted by ${signal}`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
