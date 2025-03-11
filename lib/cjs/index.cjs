var import_generator_helper = require("@prisma/generator-helper");
var import_prisma_generator = require("./prisma-generator.js");
(0, import_generator_helper.generatorHandler)({
  onManifest: () => ({
    defaultOutput: "./generated",
    prettyName: "Prisma Class DTO Generator",
    requiresGenerators: ["prisma-client-js"]
  }),
  onGenerate: import_prisma_generator.generate
});
