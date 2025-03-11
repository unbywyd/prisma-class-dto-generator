"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateListDTO = generateListDTO;
const path_1 = __importDefault(require("path"));
const helpers_js_1 = require("./helpers.js");
function generateListDTO(config, project, dirPath, model, mainConfig) {
    var _a, _b, _c, _d;
    const modelName = model.name;
    const itemsModelName = (config === null || config === void 0 ? void 0 : config.outputModelName) ? config === null || config === void 0 ? void 0 : config.outputModelName : `Output${modelName}`;
    const filePath = path_1.default.resolve(dirPath, `List${modelName}DTO.model.ts`);
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });
    const directives = (0, helpers_js_1.getFieldDirectives)(model === null || model === void 0 ? void 0 : model.documentation);
    const isOrderable = ((config === null || config === void 0 ? void 0 : config.orderable) === true || Array.isArray(config === null || config === void 0 ? void 0 : config.orderable) && ((_a = config === null || config === void 0 ? void 0 : config.orderable) === null || _a === void 0 ? void 0 : _a.length)) || directives.orderable;
    const hasPagination = (config === null || config === void 0 ? void 0 : config.pagination) || directives.pagination;
    const orderableFields = Array.isArray(config === null || config === void 0 ? void 0 : config.orderable) ? config === null || config === void 0 ? void 0 : config.orderable : [];
    sourceFile.addImportDeclaration({
        moduleSpecifier: 'class-transformer',
        namedImports: ['Type', 'Expose'],
    });
    sourceFile.addImportDeclaration({
        moduleSpecifier: 'class-validator',
        namedImports: ['IsOptional', 'ValidateNested', 'IsIn', 'IsEnum', 'IsString', 'IsNumber', 'IsBoolean', 'IsDate'],
    });
    sourceFile.addImportDeclaration({
        moduleSpecifier: 'prisma-class-dto-generator',
        namedImports: ['IsEntity'],
    });
    sourceFile.addImportDeclaration({
        moduleSpecifier: `./${itemsModelName}DTO.model.js`,
        namedImports: [`${itemsModelName}DTO`],
    });
    // Создаём класс List<Entity>DTO
    const classDeclaration = sourceFile.addClass({
        name: `QueryList${modelName}DTO`,
        isExported: true,
        properties: !hasPagination ? [] : [
            {
                name: 'take',
                type: 'number',
                hasQuestionToken: true,
                decorators: [
                    { name: 'IsNumber', arguments: [] },
                    { name: 'Expose', arguments: [] }, // Добавляем @Expose
                ],
            },
            {
                name: 'skip',
                type: 'number',
                hasQuestionToken: true,
                decorators: [
                    { name: 'IsNumber', arguments: [] },
                    { name: 'Expose', arguments: [] }, // Добавляем @Expose
                ],
            }
        ],
    });
    const filters = (config === null || config === void 0 ? void 0 : config.filters) || [];
    const validFields = ((_b = model.fields) === null || _b === void 0 ? void 0 : _b.filter((field) => {
        const directives = (0, helpers_js_1.getFieldDirectives)(field.documentation);
        return directives.filterable || filters.find((filter) => typeof filter === 'string' ? filter === field.name : filter.name === field.name);
    })) || [];
    validFields.forEach((field) => {
        const decorators = (0, helpers_js_1.getDecoratorsByFieldType)(field, mainConfig).filter((decorator) => {
            return decorator.name !== 'IsOptional' && decorator.name !== 'IsDefined' && decorator.name !== 'Expose';
        });
        classDeclaration.addProperty({
            name: field.name,
            type: (0, helpers_js_1.getTSDataTypeFromFieldType)(field, mainConfig),
            hasQuestionToken: true,
            decorators: [
                { name: 'IsOptional', arguments: [] },
                { name: 'Expose', arguments: [] },
                ...decorators,
            ],
        });
    });
    const modelFieldsKeys = ((_c = model.fields) === null || _c === void 0 ? void 0 : _c.map((field) => field.name)) || [];
    const customFields = filters.filter((filter) => typeof filter !== 'string' && !modelFieldsKeys.includes(filter.name));
    if ((0, helpers_js_1.shouldImportHelpers)(customFields)) {
        (0, helpers_js_1.generateHelpersImports)(sourceFile, ['getEnumValues']);
    }
    (0, helpers_js_1.generateEnumImports)(sourceFile, customFields, mainConfig);
    customFields.forEach((field) => {
        const decorators = (0, helpers_js_1.getDecoratorsByFieldType)(field, mainConfig).filter((decorator) => {
            return decorator.name !== 'IsOptional' && decorator.name !== 'IsDefined' && decorator.name !== 'Expose';
        });
        classDeclaration.addProperty({
            name: field.name,
            type: (0, helpers_js_1.getTSDataTypeFromFieldType)(field, mainConfig),
            hasQuestionToken: true,
            decorators: [
                { name: 'IsOptional', arguments: [] },
                { name: 'Expose', arguments: [] },
                ...decorators,
            ],
        });
    });
    if (isOrderable) {
        sourceFile.addImportDeclaration({
            moduleSpecifier: '@prisma/client',
            namedImports: ['Prisma'],
        });
        // orderableFields
        if (orderableFields === null || orderableFields === void 0 ? void 0 : orderableFields.length) {
            classDeclaration.addProperty({
                name: 'orderBy',
                type: "String",
                hasQuestionToken: true,
                decorators: [
                    { name: 'IsOptional', arguments: [] }, // Поле необязательное
                    { name: 'IsIn', arguments: [`[${(_d = orderableFields.map(el => `"${el}"`)) === null || _d === void 0 ? void 0 : _d.join(',')}]`] }, // Поле должно быть из списка
                    { name: 'Expose', arguments: [] }, // Экспортируем для API
                ],
            });
        }
        else {
            classDeclaration.addProperty({
                name: 'orderBy',
                type: "String",
                hasQuestionToken: true,
                decorators: [
                    { name: 'IsOptional', arguments: [] }, // Поле необязательное
                    { name: 'IsString', arguments: [] }, // Поле должно быть строкой
                    { name: 'Expose', arguments: [] }, // Экспортируем для API
                ],
            });
        }
        classDeclaration.addProperty({
            name: 'orderDirection',
            type: `'asc' | 'desc'`, // Заменяем на реальные значения для направления
            hasQuestionToken: true,
            decorators: [
                { name: 'IsOptional', arguments: [] }, // Поле необязательное
                { name: 'IsEnum', arguments: ['Prisma.SortOrder'] }, // Используем встроенное перечисление
                { name: 'Expose', arguments: [] }, // Экспортируем для API
            ],
        });
    }
    // Добавляем статическое поле className
    classDeclaration.addProperty({
        name: 'className',
        type: 'string',
        isStatic: true,
        initializer: `'QueryList${modelName}DTO'`,
    });
    const outputClassDeclaration = sourceFile.addClass({
        name: `OutputList${modelName}DTO`,
        isExported: true,
        properties: [
            ...(hasPagination ? [
                {
                    name: 'take',
                    type: 'number',
                    hasQuestionToken: true,
                    decorators: [
                        { name: 'IsNumber', arguments: [] },
                        { name: 'Expose', arguments: [] }, // Добавляем @Expose
                    ],
                },
                {
                    name: 'skip',
                    type: 'number',
                    hasQuestionToken: true,
                    decorators: [
                        { name: 'IsNumber', arguments: [] },
                        { name: 'Expose', arguments: [] }, // Добавляем @Expose
                    ],
                }
            ] : []),
            {
                name: 'total',
                type: 'number',
                hasQuestionToken: true,
                decorators: [
                    { name: 'IsNumber', arguments: [] },
                    { name: 'Expose', arguments: [] }, // Добавляем @Expose
                ],
            },
            {
                name: 'items',
                type: `${itemsModelName}DTO[]`,
                hasQuestionToken: false,
                decorators: [
                    { name: 'Expose', arguments: [] },
                    {
                        name: 'IsEntity',
                        arguments: [
                            `() => import('./${itemsModelName}DTO.model.js').then(m => m.${itemsModelName}DTO)`,
                            '{ each: true }',
                        ],
                    },
                ],
            },
        ],
    });
    // Добавляем статическое поле className
    outputClassDeclaration.addProperty({
        name: 'className',
        type: 'string',
        isStatic: true,
        initializer: `'OutputList${modelName}DTO'`,
    });
}
//# sourceMappingURL=generate-list.js.map