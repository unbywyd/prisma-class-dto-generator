var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var prisma_generator_exports = {};
__export(prisma_generator_exports, {
  generate: () => generate
});
module.exports = __toCommonJS(prisma_generator_exports);
var import_internals = require("@prisma/internals");
var import_fs = require("fs");
var import_path = __toESM(require("path"), 1);
var import_generate_class = __toESM(require("./generate-class.js"), 1);
var import_generate_enum = __toESM(require("./generate-enum.js"), 1);
var import_helpers = require("./helpers.js");
var import_project = require("./project.js");
var import_removeDir = __toESM(require("./utils/removeDir.js"), 1);
var import_generate_list = require("./generate-list.js");
function buildForeignKeyMap(dmmf) {
  const foreignKeyMap = /* @__PURE__ */ new Map();
  for (const model of dmmf.datamodel.models) {
    for (const field of model.fields) {
      if (field.kind === "object" && field.relationFromFields?.length) {
        const relatedModelName = field.type;
        field.relationFromFields.forEach((fkFieldName) => {
          foreignKeyMap.set(`${model.name}.${fkFieldName}`, relatedModelName);
        });
      }
    }
  }
  return foreignKeyMap;
}
async function parseConfig(absolutePath) {
  const res = (config) => {
    if (!config.input) {
      config.input = {
        excludeFields: [],
        includeRelations: false,
        excludeModels: [],
        excludeModelFields: {},
        includeModelFields: {},
        extendModels: {}
      };
    }
    if (!config.output) {
      config.output = {
        excludeFields: [],
        includeRelations: false,
        excludeModels: [],
        excludeModelFields: {},
        includeModelFields: {},
        extendModels: {}
      };
    }
    if (!config.extra) {
      config.extra = {
        //options: {},
        enums: {},
        models: {}
      };
    }
    if (!config.input.excludeFields) {
      config.input.excludeFields = [];
    }
    if (!config.output.excludeFields) {
      config.output.excludeFields = [];
    }
    if (!config.input.excludeModels) {
      config.input.excludeModels = [];
    }
    if (!config.output.excludeModels) {
      config.output.excludeModels = [];
    }
    if (!config.input.excludeModelFields) {
      config.input.excludeModelFields = {};
    }
    if (!config.output.excludeModelFields) {
      config.output.excludeModelFields = {};
    }
    if (!config.input.includeModelFields) {
      config.input.includeModelFields = {};
    }
    if (!config.output.includeModelFields) {
      config.output.includeModelFields = {};
    }
    if (!config.input.extendModels) {
      config.input.extendModels = {};
    }
    if (!config.output.extendModels) {
      config.output.extendModels = {};
    }
    if (!config.extra.enums) {
      config.extra.enums = {};
    }
    if (!config.extra.models) {
      config.extra.models = {};
    }
    if (config.input?.includeRelations === void 0) {
      config.input.includeRelations = false;
    }
    if (config.output?.includeRelations === void 0) {
      config.output.includeRelations = true;
    }
    return config;
  };
  const defaultValues = {
    input: {
      excludeFields: [],
      includeRelations: false
    },
    output: {
      includeRelations: true,
      excludeFields: []
    }
  };
  try {
    const fileContent = await import_fs.promises.readFile(absolutePath, "utf-8");
    const fileConfig = JSON.parse(fileContent);
    return res(fileConfig);
  } catch (e) {
    return res(defaultValues);
  }
}
async function generate(options) {
  const outputDir = (0, import_internals.parseEnvValue)(options.generator.output);
  await import_fs.promises.mkdir(outputDir, { recursive: true });
  await (0, import_removeDir.default)(outputDir, true);
  const configRelativeFilePath = options?.generator?.config?.configPath || "";
  const schemaDir = import_path.default.dirname(options.schemaPath);
  const configFilePath = import_path.default.resolve(schemaDir, configRelativeFilePath, "generator-config.json");
  const config = await parseConfig(configFilePath);
  const prismaClientProvider = options.otherGenerators.find(
    (it) => (0, import_internals.parseEnvValue)(it.provider) === "prisma-client-js"
  );
  const prismaClientDmmf = await (0, import_internals.getDMMF)({
    datamodel: options.datamodel,
    previewFeatures: prismaClientProvider?.previewFeatures
  });
  const enumNames = /* @__PURE__ */ new Set();
  prismaClientDmmf.datamodel.enums.forEach((enumItem) => {
    enumNames.add(enumItem.name);
    (0, import_generate_enum.default)(import_project.project, outputDir, enumItem);
  });
  if (config.extra?.enums) {
    const keys = Object.keys(config.extra.enums);
    for (const key of keys) {
      enumNames.add(key);
    }
  }
  if (enumNames.size > 0) {
    const enumsIndexSourceFile = import_project.project.createSourceFile(
      import_path.default.resolve(outputDir, "enums", "index.ts"),
      void 0,
      { overwrite: true }
    );
    (0, import_helpers.generateEnumsIndexFile)(enumsIndexSourceFile, [...enumNames]);
  }
  let excludeModels = config.excludeModels || [];
  const listPrepared = /* @__PURE__ */ new Set();
  const foreignKeyMap = buildForeignKeyMap(prismaClientDmmf);
  const referenceModels = [];
  const models = prismaClientDmmf.datamodel.models;
  const checkFieldsToReference = (fields, type) => {
    for (const field of fields) {
      if (typeof field !== "string") {
        if (field?.relationName && field.type) {
          if (!referenceModels.find((item) => item.name === field.type) && models.find((model) => model.name === field.type)) {
            referenceModels.push({ type, name: field.type });
            if (excludeModels.includes(field.type)) {
              excludeModels = excludeModels.filter((model) => model !== field.type);
            }
          }
        }
      }
    }
  };
  config.excludeModels = excludeModels;
  if (config.extra?.models && Object.keys(config.extra?.models).length) {
    for (const key in config.extra.models) {
      const fields = config.extra.models[key].fields;
      if (!fields.length) {
        continue;
      }
      checkFieldsToReference(fields, config.extra.models[key].type || "output");
    }
  }
  if (config?.input?.includeModelFields && Object.keys(config.input.includeModelFields).length) {
    for (const key in config.input.includeModelFields) {
      const fields = config.input.includeModelFields[key];
      if (!fields.length) {
        continue;
      }
      checkFieldsToReference(fields, "input");
    }
  }
  if (config?.input?.extendModels && Object.keys(config.input.extendModels).length) {
    for (const key in config.input.extendModels) {
      const fields = config.input.extendModels[key].fields;
      if (!fields.length) {
        continue;
      }
      checkFieldsToReference(fields, "input");
    }
  }
  if (config?.output?.extendModels && Object.keys(config.output.extendModels).length) {
    for (const key in config.output.extendModels) {
      const fields = config.output.extendModels[key].fields;
      if (!fields.length) {
        continue;
      }
      checkFieldsToReference(fields, "output");
    }
  }
  if (config?.output?.includeModelFields && Object.keys(config.output.includeModelFields).length) {
    for (const key in config.output.includeModelFields) {
      const fields = config.output.includeModelFields[key];
      if (!fields.length) {
        continue;
      }
      checkFieldsToReference(fields, "output");
    }
  }
  const prepareModels = models.filter((model) => !excludeModels.includes(model.name));
  for (const model of prepareModels) {
    const _listPrepared = await (0, import_generate_class.default)(config, import_project.project, outputDir, model, config, foreignKeyMap, referenceModels);
    if (_listPrepared?.length) {
      _listPrepared.forEach((name) => listPrepared.add(name));
    }
  }
  const dirPath = import_path.default.resolve(outputDir, "models");
  const list = config.lists || {};
  for (const [modelName, listConfig] of Object.entries(list)) {
    if (listPrepared.has(modelName)) {
      continue;
    }
    (0, import_generate_list.generateListDTO)(listConfig, import_project.project, dirPath, { name: modelName }, config);
  }
  (0, import_helpers.generateModelsIndexFile)(prismaClientDmmf, import_project.project, outputDir, config);
  await import_project.project.save();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generate
});
