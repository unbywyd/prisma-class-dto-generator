import path from 'path';
import { generateClassValidatorImport, generateEnumImports, generateHelpersImports, generatePrismaImport, generateClassTransformerImport, getDecoratorsByFieldType, getDecoratorsImportsByType, getTSDataTypeFromFieldType, shouldImportHelpers, shouldImportPrisma, getFieldDirectives, } from './helpers.js';
import { generateListDTO } from './generate-list.js';
import { generateExtraModel } from './generate-extra.js';
import { generateExtraEnum } from './generate-extra-enums.js';
export default async function generateClass(config, project, outputDir, model, mainConfig, foreignKeyMap, refs) {
    const dirPath = path.resolve(outputDir, 'models');
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
            inputDeclaratedModels = inputDeclaratedModels.filter((model) => !excludeInutModels.includes(model));
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
            outputDeclaratedModels = outputDeclaratedModels.filter((model) => !config.output.excludeModels.includes(model));
        }
        if (!outputDeclaratedModels.includes(model.name)) {
            excludeOutputModels.push(model.name);
        }
    }
    const isInputUsed = refs.find((ref) => ref.type === 'input' && ref.name === model.name);
    if (isInputUsed && !config.input?.includeModelFields?.[model.name] && !config.input?.extendModels?.[model.name]) {
        config.input.includeModelFields[model.name] = [];
        console.log('Model', model.name, 'is used as input but not declared in config. Added to input models');
        excludeInutModels = excludeInutModels.filter((name) => name !== model.name);
        config.input.excludeModels = excludeInutModels;
    }
    if (!excludeInutModels.includes(model.name)) {
        generateDTO(config.input, project, dirPath, model, 'Input', config, foreignKeyMap);
    }
    const isOutputUsed = refs.find((ref) => ref.type === 'output' && ref.name === model.name);
    if (isOutputUsed && !config.output.includeModelFields?.[model.name] && !config.output.extendModels?.[model.name]) {
        config.output.includeModelFields[model.name] = [];
        console.log('Model', model.name, 'is used as output but not declared in config. Added to output models');
        excludeOutputModels = excludeOutputModels.filter((name) => name !== model.name);
        config.output.excludeModels = excludeOutputModels;
    }
    if (!excludeOutputModels.includes(model.name) || isOutputUsed) {
        // Генерация Output DTO
        generateDTO(config.output, project, dirPath, model, 'Output', config, foreignKeyMap);
    }
    const directives = getFieldDirectives(model.documentation);
    if (config.extra?.models) {
        for (const [extraModelName, extraModelConfig] of Object.entries(config.extra.models)) {
            generateExtraModel(config, project, outputDir, extraModelName, extraModelConfig);
        }
    }
    if (config.extra?.enums) {
        for (const [extraEnumName, extraEnumConfig] of Object.entries(config.extra.enums)) {
            generateExtraEnum(project, outputDir, extraEnumName, extraEnumConfig, mainConfig);
        }
    }
    const listPrepared = [];
    const listModels = (config.lists || {});
    if (directives.listable) {
        const configList = listModels[model.name] || {
            pagination: true,
            filters: [],
        };
        generateListDTO(configList, project, dirPath, model, mainConfig);
        listPrepared.push(model.name);
    }
    return listPrepared;
}
function generateDTO(config, project, dirPath, model, dtoType, mainConfig, foreignKeyMap) {
    const outputModelName = `${dtoType}${model.name}DTO`;
    const filePath = path.resolve(dirPath, outputModelName + '.model.ts');
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });
    const strictMode = mainConfig.strictMode || false;
    const excludeModelFields = config.excludeModelFields?.[model.name] || [];
    const excludeModels = [...mainConfig.excludeModels || [], ...config.excludeModels || []];
    const includeOnlyFields = config.includeModelFields?.[model.name] || [];
    const includeOnlyFieldNames = includeOnlyFields.map((field) => 'string' === typeof field ? field : field.name);
    const isFieldExclude = (field) => {
        if (config?.excludeIdFields && field.isId) {
            return true;
        }
        if (config?.excludeDateAtFields && field.type === 'DateTime' && field.name.toLowerCase().endsWith('at')) {
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
        const directives = getFieldDirectives(field.documentation);
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
        if ('string' != typeof field) {
            if (!fields.find(f => f.name === field.name)) {
                const inExtend = extendFields.find(f => f.name === field.name);
                if (!inExtend) {
                    extendFields.push(field);
                }
                else {
                    extendFields[extendFields.indexOf(inExtend)] = Object.assign(field, inExtend);
                }
            }
            else {
                mergeInputFields.push(field);
            }
        }
    }
    const fieldsMap = new Map(fields.map(field => [field.name, field]));
    extendFields.forEach((extendField) => {
        const existingField = fieldsMap.get(extendField.name);
        if (existingField) {
            // Обновляем существующее поле
            fieldsMap.set(extendField.name, {
                ...existingField,
                ...extendField, // Переопределяем свойства
            });
        }
        else {
            // Добавляем новое поле
            fieldsMap.set(extendField.name, {
                ...extendField,
                isRequired: extendField.isRequired ?? false,
                isExtra: extendField.isExtra ?? false,
                isList: extendField.isList ?? false,
                relationName: extendField.relationName || null,
                documentation: '',
            });
        }
    });
    if (mergeInputFields?.length > 0) {
        mergeInputFields.forEach((extendField) => {
            const existingField = fieldsMap.get(extendField.name);
            if (existingField) {
                // Обновляем существующее поле
                fieldsMap.set(extendField.name, {
                    ...existingField,
                    ...extendField, // Переопределяем свойства
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
                isRequired: false,
            };
        });
    }
    // Собираем импорты валидаторов
    const validatorImports = [
        ...new Set(fields
            .map((field) => getDecoratorsImportsByType(field))
            .flatMap((item) => item)),
    ];
    // Собираем трансформеры
    const transformerImports = ['Expose', 'Type'];
    if (shouldImportPrisma(fields)) {
        generatePrismaImport(sourceFile);
    }
    generateClassValidatorImport(sourceFile, validatorImports);
    generateClassTransformerImport(sourceFile, transformerImports);
    const relationImports = new Map();
    //const referenceFields = [...model.fields.filter((field) => field.relationName), ...extendFieldsTransformed.filter(e => e.relationName)];
    const referenceFields = fields.filter((field) => field.relationName);
    //const extraOptions = mainConfig.extra?.options || {};
    // Отвечает за импорт
    referenceFields.forEach((field) => {
        const relatedDTOName = field.isExtra ? `${field.type}DTO` : `${dtoType}${field.type}DTO`;
        const relativePath = `./${relatedDTOName}.model.js`;
        if (isFieldExclude(field)) {
            return;
        }
        if (!relationImports.has(relatedDTOName) && outputModelName !== relatedDTOName) {
            relationImports.set(relatedDTOName, relativePath);
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
    generateEnumImports(sourceFile, fields, mainConfig);
    let hasRelations = fields.some((field) => field.relationName);
    const hasFileType = fields.some((field) => field.type === 'File');
    const hasFilesType = fields.some((field) => field.type === 'File' && field.isList);
    const allFields = config.includeRelations ? fields : fields.filter((field) => !field.relationName).filter((field) => !isFieldExclude(field));
    const cyclisFields = new Map();
    const processedModels = new Set();
    processedModels.add(model.name);
    const properties = allFields.map((field) => {
        const decorators = getDecoratorsByFieldType(field, mainConfig);
        let type = getTSDataTypeFromFieldType(field, mainConfig);
        if (field.type === 'File') {
            const options = field.options || {};
            const isArray = field.isList;
            if (field?.isRequired) {
                options.isRequired = true;
            }
            if (isArray) {
                decorators.push({
                    name: 'IsFiles',
                    arguments: [
                        JSON.stringify(options),
                    ],
                });
            }
            else {
                decorators.push({
                    name: 'IsFile',
                    arguments: [
                        JSON.stringify(options),
                    ],
                });
            }
        }
        if (field.relationName) {
            const isArray = field.isList;
            const isCyclic = model.name == field.type;
            const dtoSuffix = isCyclic ? 'ChildDTO' : 'DTO';
            const extraName = `${field.type}${dtoSuffix}`;
            let relatedDTOName = field.isExtra ? extraName : `${dtoType}${field.type}${dtoSuffix}`;
            const relativePath = `./${relatedDTOName}.model.js`; // Генерация пути к DTO
            type = isArray ? `${relatedDTOName}[]` : relatedDTOName;
            if (!isCyclic) {
                decorators.push({
                    name: 'IsEntity',
                    arguments: [
                        `() => import('${relativePath}').then(m => m.${relatedDTOName})`,
                        `{ each: ${isArray} }`,
                    ],
                });
            }
            else {
                cyclisFields.set(field.name, field);
                decorators.push({
                    name: 'IsEntity',
                    arguments: [
                        `() => ${relatedDTOName}`,
                        `{ each: ${isArray} }`,
                    ],
                });
            }
            decorators.push({
                name: 'ReferenceModel',
                arguments: [`"${field.type}"`],
            });
        }
        else {
            const referenceModelName = foreignKeyMap.get(`${model.name}.${field.name}`);
            if (referenceModelName) {
                hasRelations = true;
                decorators.push({
                    name: 'ReferenceModel',
                    arguments: [`"${referenceModelName}"`],
                });
            }
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
    if (hasRelations || hasFileType) {
        const _imports = [];
        if (hasRelations) {
            _imports.push('IsEntity');
            _imports.push('ReferenceModel');
        }
        if (hasFileType) {
            _imports.push('IsFile');
        }
        if (hasFilesType) {
            _imports.push('IsFiles');
        }
        sourceFile.addImportDeclaration({
            moduleSpecifier: 'prisma-class-dto-generator',
            namedImports: _imports
        });
    }
    if (cyclisFields.size > 0) {
        const childProperties = properties.filter(prop => !cyclisFields.has(prop.name));
        const childClassDeclaration = sourceFile.addClass({
            name: `${dtoType}${model.name}ChildDTO`,
            isExported: true,
            properties: childProperties,
        });
        childClassDeclaration.addProperty({
            name: 'className',
            type: 'string',
            isStatic: true,
            initializer: `'${dtoType}${model.name}ChildDTO'`,
        });
    }
    // Создаём класс DTO
    const classDeclaration = sourceFile.addClass({
        name: `${dtoType}${model.name}DTO`,
        isExported: true,
        properties: properties,
    });
    classDeclaration.addProperty({
        name: 'className',
        type: 'string',
        isStatic: true,
        initializer: `'${dtoType}${model.name}DTO'`,
    });
}
//# sourceMappingURL=generate-class.js.map