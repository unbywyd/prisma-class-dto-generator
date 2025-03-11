import { defineConfig } from "tsup";

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
        target: "node20"
    },
]);
