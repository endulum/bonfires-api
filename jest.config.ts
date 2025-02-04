import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  bail: true,
  verbose: true,
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        diagnostics: false,
        isolatedModules: true,
      },
    ],
  },
};

export default config;
