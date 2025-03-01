import { Project } from "ts-morph";
import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import path from 'path';
import { generateEnumImports, generateHelpersImports, getDecoratorsByFieldType, getFieldDirectives, getTSDataTypeFromFieldType, shouldImportHelpers } from "./helpers";
import { PrismaClassDTOGeneratorField } from "./generate-class";
import { PrismaClassDTOGeneratorConfig, PrismaClassDTOGeneratorListModelConfig } from "./prisma-generator";

export function generateListDTO(
    config: PrismaClassDTOGeneratorListModelConfig,
    project: Project,
    dirPath: string,
    model: Partial<PrismaDMMF.Model>,
    mainConfig: PrismaClassDTOGeneratorConfig,
) {
    const modelName = model.name;
    const itemsModelName = config?.outputModelName ? config?.outputModelName : `Output${modelName}`;


    const filePath = path.resolve(dirPath, `List${modelName}DTO.model.ts`);
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });

    const directives = getFieldDirectives(model?.documentation);
    const isOrderable = (config?.orderable === true || Array.isArray(config?.orderable) && config?.orderable?.length) || directives.orderable;
    const hasPagination = config?.pagination || directives.pagination;

    const orderableFields = Array.isArray(config?.orderable) ? config?.orderable : [];

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
        moduleSpecifier: `./${itemsModelName}DTO.model`,
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

    const filters = config?.filters || [];
    const validFields = model.fields?.filter((field) => {
        const directives = getFieldDirectives(field.documentation);
        return directives.filterable || filters.find((filter) => typeof filter === 'string' ? filter === field.name : filter.name === field.name);
    }) || [];

    validFields.forEach((field) => {
        const decorators = getDecoratorsByFieldType(field, mainConfig).filter((decorator) => {
            return decorator.name !== 'IsOptional' && decorator.name !== 'IsDefined' && decorator.name !== 'Expose';
        });
        classDeclaration.addProperty({
            name: field.name,
            type: getTSDataTypeFromFieldType(field, mainConfig),
            hasQuestionToken: true,
            decorators: [
                { name: 'IsOptional', arguments: [] },
                { name: 'Expose', arguments: [] },
                ...decorators,
            ],
        });
    });

    const modelFieldsKeys = model.fields?.map((field) => field.name) || [];
    const customFields = filters.filter((filter) => typeof filter !== 'string' && !modelFieldsKeys.includes(filter.name)) as Array<PrismaClassDTOGeneratorField>;

    if (shouldImportHelpers(customFields)) {
        generateHelpersImports(sourceFile, ['getEnumValues']);
    }

    generateEnumImports(sourceFile, customFields, mainConfig);


    customFields.forEach((field) => {
        const decorators = getDecoratorsByFieldType(field as PrismaDMMF.Field, mainConfig).filter((decorator) => {
            return decorator.name !== 'IsOptional' && decorator.name !== 'IsDefined' && decorator.name !== 'Expose';
        });
        classDeclaration.addProperty({
            name: field.name,
            type: getTSDataTypeFromFieldType(field as PrismaDMMF.Field, mainConfig),
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
        })

        // orderableFields

        if (orderableFields?.length) {
            classDeclaration.addProperty({
                name: 'orderBy',
                type: "String",
                hasQuestionToken: true,
                decorators: [
                    { name: 'IsOptional', arguments: [] }, // Поле необязательное
                    { name: 'IsIn', arguments: [`[${orderableFields.map(el => `"${el}"`)?.join(',')}]`] }, // Поле должно быть из списка
                    { name: 'Expose', arguments: [] }, // Экспортируем для API
                ],
            });

        } else {
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
                            `() => import('./${itemsModelName}DTO.model').then(m => m.${itemsModelName}DTO)`,
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

