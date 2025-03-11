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
var helpers_exports = {};
__export(helpers_exports, {
  generateClassTransformerImport: () => generateClassTransformerImport,
  generateClassValidatorImport: () => generateClassValidatorImport,
  generateEnumImports: () => generateEnumImports,
  generateEnumsIndexFile: () => generateEnumsIndexFile,
  generateHelpersImports: () => generateHelpersImports,
  generateModelsIndexFile: () => generateModelsIndexFile,
  generatePrismaImport: () => generatePrismaImport,
  generateRelationImportsImport: () => generateRelationImportsImport,
  getDecoratorsByFieldType: () => getDecoratorsByFieldType,
  getDecoratorsImportsByType: () => getDecoratorsImportsByType,
  getFieldDirectives: () => getFieldDirectives,
  getTSDataTypeFromFieldType: () => getTSDataTypeFromFieldType,
  shouldImportHelpers: () => shouldImportHelpers,
  shouldImportPrisma: () => shouldImportPrisma
});
module.exports = __toCommonJS(helpers_exports);
var import_path = __toESM(require("path"), 1);
function generateUniqueImports(sourceFile, imports, moduleSpecifier) {
  let existingImport = sourceFile.getImportDeclaration(moduleSpecifier);
  if (!existingImport) {
    existingImport = sourceFile.addImportDeclaration({
      moduleSpecifier,
      namedImports: []
    });
  }
  const namedImports = new Set(existingImport.getNamedImports().map((namedImport) => namedImport.getName()));
  imports.forEach((importName) => namedImports.add(importName));
  existingImport.removeNamedImports();
  existingImport.addNamedImports(Array.from(namedImports).map((name) => ({ name })));
}
const generateModelsIndexFile = (prismaClientDmmf, project, outputDir, config) => {
  const modelsBarrelExportSourceFile = project.createSourceFile(
    import_path.default.resolve(outputDir, "models", "index.ts"),
    void 0,
    { overwrite: true }
  );
  const excludeModels = config?.excludeModels || [];
  const excludeInputModels = config?.input?.excludeModels || [];
  const excludeOutputModels = config?.output?.excludeModels || [];
  const modelNames = prismaClientDmmf.datamodel.models.map((model) => model.name).filter((name) => !excludeModels.includes(name));
  const extraModelNames = config.extra?.models ? Object.keys(config.extra.models) : [];
  const standardExports = modelNames.flatMap(
    (modelName) => {
      const exports2 = [];
      if (!excludeInputModels.includes(modelName)) {
        exports2.push({
          moduleSpecifier: `./Input${modelName}DTO.model.cjs`,
          namedExports: [`Input${modelName}DTO`]
        });
      }
      if (!excludeOutputModels.includes(modelName)) {
        exports2.push({
          moduleSpecifier: `./Output${modelName}DTO.model.cjs`,
          namedExports: [`Output${modelName}DTO`]
        });
      }
      return exports2;
    }
  );
  const extraExports = extraModelNames.map(
    (extraModelName) => ({
      moduleSpecifier: `./${extraModelName}DTO.model.cjs`,
      namedExports: [
        `${extraModelName}DTO`
      ]
    })
  );
  modelsBarrelExportSourceFile.addExportDeclarations([
    ...standardExports,
    ...extraExports
  ]);
};
const shouldImportPrisma = (fields) => {
  return fields.some((field) => ["Decimal", "Json"].includes(field.type));
};
const shouldImportHelpers = (fields) => {
  return fields.some((field) => ["enum"].includes(field.kind));
};
const getTSDataTypeFromFieldType = (field, config) => {
  let type = field.type;
  switch (field.type) {
    case "Int":
    case "Float":
      type = "number";
      break;
    case "DateTime":
      type = "Date";
      break;
    case "String":
      type = "string";
      break;
    case "Boolean":
      type = "boolean";
      break;
    case "Decimal":
      type = "Prisma.Decimal";
      break;
    case "Json":
      type = "Prisma.JsonValue";
      break;
    case "Bytes":
      type = "Buffer";
      break;
  }
  if (field.isList) {
    type = `${type}[]`;
  } else if (field.kind === "object") {
    type = `${type}`;
  }
  return type;
};
const getDecoratorsByFieldType = (field, config) => {
  const decorators = [];
  switch (field.type) {
    case "Int":
      decorators.push({ name: "IsInt", arguments: [] });
      break;
    case "Float":
      decorators.push({ name: "IsNumber", arguments: [] });
      break;
    case "Decimal":
      decorators.push({ name: "IsDecimal", arguments: [] });
      break;
    case "DateTime":
      decorators.push({ name: "IsDate", arguments: [] });
      break;
    case "String":
      decorators.push({
        name: "IsString",
        arguments: field.isList ? ["{ each: true }"] : []
        // Преобразуем объект в строку
      });
      break;
    case "Boolean":
      decorators.push({ name: "IsBoolean", arguments: [] });
      break;
  }
  if (field.isRequired) {
    decorators.unshift({ name: "IsDefined", arguments: [] });
  } else {
    decorators.unshift({ name: "IsOptional", arguments: [] });
  }
  switch (field.type) {
    case "Int":
    case "Float":
      decorators.push({ name: "Type", arguments: ["() => Number"] });
      break;
    case "DateTime":
      decorators.push({ name: "Type", arguments: ["() => Date"] });
      break;
    case "String":
      decorators.push({ name: "Type", arguments: ["() => String"] });
      break;
    case "Boolean":
      decorators.push({ name: "Type", arguments: ["() => Boolean"] });
      break;
  }
  if (field.kind === "enum") {
    decorators.push({ name: "IsIn", arguments: [`getEnumValues(${field.type})`] });
  }
  decorators.push({ name: "Expose", arguments: [] });
  return decorators;
};
const getDecoratorsImportsByType = (field) => {
  const validatorImports = /* @__PURE__ */ new Set();
  switch (field.type) {
    case "Int":
      validatorImports.add("IsInt");
      break;
    case "DateTime":
      validatorImports.add("IsDate");
      break;
    case "String":
      validatorImports.add("IsString");
      break;
    case "Boolean":
      validatorImports.add("IsBoolean");
      break;
    case "Decimal":
      validatorImports.add("IsDecimal");
      break;
    case "Float":
      validatorImports.add("IsNumber");
      break;
  }
  if (field.isRequired) {
    validatorImports.add("IsDefined");
  } else {
    validatorImports.add("IsOptional");
  }
  if (field.kind === "enum") {
    validatorImports.add("IsIn");
  }
  return [...validatorImports];
};
const generateClassValidatorImport = (sourceFile, validatorImports) => {
  generateUniqueImports(sourceFile, validatorImports, "class-validator");
};
const generatePrismaImport = (sourceFile) => {
  sourceFile.addImportDeclaration({
    moduleSpecifier: "@prisma/client",
    namedImports: ["Prisma"]
  });
};
const generateRelationImportsImport = (sourceFile, relationImports) => {
  generateUniqueImports(sourceFile, relationImports.map((name) => `${name}DTO`), "./");
};
const generateHelpersImports = (sourceFile, helpersImports) => {
  sourceFile.addImportDeclaration({
    moduleSpecifier: "prisma-class-dto-generator",
    namedImports: helpersImports
  });
};
const generateEnumImports = (sourceFile, fields, config) => {
  const allEnumsToImport = Array.from(
    new Set(fields.filter((field) => field.kind === "enum").map((field) => field.type))
  );
  if (allEnumsToImport.length > 0) {
    generateUniqueImports(sourceFile, allEnumsToImport, "../enums");
  }
};
function generateEnumsIndexFile(sourceFile, enumNames) {
  sourceFile.addExportDeclarations(
    enumNames.sort().map((name) => ({
      moduleSpecifier: `./${name}.enum`,
      namedExports: [name]
    }))
  );
}
const generateClassTransformerImport = (sourceFile, transformerImports) => {
  generateUniqueImports(sourceFile, transformerImports, "class-transformer");
};
function getFieldDirectives(documentation) {
  if (!documentation) {
    return {
      filterable: false,
      listable: false,
      orderable: false,
      pagination: false,
      exclude: void 0
    };
  }
  const directives = {
    filterable: false,
    pagination: false,
    listable: false,
    orderable: false,
    exclude: void 0
  };
  directives.filterable = /@filterable/.test(documentation);
  directives.listable = /@listable/.test(documentation);
  directives.orderable = /@orderable/.test(documentation);
  directives.pagination = /@pagination/.test(documentation);
  const excludeMatch = documentation.match(/@exclude\s+(input|output)/);
  if (excludeMatch) {
    const value = excludeMatch[1]?.toLowerCase();
    directives.exclude = value;
  }
  return directives;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateClassTransformerImport,
  generateClassValidatorImport,
  generateEnumImports,
  generateEnumsIndexFile,
  generateHelpersImports,
  generateModelsIndexFile,
  generatePrismaImport,
  generateRelationImportsImport,
  getDecoratorsByFieldType,
  getDecoratorsImportsByType,
  getFieldDirectives,
  getTSDataTypeFromFieldType,
  shouldImportHelpers,
  shouldImportPrisma
});
