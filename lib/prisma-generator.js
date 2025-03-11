"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = generate;
const internals_1 = require("@prisma/internals");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const generate_class_js_1 = __importDefault(require("./generate-class.js"));
const generate_enum_js_1 = __importDefault(require("./generate-enum.js"));
const helpers_js_1 = require("./helpers.js");
const project_js_1 = require("./project.js");
const removeDir_js_1 = __importDefault(require("./utils/removeDir.js"));
const generate_list_js_1 = require("./generate-list.js");
function buildForeignKeyMap(dmmf) {
    var _a;
    const foreignKeyMap = new Map();
    for (const model of dmmf.datamodel.models) {
        for (const field of model.fields) {
            // Если поле - это объект (kind === "object") и в нём заданы relationFromFields,
            // значит, это реляционное поле, указывающее, откуда берётся FK (например, [ 'updatedById' ])
            if (field.kind === 'object' && ((_a = field.relationFromFields) === null || _a === void 0 ? void 0 : _a.length)) {
                const relatedModelName = field.type; // Например, "Admin"
                // relationFromFields может содержать несколько ключей (если составной ключ),
                // обычно бывает 1, но на всякий случай обходим все
                field.relationFromFields.forEach(fkFieldName => {
                    // Сохраняем в Map, что в модели M поле fkFieldName -> указывает на relatedModelName
                    foreignKeyMap.set(`${model.name}.${fkFieldName}`, relatedModelName);
                });
            }
        }
    }
    return foreignKeyMap;
}
async function parseConfig(absolutePath) {
    const res = (config) => {
        var _a, _b;
        if (!config.input) {
            config.input = {
                excludeFields: [],
                includeRelations: false,
                excludeModels: [],
                excludeModelFields: {},
                includeModelFields: {},
                extendModels: {},
            };
        }
        if (!config.output) {
            config.output = {
                excludeFields: [],
                includeRelations: false,
                excludeModels: [],
                excludeModelFields: {},
                includeModelFields: {},
                extendModels: {},
            };
        }
        if (!config.extra) {
            config.extra = {
                //options: {},
                enums: {},
                models: {}
            };
        }
        if (!config.input.excludeFields) {
            config.input.excludeFields = [];
        }
        if (!config.output.excludeFields) {
            config.output.excludeFields = [];
        }
        if (!config.input.excludeModels) {
            config.input.excludeModels = [];
        }
        if (!config.output.excludeModels) {
            config.output.excludeModels = [];
        }
        if (!config.input.excludeModelFields) {
            config.input.excludeModelFields = {};
        }
        if (!config.output.excludeModelFields) {
            config.output.excludeModelFields = {};
        }
        if (!config.input.includeModelFields) {
            config.input.includeModelFields = {};
        }
        if (!config.output.includeModelFields) {
            config.output.includeModelFields = {};
        }
        if (!config.input.extendModels) {
            config.input.extendModels = {};
        }
        if (!config.output.extendModels) {
            config.output.extendModels = {};
        }
        if (!config.extra.enums) {
            config.extra.enums = {};
        }
        if (!config.extra.models) {
            config.extra.models = {};
        }
        if (((_a = config.input) === null || _a === void 0 ? void 0 : _a.includeRelations) === undefined) {
            config.input.includeRelations = false;
        }
        if (((_b = config.output) === null || _b === void 0 ? void 0 : _b.includeRelations) === undefined) {
            config.output.includeRelations = true;
        }
        return config;
    };
    const defaultValues = {
        input: {
            excludeFields: [],
            includeRelations: false
        },
        output: {
            includeRelations: true,
            excludeFields: []
        }
    };
    try {
        const fileContent = await fs_1.promises.readFile(absolutePath, 'utf-8'); // Читаем содержимое файла
        const fileConfig = JSON.parse(fileContent);
        return res(fileConfig);
    }
    catch (e) {
        return res(defaultValues);
    }
}
async function generate(options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const outputDir = (0, internals_1.parseEnvValue)(options.generator.output);
    await fs_1.promises.mkdir(outputDir, { recursive: true });
    await (0, removeDir_js_1.default)(outputDir, true);
    const configRelativeFilePath = ((_b = (_a = options === null || options === void 0 ? void 0 : options.generator) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.configPath) || '';
    const schemaDir = path_1.default.dirname(options.schemaPath);
    const configFilePath = path_1.default.resolve(schemaDir, configRelativeFilePath, 'generator-config.json');
    const config = await parseConfig(configFilePath);
    const prismaClientProvider = options.otherGenerators.find((it) => (0, internals_1.parseEnvValue)(it.provider) === 'prisma-client-js');
    const prismaClientDmmf = await (0, internals_1.getDMMF)({
        datamodel: options.datamodel,
        previewFeatures: prismaClientProvider === null || prismaClientProvider === void 0 ? void 0 : prismaClientProvider.previewFeatures,
    });
    const enumNames = new Set();
    prismaClientDmmf.datamodel.enums.forEach((enumItem) => {
        enumNames.add(enumItem.name);
        (0, generate_enum_js_1.default)(project_js_1.project, outputDir, enumItem);
    });
    if ((_c = config.extra) === null || _c === void 0 ? void 0 : _c.enums) {
        const keys = Object.keys(config.extra.enums);
        for (const key of keys) {
            enumNames.add(key);
        }
    }
    if (enumNames.size > 0) {
        const enumsIndexSourceFile = project_js_1.project.createSourceFile(path_1.default.resolve(outputDir, 'enums', 'index.ts'), undefined, { overwrite: true });
        (0, helpers_js_1.generateEnumsIndexFile)(enumsIndexSourceFile, [...enumNames]);
    }
    let excludeModels = config.excludeModels || [];
    const listPrepared = new Set();
    const foreignKeyMap = buildForeignKeyMap(prismaClientDmmf);
    const referenceModels = [];
    const models = prismaClientDmmf.datamodel.models;
    const checkFieldsToReference = (fields, type) => {
        for (const field of fields) {
            if (typeof field !== 'string') {
                if ((field === null || field === void 0 ? void 0 : field.relationName) && field.type) {
                    if (!referenceModels.find((item) => item.name === field.type) && models.find((model) => model.name === field.type)) {
                        referenceModels.push({ type, name: field.type });
                        if (excludeModels.includes(field.type)) {
                            excludeModels = excludeModels.filter((model) => model !== field.type);
                        }
                    }
                }
            }
        }
    };
    config.excludeModels = excludeModels;
    if (((_d = config.extra) === null || _d === void 0 ? void 0 : _d.models) && Object.keys((_e = config.extra) === null || _e === void 0 ? void 0 : _e.models).length) {
        for (const key in config.extra.models) {
            const fields = config.extra.models[key].fields;
            if (!fields.length) {
                continue;
            }
            checkFieldsToReference(fields, config.extra.models[key].type || 'output');
        }
    }
    if (((_f = config === null || config === void 0 ? void 0 : config.input) === null || _f === void 0 ? void 0 : _f.includeModelFields) && Object.keys(config.input.includeModelFields).length) {
        for (const key in config.input.includeModelFields) {
            const fields = config.input.includeModelFields[key];
            if (!fields.length) {
                continue;
            }
            checkFieldsToReference(fields, 'input');
        }
    }
    if (((_g = config === null || config === void 0 ? void 0 : config.input) === null || _g === void 0 ? void 0 : _g.extendModels) && Object.keys(config.input.extendModels).length) {
        for (const key in config.input.extendModels) {
            const fields = config.input.extendModels[key].fields;
            if (!fields.length) {
                continue;
            }
            checkFieldsToReference(fields, 'input');
        }
    }
    if (((_h = config === null || config === void 0 ? void 0 : config.output) === null || _h === void 0 ? void 0 : _h.extendModels) && Object.keys(config.output.extendModels).length) {
        for (const key in config.output.extendModels) {
            const fields = config.output.extendModels[key].fields;
            if (!fields.length) {
                continue;
            }
            checkFieldsToReference(fields, 'output');
        }
    }
    if (((_j = config === null || config === void 0 ? void 0 : config.output) === null || _j === void 0 ? void 0 : _j.includeModelFields) && Object.keys(config.output.includeModelFields).length) {
        for (const key in config.output.includeModelFields) {
            const fields = config.output.includeModelFields[key];
            if (!fields.length) {
                continue;
            }
            checkFieldsToReference(fields, 'output');
        }
    }
    const prepareModels = models.filter((model) => !excludeModels.includes(model.name));
    for (const model of prepareModels) {
        const _listPrepared = await (0, generate_class_js_1.default)(config, project_js_1.project, outputDir, model, config, foreignKeyMap, referenceModels);
        if (_listPrepared === null || _listPrepared === void 0 ? void 0 : _listPrepared.length) {
            _listPrepared.forEach((name) => listPrepared.add(name));
        }
    }
    const dirPath = path_1.default.resolve(outputDir, 'models');
    const list = config.lists || {};
    for (const [modelName, listConfig] of Object.entries(list)) {
        if (listPrepared.has(modelName)) {
            continue;
        }
        (0, generate_list_js_1.generateListDTO)(listConfig, project_js_1.project, dirPath, { name: modelName }, config);
    }
    (0, helpers_js_1.generateModelsIndexFile)(prismaClientDmmf, project_js_1.project, outputDir, config);
    await project_js_1.project.save();
}
//# sourceMappingURL=prisma-generator.js.map