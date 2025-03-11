import { defineConfig } from "tsup";
import { replaceInFile } from 'replace-in-file'

export default defineConfig([
    {
        entry: ["src/**/*.ts"],
        format: ["cjs"],
        outDir: "lib/cjs",
        sourcemap: false,
        splitting: false,
        dts: true,
        bundle: false,
        external: ["path", "fs", "fs-extra", "ts-morph", "prisma", "prisma-client-js", "reflect-metadata", "tsdiapi/syncqueue", "bytes", "prisma/generator-helper", "prisma/internals"],
        clean: true,
        target: "node20",
        outExtension: () => ({ js: ".cjs" }),
        onSuccess: async () => {
            await replaceInFile({
                files: "lib/cjs/**/*.cjs",
                from: /\.js/g,
                to: ".cjs",
            });
        },
    },
]);
