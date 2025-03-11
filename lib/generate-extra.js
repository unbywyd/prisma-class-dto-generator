"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExtraModel = generateExtraModel;
const path_1 = __importDefault(require("path"));
const helpers_js_1 = require("./helpers.js");
function generateExtraModel(config, project, outputDir, modelName, modelConfig) {
    const filePath = path_1.default.resolve(outputDir, 'models', `${modelName}DTO.model.ts`);
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });
    const oiType = modelConfig.type === 'input' ? 'Input' : 'Output';
    const excludeModels = config.excludeModels || [];
    // Преобразуем поля, устанавливаем значения по умолчанию
    const fields = modelConfig.fields.map((field) => {
        var _a, _b;
        return ({
            ...field,
            isRequired: (_a = field.isRequired) !== null && _a !== void 0 ? _a : false,
            isList: (_b = field.isList) !== null && _b !== void 0 ? _b : false,
            relationName: field.relationName || null,
            documentation: ""
        });
    }).filter((field) => {
        if ((field === null || field === void 0 ? void 0 : field.relationName) && excludeModels.includes(field.type)) {
            return false;
        }
        else {
            return true;
        }
    });
    // Собираем импорты валидаторов
    const validatorImports = [
        ...new Set(fields
            .map((field) => (0, helpers_js_1.getDecoratorsImportsByType)(field))
            .flatMap((item) => item)),
    ];
    // Собираем трансформеры
    const transformerImports = ['Expose', 'Type'];
    // Импорты Prisma (если нужны)
    if ((0, helpers_js_1.shouldImportPrisma)(fields)) {
        (0, helpers_js_1.generatePrismaImport)(sourceFile);
    }
    (0, helpers_js_1.generateClassValidatorImport)(sourceFile, validatorImports);
    (0, helpers_js_1.generateClassTransformerImport)(sourceFile, transformerImports);
    // Импорты для связей
    const relationImports = new Map();
    fields.forEach((field) => {
        if (field.relationName) {
            const extraName = `${field.type}DTO`;
            const relatedDTOName = field.isExtra ? extraName : `${oiType}${field.type}DTO`;
            const relativePath = `./${relatedDTOName}.model`;
            if (!relationImports.has(relatedDTOName)) {
                relationImports.set(relatedDTOName, relativePath);
            }
        }
    });
    relationImports.forEach((path, name) => {
        sourceFile.addImportDeclaration({
            moduleSpecifier: path,
            namedImports: [name],
        });
    });
    // Импорты вспомогательных методов (если нужны)
    if ((0, helpers_js_1.shouldImportHelpers)(fields)) {
        (0, helpers_js_1.generateHelpersImports)(sourceFile, ['getEnumValues']);
    }
    // Генерация импортов еnum (если есть поля enum)
    (0, helpers_js_1.generateEnumImports)(sourceFile, fields, config);
    const hasRelations = fields.some((field) => field.relationName);
    if (hasRelations) {
        sourceFile.addImportDeclaration({
            moduleSpecifier: 'prisma-class-dto-generator',
            namedImports: ['IsEntity'],
        });
    }
    // Создаём свойства DTO
    const properties = fields.map((field) => {
        const decorators = (0, helpers_js_1.getDecoratorsByFieldType)(field, config);
        let type = (0, helpers_js_1.getTSDataTypeFromFieldType)(field, config);
        if (field.relationName) {
            const isArray = field.isList;
            const extraName = `${field.type}DTO`;
            const relatedDTOName = field.isExtra ? extraName : `${oiType}${field.type}DTO`;
            type = isArray ? `${relatedDTOName}[]` : relatedDTOName;
            const relativePath = `./${relatedDTOName}.model`;
            decorators.push({
                name: 'IsEntity',
                arguments: [
                    `() => import('${relativePath}').then(m => m.${relatedDTOName})`,
                    `{ each: ${isArray} }`,
                ],
            });
        }
        return {
            name: field.name,
            type,
            hasExclamationToken: field.isRequired,
            hasQuestionToken: !field.isRequired,
            trailingTrivia: '\r\n',
            decorators: decorators,
        };
    });
    // Создаём класс DTO
    const extraName = `${modelName}DTO`;
    const classDeclaration = sourceFile.addClass({
        name: extraName,
        isExported: true,
        properties: properties,
    });
    classDeclaration.addProperty({
        name: 'className',
        type: 'string',
        isStatic: true,
        initializer: `'${extraName}'`,
    });
    // Сохраняем файл
    project.saveSync();
}
//# sourceMappingURL=generate-extra.js.map