"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateClass;
const path_1 = __importDefault(require("path"));
const helpers_js_1 = require("./helpers.js");
const generate_list_js_1 = require("./generate-list.js");
const generate_extra_js_1 = require("./generate-extra.js");
const generate_extra_enums_js_1 = require("./generate-extra-enums.js");
async function generateClass(config, project, outputDir, model, mainConfig, foreignKeyMap, refs) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const dirPath = path_1.default.resolve(outputDir, 'models');
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
    if (isInputUsed && !((_b = (_a = config.input) === null || _a === void 0 ? void 0 : _a.includeModelFields) === null || _b === void 0 ? void 0 : _b[model.name]) && !((_d = (_c = config.input) === null || _c === void 0 ? void 0 : _c.extendModels) === null || _d === void 0 ? void 0 : _d[model.name])) {
        config.input.includeModelFields[model.name] = [];
        console.log('Model', model.name, 'is used as input but not declared in config. Added to input models');
        excludeInutModels = excludeInutModels.filter((name) => name !== model.name);
        config.input.excludeModels = excludeInutModels;
    }
    if (!excludeInutModels.includes(model.name)) {
        generateDTO(config.input, project, dirPath, model, 'Input', config, foreignKeyMap);
    }
    const isOutputUsed = refs.find((ref) => ref.type === 'output' && ref.name === model.name);
    if (isOutputUsed && !((_e = config.output.includeModelFields) === null || _e === void 0 ? void 0 : _e[model.name]) && !((_f = config.output.extendModels) === null || _f === void 0 ? void 0 : _f[model.name])) {
        config.output.includeModelFields[model.name] = [];
        console.log('Model', model.name, 'is used as output but not declared in config. Added to output models');
        excludeOutputModels = excludeOutputModels.filter((name) => name !== model.name);
        config.output.excludeModels = excludeOutputModels;
    }
    if (!excludeOutputModels.includes(model.name) || isOutputUsed) {
        // Генерация Output DTO
        generateDTO(config.output, project, dirPath, model, 'Output', config, foreignKeyMap);
    }
    const directives = (0, helpers_js_1.getFieldDirectives)(model.documentation);
    if ((_g = config.extra) === null || _g === void 0 ? void 0 : _g.models) {
        for (const [extraModelName, extraModelConfig] of Object.entries(config.extra.models)) {
            (0, generate_extra_js_1.generateExtraModel)(config, project, outputDir, extraModelName, extraModelConfig);
        }
    }
    if ((_h = config.extra) === null || _h === void 0 ? void 0 : _h.enums) {
        for (const [extraEnumName, extraEnumConfig] of Object.entries(config.extra.enums)) {
            (0, generate_extra_enums_js_1.generateExtraEnum)(project, outputDir, extraEnumName, extraEnumConfig, mainConfig);
        }
    }
    const listPrepared = [];
    const listModels = (config.lists || {});
    if (directives.listable) {
        const configList = listModels[model.name] || {
            pagination: true,
            filters: [],
        };
        (0, generate_list_js_1.generateListDTO)(configList, project, dirPath, model, mainConfig);
        listPrepared.push(model.name);
    }
    return listPrepared;
}
function generateDTO(config, project, dirPath, model, dtoType, mainConfig, foreignKeyMap) {
    var _a, _b, _c, _d;
    const outputModelName = `${dtoType}${model.name}DTO`;
    const filePath = path_1.default.resolve(dirPath, outputModelName + '.model.ts');
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });
    const strictMode = mainConfig.strictMode || false;
    const excludeModelFields = ((_a = config.excludeModelFields) === null || _a === void 0 ? void 0 : _a[model.name]) || [];
    const excludeModels = [...mainConfig.excludeModels || [], ...config.excludeModels || []];
    const includeOnlyFields = ((_b = config.includeModelFields) === null || _b === void 0 ? void 0 : _b[model.name]) || [];
    const includeOnlyFieldNames = includeOnlyFields.map((field) => 'string' === typeof field ? field : field.name);
    const isFieldExclude = (field) => {
        var _a;
        if ((config === null || config === void 0 ? void 0 : config.excludeIdFields) && field.isId) {
            return true;
        }
        if ((config === null || config === void 0 ? void 0 : config.excludeDateAtFields) && field.type === 'DateTime' && field.name.toLowerCase().endsWith('at')) {
            return true;
        }
        const referenceModelName = foreignKeyMap.get(`${model.name}.${field.name}`);
        if ((config === null || config === void 0 ? void 0 : config.excludeIdRelationFields) && referenceModelName) {
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
        const directives = (0, helpers_js_1.getFieldDirectives)(field.documentation);
        const type = dtoType.toLowerCase();
        return ((_a = config.excludeFields) === null || _a === void 0 ? void 0 : _a.includes(field.name)) || directives.exclude == type || excludeModelFields.includes(field.name);
    };
    let fields = model.fields.filter((field) => {
        return !isFieldExclude(field);
    });
    const extendFields = (((_d = (_c = config.extendModels) === null || _c === void 0 ? void 0 : _c[model.name]) === null || _d === void 0 ? void 0 : _d.fields) || []).filter((field) => {
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
        var _a, _b, _c;
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
                isRequired: (_a = extendField.isRequired) !== null && _a !== void 0 ? _a : false,
                isExtra: (_b = extendField.isExtra) !== null && _b !== void 0 ? _b : false,
                isList: (_c = extendField.isList) !== null && _c !== void 0 ? _c : false,
                relationName: extendField.relationName || null,
                documentation: '',
            });
        }
    });
    if ((mergeInputFields === null || mergeInputFields === void 0 ? void 0 : mergeInputFields.length) > 0) {
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
            .map((field) => (0, helpers_js_1.getDecoratorsImportsByType)(field))
            .flatMap((item) => item)),
    ];
    // Собираем трансформеры
    const transformerImports = ['Expose', 'Type'];
    if ((0, helpers_js_1.shouldImportPrisma)(fields)) {
        (0, helpers_js_1.generatePrismaImport)(sourceFile);
    }
    (0, helpers_js_1.generateClassValidatorImport)(sourceFile, validatorImports);
    (0, helpers_js_1.generateClassTransformerImport)(sourceFile, transformerImports);
    const relationImports = new Map();
    //const referenceFields = [...model.fields.filter((field) => field.relationName), ...extendFieldsTransformed.filter(e => e.relationName)];
    const referenceFields = fields.filter((field) => field.relationName);
    //const extraOptions = mainConfig.extra?.options || {};
    // Отвечает за импорт
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
    (0, helpers_js_1.generateEnumImports)(sourceFile, fields, mainConfig);
    let hasRelations = fields.some((field) => field.relationName);
    const hasFileType = fields.some((field) => field.type === 'File');
    const hasFilesType = fields.some((field) => field.type === 'File' && field.isList);
    const allFields = config.includeRelations ? fields : fields.filter((field) => !field.relationName).filter((field) => !isFieldExclude(field));
    const cyclisFields = new Map();
    const processedModels = new Set();
    processedModels.add(model.name);
    const properties = allFields.map((field) => {
        const decorators = (0, helpers_js_1.getDecoratorsByFieldType)(field, mainConfig);
        let type = (0, helpers_js_1.getTSDataTypeFromFieldType)(field, mainConfig);
        if (field.type === 'File') {
            const options = field.options || {};
            const isArray = field.isList;
            if (field === null || field === void 0 ? void 0 : field.isRequired) {
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
            const relativePath = `./${relatedDTOName}.model`; // Генерация пути к DTO
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