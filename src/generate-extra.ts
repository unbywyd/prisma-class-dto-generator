import { Project, OptionalKind, PropertyDeclarationStructure } from "ts-morph";
import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';

import path from "path";
import { PrismaClassDTOGeneratorConfig } from "./prisma-generator";
import {
    getDecoratorsByFieldType,
    getDecoratorsImportsByType,
    getTSDataTypeFromFieldType,
    getFieldDirectives,
    shouldImportPrisma,
    shouldImportHelpers,
    generateClassValidatorImport,
    generateClassTransformerImport,
    generatePrismaImport,
    generateHelpersImports,
    generateEnumImports
} from "./helpers";
import { PrismaClassDTOGeneratorField } from "./generate-class";

type ExtraField = Partial<PrismaDMMF.Field> & {
    name: string;
    type: string;
    isRequired?: boolean;
    relationName?: string;
};

export function generateExtraModel(
    config: PrismaClassDTOGeneratorConfig,
    project: Project,
    outputDir: string,
    modelName: string,
    modelConfig: { fields: Array<ExtraField>, type: "input" | "output" }
) {
    const extraOptions = config.extra?.options || {};
    const filePath = path.resolve(outputDir, 'models', extraOptions.skipExtraPrefix ? `${modelName}DTO.model.ts` : `Extra${modelName}DTO.model.ts`);
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
        } else {
            return true;
        }
    });

    // Собираем импорты валидаторов
    const validatorImports = [
        ...new Set(
            fields
                .map((field) => getDecoratorsImportsByType(field as any))
                .flatMap((item) => item),
        ),
    ];

    // Собираем трансформеры
    const transformerImports = ['Expose', 'Type'];

    // Импорты Prisma (если нужны)
    if (shouldImportPrisma(fields as any)) {
        generatePrismaImport(sourceFile);
    }

    generateClassValidatorImport(sourceFile, validatorImports as Array<string>);
    generateClassTransformerImport(sourceFile, transformerImports);

    // Импорты для связей
    const relationImports = new Map<string, string>();

    fields.forEach((field) => {
        if (field.relationName) {
            // Генерируем имя связанного DTO
            // Для extra моделей используется префикс "Extra"
            const extraName = extraOptions?.skipExtraPrefix ? `${field.type}DTO` : `Extra${field.type}DTO`;
            const relatedDTOName = (field as PrismaClassDTOGeneratorField).isExtra ? extraName : `${oiType}${field.type}DTO`;
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
    if (shouldImportHelpers(fields as any)) {
        generateHelpersImports(sourceFile, ['getEnumValues']);
    }

    // Генерация импортов еnum (если есть поля enum)
    generateEnumImports(sourceFile, fields as PrismaDMMF.Field[], config);

    const hasRelations = fields.some((field) => field.relationName);
    if (hasRelations) {
        sourceFile.addImportDeclaration({
            moduleSpecifier: '../decorators',
            namedImports: ['Entity'],
        });
    }

    // Создаём свойства DTO
    const properties = fields.map<OptionalKind<PropertyDeclarationStructure>>((field) => {
        const decorators = getDecoratorsByFieldType(field as any, config);

        let type = getTSDataTypeFromFieldType(field as any, config);
        if (field.relationName) {
            const isArray = field.isList;
            const extraName = extraOptions?.skipExtraPrefix ? `${field.type}DTO` : `Extra${field.type}DTO`;
            const relatedDTOName = (field as PrismaClassDTOGeneratorField).isExtra ? extraName : `${oiType}${field.type}DTO`;

            type = isArray ? `${relatedDTOName}[]` : relatedDTOName;
            const relativePath = `./${relatedDTOName}.model`;
            decorators.push({
                name: 'Entity',
                arguments: [
                    `() => import('${relativePath}').then(m => m.${relatedDTOName})`,
                    isArray.toString(),
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
    const extraName = extraOptions?.skipExtraPrefix ? `${modelName}DTO` : `Extra${modelName}DTO`;
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
