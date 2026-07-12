import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // task_events is append-only and written ONLY via lib/events.ts (FR-005).
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='from'][arguments.0.value='task_events']",
          message: "Write task_events only through lib/events.ts logTaskEvent().",
        },
      ],
    },
  },
  {
    files: ["src/lib/events.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
];

export default eslintConfig;
