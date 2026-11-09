import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
registerHooks({
  resolve(specifier, context, nextResolve) {
    let path;
    if (specifier === "typescript")
      path = resolve(
        root,
        "apps/web/node_modules/typescript/lib/typescript.js",
      );
    else if (specifier.startsWith("@/"))
      path = resolve(root, "apps/web/src", specifier.slice(2));
    else if (specifier.startsWith("@exo/"))
      path = resolve(root, "packages", specifier.slice(5), "src/index.ts");
    else if (
      specifier.startsWith(".") &&
      context.parentURL?.startsWith("file:")
    )
      path = resolve(dirname(fileURLToPath(context.parentURL)), specifier);
    if (path) {
      for (const candidate of [path, path + ".ts", path + "/index.ts"])
        if (existsSync(candidate) && !candidate.endsWith("/")) {
          try {
            return nextResolve(pathToFileURL(candidate).href, context);
          } catch (error) {
            if (
              !["ERR_MODULE_NOT_FOUND", "ERR_UNSUPPORTED_DIR_IMPORT"].includes(
                error.code,
              )
            )
              throw error;
          }
        }
    }
    return nextResolve(specifier, context);
  },
});
