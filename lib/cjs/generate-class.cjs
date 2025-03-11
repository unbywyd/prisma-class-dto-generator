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
var generate_class_exports = {};
__export(generate_class_exports, {
  default: () => generateClass
});
module.exports = __toCommonJS(generate_class_exports);
var import_path = __toESM(require("path"), 1);
var import_helpers = require("./helpers.cjs");
var import_generate_list = require("./generate-list.cjs");
var import_generate_extra = require("./generate-extra.cjs");
var import_generate_extra_enums = require("./generate-extra-enums.cjs");
async function generateClass(config, project, outputDir, model, mainConfig, foreignKeyMap, refs) {
  const dirPath = import_path.default.resolve(outputDir, "models");
  const strictMode = config.strictMode || false;
  let excludeOutputModels = config.output.excludeModels || [];
  let excludeInutModels = config.input.excludeModels || [];
  if (strictMode) {
    let inputDeclaratedModels = [];
    if (config.input.includeModelFields) {
      const keys = Object.keys(config.input.includeModelFields);
      for (const key of keys) {
        if (!inputDeclaratedModels.includes(key)) {
          inputDeclaratedModels.push(key);
        }
      }
    }
    if (config.input.extendModels) {
      const keys = Object.keys(config.input.extendModels);
      for (const key of keys) {
        if (!inputDeclaratedModels.includes(key)) {
          inputDeclaratedModels.push(key);
        }
      }
    }
    if (excludeInutModels.length) {
      inputDeclaratedModels = inputDeclaratedModels.filter((model2) => !excludeInutModels.includes(model2));
    }
    if (!inputDeclaratedModels.includes(model.name)) {
      excludeInutModels.push(model.name);
    }
    let outputDeclaratedModels = [];
    if (config.output.includeModelFields) {
      const keys = Object.keys(config.output.includeModelFields);
      for (const key of keys) {
        if (!outputDeclaratedModels.includes(key)) {
          outputDeclaratedModels.push(key);
        }
      }
    }
    if (config.output.extendModels) {
      const keys = Object.keys(config.output.extendModels);
      for (const key of keys) {
        if (!outputDeclaratedModels.includes(key)) {
          outputDeclaratedModels.push(key);
        }
      }
    }
    if (config.output.excludeModels) {
      outputDeclaratedModels = outputDeclaratedModels.filter((model2) => !config.output.excludeModels.includes(model2));
    }
    if (!outputDeclaratedModels.includes(model.name)) {
      excludeOutputModels.push(model.name);
    }
  }
  const isInputUsed = refs.find((ref) => ref.type === "input" && ref.name === model.name);
  if (isInputUsed && !config.input?.includeModelFields?.[model.name] && !config.input?.extendModels?.[model.name]) {
    config.input.includeModelFields[model.name] = [];
    console.log("Model", model.name, "is used as input but not declared in config. Added to input models");
    excludeInutModels = excludeInutModels.filter((name) => name !== model.name);
    config.input.excludeModels = excludeInutModels;
  }
  if (!excludeInutModels.includes(model.name)) {
    generateDTO(config.input, project, dirPath, model, "Input", config, foreignKeyMap);
  }
  const isOutputUsed = refs.find((ref) => ref.type === "output" && ref.name === model.name);
  if (isOutputUsed && !config.output.includeModelFields?.[model.name] && !config.output.extendModels?.[model.name]) {
    config.output.includeModelFields[model.name] = [];
    console.log("Model", model.name, "is used as output but not declared in config. Added to output models");
    excludeOutputModels = excludeOutputModels.filter((name) => name !== model.name);
    config.output.excludeModels = excludeOutputModels;
  }
  if (!excludeOutputModels.includes(model.name) || isOutputUsed) {
    generateDTO(config.output, project, dirPath, model, "Output", config, foreignKeyMap);
  }
  const directives = (0, import_helpers.getFieldDirectives)(model.documentation);
  if (config.extra?.models) {
    for (const [extraModelName, extraModelConfig] of Object.entries(config.extra.models)) {
      (0, import_generate_extra.generateExtraModel)(config, project, outputDir, extraModelName, extraModelConfig);
    }
  }
  if (config.extra?.enums) {
    for (const [extraEnumName, extraEnumConfig] of Object.entries(config.extra.enums)) {
      (0, import_generate_extra_enums.generateExtraEnum)(project, outputDir, extraEnumName, extraEnumConfig, mainConfig);
    }
  }
  const listPrepared = [];
  const listModels = config.lists || {};
  if (directives.listable) {
    const configList = listModels[model.name] || {
      pagination: true,
      filters: []
    };
    (0, import_generate_list.generateListDTO)(configList, project, dirPath, model, mainConfig);
    listPrepared.push(model.name);
  }
  return listPrepared;
}
function generateDTO(config, project, dirPath, model, dtoType, mainConfig, foreignKeyMap) {
  const outputModelName = `${dtoType}${model.name}DTO`;
  const filePath = import_path.default.resolve(dirPath, outputModelName + ".model.ts");
  const sourceFile = project.createSourceFile(filePath, void 0, {
    overwrite: true
  });
  const strictMode = mainConfig.strictMode || false;
  const excludeModelFields = config.excludeModelFields?.[model.name] || [];
  const excludeModels = [...mainConfig.excludeModels || [], ...config.excludeModels || []];
  const includeOnlyFields = config.includeModelFields?.[model.name] || [];
  const includeOnlyFieldNames = includeOnlyFields.map((field) => "string" === typeof field ? field : field.name);
  const isFieldExclude = (field) => {
    if (config?.excludeIdFields && field.isId) {
      return true;
    }
    if (config?.excludeDateAtFields && field.type === "DateTime" && field.name.toLowerCase().endsWith("at")) {
      return true;
    }
    const referenceModelName = foreignKeyMap.get(`${model.name}.${field.name}`);
    if (config?.excludeIdRelationFields && referenceModelName) {
      return true;
    }
    if (includeOnlyFields.length > 0 || strictMode) {
      const isInclude = includeOnlyFieldNames.includes(field.name);
      if (!isInclude) {
        return true;
      }
    }
    if (field.relationName && excludeModels.includes(field.type)) {
      return true;
    }
    const directives = (0, import_helpers.getFieldDirectives)(field.documentation);
    const type = dtoType.toLowerCase();
    return config.excludeFields?.includes(field.name) || directives.exclude == type || excludeModelFields.includes(field.name);
  };
  let fields = model.fields.filter((field) => {
    return !isFieldExclude(field);
  });
  const extendFields = (config.extendModels?.[model.name]?.fields || []).filter((field) => {
    return !isFieldExclude({ name: field.name });
  });
  const mergeInputFields = [];
  for (const field of includeOnlyFields) {
    if ("string" != typeof field) {
      if (!fields.find((f) => f.name === field.name)) {
        const inExtend = extendFields.find((f) => f.name === field.name);
        if (!inExtend) {
          extendFields.push(field);
        } else {
          extendFields[extendFields.indexOf(inExtend)] = Object.assign(field, inExtend);
        }
      } else {
        mergeInputFields.push(field);
      }
    }
  }
  const fieldsMap = new Map(fields.map((field) => [field.name, field]));
  extendFields.forEach((extendField) => {
    const existingField = fieldsMap.get(extendField.name);
    if (existingField) {
      fieldsMap.set(extendField.name, {
        ...existingField,
        ...extendField
        // Переопределяем свойства
      });
    } else {
      fieldsMap.set(extendField.name, {
        ...extendField,
        isRequired: extendField.isRequired ?? false,
        isExtra: extendField.isExtra ?? false,
        isList: extendField.isList ?? false,
        relationName: extendField.relationName || null,
        documentation: ""
      });
    }
  });
  if (mergeInputFields?.length > 0) {
    mergeInputFields.forEach((extendField) => {
      const existingField = fieldsMap.get(extendField.name);
      if (existingField) {
        fieldsMap.set(extendField.name, {
          ...existingField,
          ...extendField
          // Переопределяем свойства
        });
      }
    });
  }
  fields = Array.from(fieldsMap.values());
  const makeFieldsOptional = config.makeFieldsOptional || false;
  if (makeFieldsOptional) {
    fields = fields.map((field) => {
      return {
        ...field,
        isRequired: false
      };
    });
  }
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
  const referenceFields = fields.filter((field) => field.relationName);
  referenceFields.forEach((field) => {
    const relatedDTOName = field.isExtra ? `${field.type}DTO` : `${dtoType}${field.type}DTO`;
    const relativePath = `./${relatedDTOName}.model`;
    if (isFieldExclude(field)) {
      return;
    }
    if (!relationImports.has(relatedDTOName) && outputModelName !== relatedDTOName) {
      relationImports.set(relatedDTOName, relativePath);
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
  (0, import_helpers.generateEnumImports)(sourceFile, fields, mainConfig);
  let hasRelations = fields.some((field) => field.relationName);
  const hasFileType = fields.some((field) => field.type === "File");
  const hasFilesType = fields.some((field) => field.type === "File" && field.isList);
  const allFields = config.includeRelations ? fields : fields.filter((field) => !field.relationName).filter((field) => !isFieldExclude(field));
  const cyclisFields = /* @__PURE__ */ new Map();
  const processedModels = /* @__PURE__ */ new Set();
  processedModels.add(model.name);
  const properties = allFields.map((field) => {
    const decorators = (0, import_helpers.getDecoratorsByFieldType)(field, mainConfig);
    let type = (0, import_helpers.getTSDataTypeFromFieldType)(field, mainConfig);
    if (field.type === "File") {
      const options = field.options || {};
      const isArray = field.isList;
      if (field?.isRequired) {
        options.isRequired = true;
      }
      if (isArray) {
        decorators.push({
          name: "IsFiles",
          arguments: [
            JSON.stringify(options)
          ]
        });
      } else {
        decorators.push({
          name: "IsFile",
          arguments: [
            JSON.stringify(options)
          ]
        });
      }
    }
    if (field.relationName) {
      const isArray = field.isList;
      const isCyclic = model.name == field.type;
      const dtoSuffix = isCyclic ? "ChildDTO" : "DTO";
      const extraName = `${field.type}${dtoSuffix}`;
      let relatedDTOName = field.isExtra ? extraName : `${dtoType}${field.type}${dtoSuffix}`;
      const relativePath = `./${relatedDTOName}.model`;
      type = isArray ? `${relatedDTOName}[]` : relatedDTOName;
      if (!isCyclic) {
        decorators.push({
          name: "IsEntity",
          arguments: [
            `() => import('${relativePath}').then(m => m.${relatedDTOName})`,
            `{ each: ${isArray} }`
          ]
        });
      } else {
        cyclisFields.set(field.name, field);
        decorators.push({
          name: "IsEntity",
          arguments: [
            `() => ${relatedDTOName}`,
            `{ each: ${isArray} }`
          ]
        });
      }
      decorators.push({
        name: "ReferenceModel",
        arguments: [`"${field.type}"`]
      });
    } else {
      const referenceModelName = foreignKeyMap.get(`${model.name}.${field.name}`);
      if (referenceModelName) {
        hasRelations = true;
        decorators.push({
          name: "ReferenceModel",
          arguments: [`"${referenceModelName}"`]
        });
      }
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
  if (hasRelations || hasFileType) {
    const _imports = [];
    if (hasRelations) {
      _imports.push("IsEntity");
      _imports.push("ReferenceModel");
    }
    if (hasFileType) {
      _imports.push("IsFile");
    }
    if (hasFilesType) {
      _imports.push("IsFiles");
    }
    sourceFile.addImportDeclaration({
      moduleSpecifier: "prisma-class-dto-generator",
      namedImports: _imports
    });
  }
  if (cyclisFields.size > 0) {
    const childProperties = properties.filter((prop) => !cyclisFields.has(prop.name));
    const childClassDeclaration = sourceFile.addClass({
      name: `${dtoType}${model.name}ChildDTO`,
      isExported: true,
      properties: childProperties
    });
    childClassDeclaration.addProperty({
      name: "className",
      type: "string",
      isStatic: true,
      initializer: `'${dtoType}${model.name}ChildDTO'`
    });
  }
  const classDeclaration = sourceFile.addClass({
    name: `${dtoType}${model.name}DTO`,
    isExported: true,
    properties
  });
  classDeclaration.addProperty({
    name: "className",
    type: "string",
    isStatic: true,
    initializer: `'${dtoType}${model.name}DTO'`
  });
}
