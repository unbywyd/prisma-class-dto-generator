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
var generate_list_exports = {};
__export(generate_list_exports, {
  generateListDTO: () => generateListDTO
});
module.exports = __toCommonJS(generate_list_exports);
var import_path = __toESM(require("path"), 1);
var import_helpers = require("./helpers.cjs");
function generateListDTO(config, project, dirPath, model, mainConfig) {
  const modelName = model.name;
  const itemsModelName = config?.outputModelName ? config?.outputModelName : `Output${modelName}`;
  const filePath = import_path.default.resolve(dirPath, `List${modelName}DTO.model.ts`);
  const sourceFile = project.createSourceFile(filePath, void 0, {
    overwrite: true
  });
  const directives = (0, import_helpers.getFieldDirectives)(model?.documentation);
  const isOrderable = config?.orderable === true || Array.isArray(config?.orderable) && config?.orderable?.length || directives.orderable;
  const hasPagination = config?.pagination || directives.pagination;
  const orderableFields = Array.isArray(config?.orderable) ? config?.orderable : [];
  sourceFile.addImportDeclaration({
    moduleSpecifier: "class-transformer",
    namedImports: ["Type", "Expose"]
  });
  sourceFile.addImportDeclaration({
    moduleSpecifier: "class-validator",
    namedImports: ["IsOptional", "ValidateNested", "IsIn", "IsEnum", "IsString", "IsNumber", "IsBoolean", "IsDate"]
  });
  sourceFile.addImportDeclaration({
    moduleSpecifier: "prisma-class-dto-generator",
    namedImports: ["IsEntity"]
  });
  sourceFile.addImportDeclaration({
    moduleSpecifier: `./${itemsModelName}DTO.model.cjs`,
    namedImports: [`${itemsModelName}DTO`]
  });
  const classDeclaration = sourceFile.addClass({
    name: `QueryList${modelName}DTO`,
    isExported: true,
    properties: !hasPagination ? [] : [
      {
        name: "take",
        type: "number",
        hasQuestionToken: true,
        decorators: [
          { name: "IsNumber", arguments: [] },
          { name: "Expose", arguments: [] }
          // Добавляем @Expose
        ]
      },
      {
        name: "skip",
        type: "number",
        hasQuestionToken: true,
        decorators: [
          { name: "IsNumber", arguments: [] },
          { name: "Expose", arguments: [] }
          // Добавляем @Expose
        ]
      }
    ]
  });
  const filters = config?.filters || [];
  const validFields = model.fields?.filter((field) => {
    const directives2 = (0, import_helpers.getFieldDirectives)(field.documentation);
    return directives2.filterable || filters.find((filter) => typeof filter === "string" ? filter === field.name : filter.name === field.name);
  }) || [];
  validFields.forEach((field) => {
    const decorators = (0, import_helpers.getDecoratorsByFieldType)(field, mainConfig).filter((decorator) => {
      return decorator.name !== "IsOptional" && decorator.name !== "IsDefined" && decorator.name !== "Expose";
    });
    classDeclaration.addProperty({
      name: field.name,
      type: (0, import_helpers.getTSDataTypeFromFieldType)(field, mainConfig),
      hasQuestionToken: true,
      decorators: [
        { name: "IsOptional", arguments: [] },
        { name: "Expose", arguments: [] },
        ...decorators
      ]
    });
  });
  const modelFieldsKeys = model.fields?.map((field) => field.name) || [];
  const customFields = filters.filter((filter) => typeof filter !== "string" && !modelFieldsKeys.includes(filter.name));
  if ((0, import_helpers.shouldImportHelpers)(customFields)) {
    (0, import_helpers.generateHelpersImports)(sourceFile, ["getEnumValues"]);
  }
  (0, import_helpers.generateEnumImports)(sourceFile, customFields, mainConfig);
  customFields.forEach((field) => {
    const decorators = (0, import_helpers.getDecoratorsByFieldType)(field, mainConfig).filter((decorator) => {
      return decorator.name !== "IsOptional" && decorator.name !== "IsDefined" && decorator.name !== "Expose";
    });
    classDeclaration.addProperty({
      name: field.name,
      type: (0, import_helpers.getTSDataTypeFromFieldType)(field, mainConfig),
      hasQuestionToken: true,
      decorators: [
        { name: "IsOptional", arguments: [] },
        { name: "Expose", arguments: [] },
        ...decorators
      ]
    });
  });
  if (isOrderable) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: "@prisma/client",
      namedImports: ["Prisma"]
    });
    if (orderableFields?.length) {
      classDeclaration.addProperty({
        name: "orderBy",
        type: "String",
        hasQuestionToken: true,
        decorators: [
          { name: "IsOptional", arguments: [] },
          // Поле необязательное
          { name: "IsIn", arguments: [`[${orderableFields.map((el) => `"${el}"`)?.join(",")}]`] },
          // Поле должно быть из списка
          { name: "Expose", arguments: [] }
          // Экспортируем для API
        ]
      });
    } else {
      classDeclaration.addProperty({
        name: "orderBy",
        type: "String",
        hasQuestionToken: true,
        decorators: [
          { name: "IsOptional", arguments: [] },
          // Поле необязательное
          { name: "IsString", arguments: [] },
          // Поле должно быть строкой
          { name: "Expose", arguments: [] }
          // Экспортируем для API
        ]
      });
    }
    classDeclaration.addProperty({
      name: "orderDirection",
      type: `'asc' | 'desc'`,
      // Заменяем на реальные значения для направления
      hasQuestionToken: true,
      decorators: [
        { name: "IsOptional", arguments: [] },
        // Поле необязательное
        { name: "IsEnum", arguments: ["Prisma.SortOrder"] },
        // Используем встроенное перечисление
        { name: "Expose", arguments: [] }
        // Экспортируем для API
      ]
    });
  }
  classDeclaration.addProperty({
    name: "className",
    type: "string",
    isStatic: true,
    initializer: `'QueryList${modelName}DTO'`
  });
  const outputClassDeclaration = sourceFile.addClass({
    name: `OutputList${modelName}DTO`,
    isExported: true,
    properties: [
      ...hasPagination ? [
        {
          name: "take",
          type: "number",
          hasQuestionToken: true,
          decorators: [
            { name: "IsNumber", arguments: [] },
            { name: "Expose", arguments: [] }
            // Добавляем @Expose
          ]
        },
        {
          name: "skip",
          type: "number",
          hasQuestionToken: true,
          decorators: [
            { name: "IsNumber", arguments: [] },
            { name: "Expose", arguments: [] }
            // Добавляем @Expose
          ]
        }
      ] : [],
      {
        name: "total",
        type: "number",
        hasQuestionToken: true,
        decorators: [
          { name: "IsNumber", arguments: [] },
          { name: "Expose", arguments: [] }
          // Добавляем @Expose
        ]
      },
      {
        name: "items",
        type: `${itemsModelName}DTO[]`,
        hasQuestionToken: false,
        decorators: [
          { name: "Expose", arguments: [] },
          {
            name: "IsEntity",
            arguments: [
              `() => import('./${itemsModelName}DTO.model.cjs').then(m => m.${itemsModelName}DTO)`,
              "{ each: true }"
            ]
          }
        ]
      }
    ]
  });
  outputClassDeclaration.addProperty({
    name: "className",
    type: "string",
    isStatic: true,
    initializer: `'OutputList${modelName}DTO'`
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateListDTO
});
