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
var generate_extra_exports = {};
__export(generate_extra_exports, {
  generateExtraModel: () => generateExtraModel
});
module.exports = __toCommonJS(generate_extra_exports);
var import_path = __toESM(require("path"), 1);
var import_helpers = require("./helpers.js");
function generateExtraModel(config, project, outputDir, modelName, modelConfig) {
  const filePath = import_path.default.resolve(outputDir, "models", `${modelName}DTO.model.ts`);
  const sourceFile = project.createSourceFile(filePath, void 0, {
    overwrite: true
  });
  const oiType = modelConfig.type === "input" ? "Input" : "Output";
  const excludeModels = config.excludeModels || [];
  const fields = modelConfig.fields.map((field) => ({
    ...field,
    isRequired: field.isRequired ?? false,
    isList: field.isList ?? false,
    relationName: field.relationName || null,
    documentation: ""
  })).filter((field) => {
    if (field?.relationName && excludeModels.includes(field.type)) {
      return false;
    } else {
      return true;
    }
  });
  const validatorImports = [
    ...new Set(
      fields.map((field) => (0, import_helpers.getDecoratorsImportsByType)(field)).flatMap((item) => item)
    )
  ];
  const transformerImports = ["Expose", "Type"];
  if ((0, import_helpers.shouldImportPrisma)(fields)) {
    (0, import_helpers.generatePrismaImport)(sourceFile);
  }
  (0, import_helpers.generateClassValidatorImport)(sourceFile, validatorImports);
  (0, import_helpers.generateClassTransformerImport)(sourceFile, transformerImports);
  const relationImports = /* @__PURE__ */ new Map();
  fields.forEach((field) => {
    if (field.relationName) {
      const extraName2 = `${field.type}DTO`;
      const relatedDTOName = field.isExtra ? extraName2 : `${oiType}${field.type}DTO`;
      const relativePath = `./${relatedDTOName}.model`;
      if (!relationImports.has(relatedDTOName)) {
        relationImports.set(relatedDTOName, relativePath);
      }
    }
  });
  relationImports.forEach((path2, name) => {
    sourceFile.addImportDeclaration({
      moduleSpecifier: path2,
      namedImports: [name]
    });
  });
  if ((0, import_helpers.shouldImportHelpers)(fields)) {
    (0, import_helpers.generateHelpersImports)(sourceFile, ["getEnumValues"]);
  }
  (0, import_helpers.generateEnumImports)(sourceFile, fields, config);
  const hasRelations = fields.some((field) => field.relationName);
  if (hasRelations) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: "prisma-class-dto-generator",
      namedImports: ["IsEntity"]
    });
  }
  const properties = fields.map((field) => {
    const decorators = (0, import_helpers.getDecoratorsByFieldType)(field, config);
    let type = (0, import_helpers.getTSDataTypeFromFieldType)(field, config);
    if (field.relationName) {
      const isArray = field.isList;
      const extraName2 = `${field.type}DTO`;
      const relatedDTOName = field.isExtra ? extraName2 : `${oiType}${field.type}DTO`;
      type = isArray ? `${relatedDTOName}[]` : relatedDTOName;
      const relativePath = `./${relatedDTOName}.model`;
      decorators.push({
        name: "IsEntity",
        arguments: [
          `() => import('${relativePath}').then(m => m.${relatedDTOName})`,
          `{ each: ${isArray} }`
        ]
      });
    }
    return {
      name: field.name,
      type,
      hasExclamationToken: field.isRequired,
      hasQuestionToken: !field.isRequired,
      trailingTrivia: "\r\n",
      decorators
    };
  });
  const extraName = `${modelName}DTO`;
  const classDeclaration = sourceFile.addClass({
    name: extraName,
    isExported: true,
    properties
  });
  classDeclaration.addProperty({
    name: "className",
    type: "string",
    isStatic: true,
    initializer: `'${extraName}'`
  });
  project.saveSync();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateExtraModel
});
