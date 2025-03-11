import path from 'path';
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
export const generateModelsIndexFile = (prismaClientDmmf, project, outputDir, config) => {
    const modelsBarrelExportSourceFile = project.createSourceFile(path.resolve(outputDir, 'models', 'index.ts'), undefined, { overwrite: true });
    const excludeModels = config?.excludeModels || [];
    const excludeInputModels = config?.input?.excludeModels || [];
    const excludeOutputModels = config?.output?.excludeModels || [];
    const modelNames = prismaClientDmmf.datamodel.models.map((model) => model.name).filter((name) => !excludeModels.includes(name));
    const extraModelNames = config.extra?.models
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
export const shouldImportPrisma = (fields) => {
    return fields.some((field) => ['Decimal', 'Json'].includes(field.type));
};
export const shouldImportHelpers = (fields) => {
    return fields.some((field) => ['enum'].includes(field.kind));
};
export const getTSDataTypeFromFieldType = (field, config) => {
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
export const getDecoratorsByFieldType = (field, config) => {
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
export const getDecoratorsImportsByType = (field) => {
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
export const generateClassValidatorImport = (sourceFile, validatorImports) => {
    generateUniqueImports(sourceFile, validatorImports, 'class-validator');
};
export const generatePrismaImport = (sourceFile) => {
    sourceFile.addImportDeclaration({
        moduleSpecifier: '@prisma/client',
        namedImports: ['Prisma'],
    });
};
export const generateRelationImportsImport = (sourceFile, relationImports) => {
    generateUniqueImports(sourceFile, relationImports.map(name => `${name}DTO`), './');
};
export const generateHelpersImports = (sourceFile, helpersImports) => {
    sourceFile.addImportDeclaration({
        moduleSpecifier: 'prisma-class-dto-generator',
        namedImports: helpersImports,
    });
};
export const generateEnumImports = (sourceFile, fields, config) => {
    const allEnumsToImport = Array.from(new Set(fields.filter((field) => field.kind === 'enum').map((field) => field.type)));
    if (allEnumsToImport.length > 0) {
        generateUniqueImports(sourceFile, allEnumsToImport, '../enums/index.js');
    }
};
export function generateEnumsIndexFile(sourceFile, enumNames) {
    sourceFile.addExportDeclarations(enumNames.sort().map((name) => ({
        moduleSpecifier: `./${name}.enum`,
        namedExports: [name],
    })));
}
export const generateClassTransformerImport = (sourceFile, transformerImports) => {
    generateUniqueImports(sourceFile, transformerImports, 'class-transformer');
};
export function getFieldDirectives(documentation) {
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
        const value = excludeMatch[1]?.toLowerCase();
        directives.exclude = value;
    }
    return directives;
}
//# sourceMappingURL=helpers.js.map