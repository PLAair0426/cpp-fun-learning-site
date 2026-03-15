import { spawn } from "node:child_process";
import { prepareStandaloneAssets } from "./prepare-standalone.mjs";

const { standaloneDir, standaloneServer } = prepareStandaloneAssets();

const child = spawn(process.execPath, [standaloneServer], {
  cwd: standaloneDir,
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: process.env.PORT ?? "3001",
    HOSTNAME: process.env.HOSTNAME ?? "0.0.0.0"
  }
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
