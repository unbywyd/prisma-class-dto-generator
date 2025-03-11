"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateClassTransformerImport = exports.generateEnumImports = exports.generateHelpersImports = exports.generateRelationImportsImport = exports.generatePrismaImport = exports.generateClassValidatorImport = exports.getDecoratorsImportsByType = exports.getDecoratorsByFieldType = exports.getTSDataTypeFromFieldType = exports.shouldImportHelpers = exports.shouldImportPrisma = exports.generateModelsIndexFile = void 0;
exports.generateEnumsIndexFile = generateEnumsIndexFile;
exports.getFieldDirectives = getFieldDirectives;
const path_1 = __importDefault(require("path"));
function generateUniqueImports(sourceFile, imports, moduleSpecifier) {
    let existingImport = sourceFile.getImportDeclaration(moduleSpecifier);
    if (!existingImport) {
        existingImport = sourceFile.addImportDeclaration({
            moduleSpecifier,
            namedImports: [],
        });
    }
    const namedImports = new Set(existingImport.getNamedImports().map(namedImport => namedImport.getName()));
    imports.forEach(importName => namedImports.add(importName));
    existingImport.removeNamedImports();
    existingImport.addNamedImports(Array.from(namedImports).map(name => ({ name })));
}
const generateModelsIndexFile = (prismaClientDmmf, project, outputDir, config) => {
    var _a, _b, _c;
    const modelsBarrelExportSourceFile = project.createSourceFile(path_1.default.resolve(outputDir, 'models', 'index.ts'), undefined, { overwrite: true });
    const excludeModels = (config === null || config === void 0 ? void 0 : config.excludeModels) || [];
    const excludeInputModels = ((_a = config === null || config === void 0 ? void 0 : config.input) === null || _a === void 0 ? void 0 : _a.excludeModels) || [];
    const excludeOutputModels = ((_b = config === null || config === void 0 ? void 0 : config.output) === null || _b === void 0 ? void 0 : _b.excludeModels) || [];
    const modelNames = prismaClientDmmf.datamodel.models.map((model) => model.name).filter((name) => !excludeModels.includes(name));
    const extraModelNames = ((_c = config.extra) === null || _c === void 0 ? void 0 : _c.models)
        ? Object.keys(config.extra.models)
        : [];
    const standardExports = modelNames.flatMap((modelName) => {
        const exports = [];
        if (!excludeInputModels.includes(modelName)) {
            exports.push({
                moduleSpecifier: `./Input${modelName}DTO.model.js`,
                namedExports: [`Input${modelName}DTO`],
            });
        }
        if (!excludeOutputModels.includes(modelName)) {
            exports.push({
                moduleSpecifier: `./Output${modelName}DTO.model.js`,
                namedExports: [`Output${modelName}DTO`],
            });
        }
        return exports;
    });
    const extraExports = extraModelNames.map((extraModelName) => ({
        moduleSpecifier: `./${extraModelName}DTO.model.js`,
        namedExports: [
            `${extraModelName}DTO`
        ],
    }));
    modelsBarrelExportSourceFile.addExportDeclarations([
        ...standardExports,
        ...extraExports,
    ]);
};
exports.generateModelsIndexFile = generateModelsIndexFile;
const shouldImportPrisma = (fields) => {
    return fields.some((field) => ['Decimal', 'Json'].includes(field.type));
};
exports.shouldImportPrisma = shouldImportPrisma;
const shouldImportHelpers = (fields) => {
    return fields.some((field) => ['enum'].includes(field.kind));
};
exports.shouldImportHelpers = shouldImportHelpers;
const getTSDataTypeFromFieldType = (field, config) => {
    let type = field.type;
    switch (field.type) {
        case 'Int':
        case 'Float':
            type = 'number';
            break;
        case 'DateTime':
            type = 'Date';
            break;
        case 'String':
            type = 'string';
            break;
        case 'Boolean':
            type = 'boolean';
            break;
        case 'Decimal':
            type = 'Prisma.Decimal';
            break;
        case 'Json':
            type = 'Prisma.JsonValue';
            break;
        case 'Bytes':
            type = 'Buffer';
            break;
    }
    if (field.isList) {
        type = `${type}[]`;
    }
    else if (field.kind === 'object') {
        type = `${type}`;
    }
    return type;
};
exports.getTSDataTypeFromFieldType = getTSDataTypeFromFieldType;
const getDecoratorsByFieldType = (field, config) => {
    const decorators = [];
    switch (field.type) {
        case 'Int':
            decorators.push({ name: 'IsInt', arguments: [] });
            break;
        case 'Float':
            decorators.push({ name: 'IsNumber', arguments: [] });
            break;
        case 'Decimal':
            decorators.push({ name: 'IsDecimal', arguments: [] });
            break;
        case 'DateTime':
            decorators.push({ name: 'IsDate', arguments: [] });
            break;
        case 'String':
            decorators.push({
                name: 'IsString',
                arguments: field.isList ? ['{ each: true }'] : [], // Преобразуем объект в строку
            });
            break;
        case 'Boolean':
            decorators.push({ name: 'IsBoolean', arguments: [] });
            break;
    }
    // Добавляем валидатор для обязательного или опционального поля
    if (field.isRequired) {
        decorators.unshift({ name: 'IsDefined', arguments: [] });
    }
    else {
        decorators.unshift({ name: 'IsOptional', arguments: [] });
    }
    switch (field.type) {
        case 'Int':
        case 'Float':
            decorators.push({ name: 'Type', arguments: ['() => Number'] });
            break;
        case 'DateTime':
            decorators.push({ name: 'Type', arguments: ['() => Date'] });
            break;
        case 'String':
            decorators.push({ name: 'Type', arguments: ['() => String'] });
            break;
        case 'Boolean':
            decorators.push({ name: 'Type', arguments: ['() => Boolean'] });
            break;
    }
    if (field.kind === 'enum') {
        decorators.push({ name: 'IsIn', arguments: [`getEnumValues(${field.type})`] });
    }
    decorators.push({ name: 'Expose', arguments: [] });
    return decorators;
};
exports.getDecoratorsByFieldType = getDecoratorsByFieldType;
const getDecoratorsImportsByType = (field) => {
    const validatorImports = new Set();
    switch (field.type) {
        case 'Int':
            validatorImports.add('IsInt');
            break;
        case 'DateTime':
            validatorImports.add('IsDate');
            break;
        case 'String':
            validatorImports.add('IsString');
            break;
        case 'Boolean':
            validatorImports.add('IsBoolean');
            break;
        case 'Decimal':
            validatorImports.add('IsDecimal');
            break;
        case 'Float':
            validatorImports.add('IsNumber');
            break;
    }
    if (field.isRequired) {
        validatorImports.add('IsDefined');
    }
    else {
        validatorImports.add('IsOptional');
    }
    if (field.kind === 'enum') {
        validatorImports.add('IsIn');
    }
    return [...validatorImports];
};
exports.getDecoratorsImportsByType = getDecoratorsImportsByType;
const generateClassValidatorImport = (sourceFile, validatorImports) => {
    generateUniqueImports(sourceFile, validatorImports, 'class-validator');
};
exports.generateClassValidatorImport = generateClassValidatorImport;
const generatePrismaImport = (sourceFile) => {
    sourceFile.addImportDeclaration({
        moduleSpecifier: '@prisma/client',
        namedImports: ['Prisma'],
    });
};
exports.generatePrismaImport = generatePrismaImport;
const generateRelationImportsImport = (sourceFile, relationImports) => {
    generateUniqueImports(sourceFile, relationImports.map(name => `${name}DTO`), './');
};
exports.generateRelationImportsImport = generateRelationImportsImport;
const generateHelpersImports = (sourceFile, helpersImports) => {
    sourceFile.addImportDeclaration({
        moduleSpecifier: 'prisma-class-dto-generator',
        namedImports: helpersImports,
    });
};
exports.generateHelpersImports = generateHelpersImports;
const generateEnumImports = (sourceFile, fields, config) => {
    const allEnumsToImport = Array.from(new Set(fields.filter((field) => field.kind === 'enum').map((field) => field.type)));
    if (allEnumsToImport.length > 0) {
        generateUniqueImports(sourceFile, allEnumsToImport, '../enums');
    }
};
exports.generateEnumImports = generateEnumImports;
function generateEnumsIndexFile(sourceFile, enumNames) {
    sourceFile.addExportDeclarations(enumNames.sort().map((name) => ({
        moduleSpecifier: `./${name}.enum`,
        namedExports: [name],
    })));
}
const generateClassTransformerImport = (sourceFile, transformerImports) => {
    generateUniqueImports(sourceFile, transformerImports, 'class-transformer');
};
exports.generateClassTransformerImport = generateClassTransformerImport;
function getFieldDirectives(documentation) {
    var _a;
    if (!documentation) {
        return {
            filterable: false,
            listable: false,
            orderable: false,
            pagination: false,
            exclude: undefined,
        };
    }
    const directives = {
        filterable: false,
        pagination: false,
        listable: false,
        orderable: false,
        exclude: undefined,
    };
    directives.filterable = /@filterable/.test(documentation);
    directives.listable = /@listable/.test(documentation);
    directives.orderable = /@orderable/.test(documentation);
    directives.pagination = /@pagination/.test(documentation);
    // @exclude (space +) input | output
    const excludeMatch = documentation.match(/@exclude\s+(input|output)/);
    if (excludeMatch) {
        const value = (_a = excludeMatch[1]) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        directives.exclude = value;
    }
    return directives;
}
//# sourceMappingURL=helpers.js.map