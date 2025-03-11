import path from "path";
import { getDecoratorsByFieldType, getDecoratorsImportsByType, getTSDataTypeFromFieldType, shouldImportPrisma, shouldImportHelpers, generateClassValidatorImport, generateClassTransformerImport, generatePrismaImport, generateHelpersImports, generateEnumImports } from "./helpers.js";
export function generateExtraModel(config, project, outputDir, modelName, modelConfig) {
    const filePath = path.resolve(outputDir, 'models', `${modelName}DTO.model.ts`);
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });
    const oiType = modelConfig.type === 'input' ? 'Input' : 'Output';
    const excludeModels = config.excludeModels || [];
    // Преобразуем поля, устанавливаем значения по умолчанию
    const fields = modelConfig.fields.map((field) => ({
        ...field,
        isRequired: field.isRequired ?? false,
        isList: field.isList ?? false,
        relationName: field.relationName || null,
        documentation: ""
    })).filter((field) => {
        if (field?.relationName && excludeModels.includes(field.type)) {
            return false;
        }
        else {
            return true;
        }
    });
    // Собираем импорты валидаторов
    const validatorImports = [
        ...new Set(fields
            .map((field) => getDecoratorsImportsByType(field))
            .flatMap((item) => item)),
    ];
    // Собираем трансформеры
    const transformerImports = ['Expose', 'Type'];
    // Импорты Prisma (если нужны)
    if (shouldImportPrisma(fields)) {
        generatePrismaImport(sourceFile);
    }
    generateClassValidatorImport(sourceFile, validatorImports);
    generateClassTransformerImport(sourceFile, transformerImports);
    // Импорты для связей
    const relationImports = new Map();
    fields.forEach((field) => {
        if (field.relationName) {
            const extraName = `${field.type}DTO`;
            const relatedDTOName = field.isExtra ? extraName : `${oiType}${field.type}DTO`;
            const relativePath = `./${relatedDTOName}.model.js`;
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
    if (shouldImportHelpers(fields)) {
        generateHelpersImports(sourceFile, ['getEnumValues']);
    }
    // Генерация импортов еnum (если есть поля enum)
    generateEnumImports(sourceFile, fields, config);
    const hasRelations = fields.some((field) => field.relationName);
    if (hasRelations) {
        sourceFile.addImportDeclaration({
            moduleSpecifier: 'prisma-class-dto-generator',
            namedImports: ['IsEntity'],
        });
    }
    // Создаём свойства DTO
    const properties = fields.map((field) => {
        const decorators = getDecoratorsByFieldType(field, config);
        let type = getTSDataTypeFromFieldType(field, config);
        if (field.relationName) {
            const isArray = field.isList;
            const extraName = `${field.type}DTO`;
            const relatedDTOName = field.isExtra ? extraName : `${oiType}${field.type}DTO`;
            type = isArray ? `${relatedDTOName}[]` : relatedDTOName;
            const relativePath = `./${relatedDTOName}.model.js`;
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