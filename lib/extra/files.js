"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFileSize = parseFileSize;
exports.IsFile = IsFile;
exports.IsFiles = IsFiles;
exports.BodyMultipart = BodyMultipart;
exports.UseMulter = UseMulter;
exports.UseMultipart = UseMultipart;
const class_validator_1 = require("class-validator");
const class_validator_jsonschema_1 = require("class-validator-jsonschema");
const routing_controllers_1 = require("routing-controllers");
const multer_1 = __importDefault(require("multer"));
const bytes_1 = __importDefault(require("bytes"));
const routing_controllers_openapi_1 = require("routing-controllers-openapi");
const toDTO_js_1 = require("../utils/toDTO.js");
function parseFileSize(value) {
    if (typeof value === "number") {
        return value;
    }
    return parseFloat((0, bytes_1.default)(value));
}
const FILE_FIELDS_METADATA = Symbol("FILE_FIELDS_METADATA");
function storeFileFieldMetadata(target, propertyKey, isArray, options) {
    const existing = Reflect.getMetadata(FILE_FIELDS_METADATA, target.constructor) || [];
    existing.push({
        propertyKey,
        isArray,
        options,
    });
    Reflect.defineMetadata(FILE_FIELDS_METADATA, existing, target.constructor);
}
function getFileFieldsMetadata(dtoClass) {
    return Reflect.getMetadata(FILE_FIELDS_METADATA, dtoClass) || [];
}
/**
 * @IsFile - a decorator for a single file field (Express.Multer.File).
 */
function IsFile(options = {}) {
    return (target, propertyKey) => {
        storeFileFieldMetadata(target, propertyKey, false, options);
        if (!options.isRequired) {
            (0, class_validator_1.IsOptional)()(target, propertyKey);
        }
        else {
            (0, class_validator_1.IsDefined)()(target, propertyKey);
        }
        const schema = {
            type: "string",
            format: "binary",
            description: generateFileDescription(options, false),
        };
        if (options.maxSize) {
            schema['x-maxSize'] = options.maxSize;
        }
        if (options.minSize) {
            schema['x-minSize'] = options.minSize;
        }
        if (options.mimeTypes) {
            schema['x-mimeTypes'] = options.mimeTypes?.map((item) => (item instanceof RegExp ? item.toString() : new RegExp(item).toString()));
        }
        if (options.name) {
            schema['x-fieldName'] = options.name;
        }
        (0, class_validator_jsonschema_1.JSONSchema)(schema)(target, propertyKey);
    };
}
/**
 * @IsFiles - a decorator for an array of files (Express.Multer.File[]).
 */
function IsFiles(options = {}) {
    return (target, propertyKey) => {
        storeFileFieldMetadata(target, propertyKey, true, options);
        if (!options.isRequired) {
            (0, class_validator_1.IsOptional)()(target, propertyKey);
        }
        else {
            (0, class_validator_1.IsDefined)()(target, propertyKey);
        }
        (0, class_validator_1.IsArray)()(target, propertyKey);
        const schema = {
            type: "array",
            description: generateFileDescription(options, true),
            items: {
                type: "string",
                format: "binary",
            },
        };
        if (typeof options.maxFiles === 'number') {
            schema.maxItems = options.maxFiles;
        }
        if (typeof options.minFiles === 'number') {
            schema.minItems = options.minFiles;
        }
        if (options.maxSize) {
            schema['x-maxSize'] = options.maxSize;
        }
        if (options.minSize) {
            schema['x-minSize'] = options.minSize;
        }
        if (options.mimeTypes) {
            schema['x-mimeTypes'] = options.mimeTypes?.map((item) => (item instanceof RegExp ? item.toString() : new RegExp(item).toString()));
        }
        if (options.name) {
            schema['x-fieldName'] = options.name;
        }
        (0, class_validator_jsonschema_1.JSONSchema)(schema)(target, propertyKey);
    };
}
/**
 * @BodyMultipart - merges req.body and req.files into one object.
 */
function BodyMultipart(type) {
    return (0, routing_controllers_1.createParamDecorator)({
        required: true,
        async value(action) {
            const req = action.request;
            const bodyData = type ? (0, toDTO_js_1.toDTO)(type, req.body || {}) : req.body || {};
            const data = Array.isArray(req.files)
                ? { ...bodyData, files: req.files }
                : { ...bodyData, ...req.files || {} };
            return data;
        },
    });
}
function generateFileDescription(options, isArray) {
    let description = `Upload ${isArray ? "multiple files" : "a file"}`;
    if (options.name) {
        description += ` under the key '${options.name}'.`;
    }
    if (options.mimeTypes && options.mimeTypes.length > 0) {
        const allowedTypes = options.mimeTypes.map((regex) => regex.toString()).join(", ");
        description += ` Allowed MIME types: ${allowedTypes}.`;
    }
    if (options.minSize) {
        description += ` Minimum size: ${options.minSize}.`;
    }
    if (options.maxSize) {
        description += ` Maximum size: ${options.maxSize}.`;
    }
    if (options.minFiles) {
        description += ` Minimum number of files: ${options.minFiles}.`;
    }
    if (options.maxFiles) {
        description += ` Maximum number of files: ${options.maxFiles}.`;
    }
    return description;
}
function UseMulter(dtoClass) {
    const uploadEngine = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
    return function (target, propertyKey, descriptor) {
        const fileFields = getFileFieldsMetadata(dtoClass);
        const multerFields = fileFields.map((meta) => {
            const fieldName = meta.options.name || meta.propertyKey;
            const maxCount = meta.isArray ? (meta.options.maxFiles ?? 99) : 1;
            return { name: fieldName, maxCount };
        });
        (0, routing_controllers_1.UseBefore)((req, res, next) => {
            uploadEngine.fields(multerFields)(req, res, (err) => {
                if (err)
                    return next(err);
                if (!req.files)
                    return next();
                for (const meta of fileFields) {
                    const fieldName = meta.options.name || meta.propertyKey;
                    const files = req.files[fieldName];
                    if (!files || files.length === 0) {
                        if (meta.options.isRequired) {
                            return next(new routing_controllers_1.BadRequestError(`No files uploaded for field: ${fieldName}`));
                        }
                        else {
                            if (meta.isArray) {
                                req.files[fieldName] = [];
                            }
                            else {
                                req.files[fieldName] = undefined;
                            }
                        }
                        continue;
                    }
                    if (meta.isArray) {
                        if (meta.options.minFiles && files.length < meta.options.minFiles) {
                            return next(new routing_controllers_1.BadRequestError(`Too few files uploaded for '${fieldName}'. Minimum number: ${meta.options.minFiles}.`));
                        }
                        if (meta.options.maxFiles && files.length > meta.options.maxFiles) {
                            return next(new routing_controllers_1.BadRequestError(`Too many files uploaded for '${fieldName}'. Maximum number: ${meta.options.maxFiles}.`));
                        }
                    }
                    else {
                        if (meta?.options?.isRequired && files.length === 0) {
                            return next(new routing_controllers_1.BadRequestError(`No files uploaded for field: ${fieldName}`));
                        }
                        else if (files?.length) {
                            req.files[fieldName] = files[0];
                        }
                    }
                    for (const file of files) {
                        if (meta.options.minSize) {
                            const minSizeBytes = parseFileSize(meta.options.minSize);
                            if (file.size < minSizeBytes) {
                                return next(new routing_controllers_1.BadRequestError(`File ${file.originalname} is too small. Minimum size is ${meta.options.minSize}.`));
                            }
                        }
                        if (meta.options.maxSize) {
                            const maxSizeBytes = parseFileSize(meta.options.maxSize);
                            if (file.size > maxSizeBytes) {
                                return next(new routing_controllers_1.BadRequestError(`File ${file.originalname} is too large. Maximum size is ${meta.options.maxSize}.`));
                            }
                        }
                        if (meta.options.mimeTypes && meta.options.mimeTypes.length > 0) {
                            const matched = meta.options.mimeTypes.some((item) => {
                                const regex = item instanceof RegExp ? item : new RegExp(item); // Преобразуем строку в RegExp, если нужно
                                return regex.test(file.mimetype);
                            });
                            if (!matched) {
                                return next(new routing_controllers_1.BadRequestError(`File ${file.originalname} has invalid type (${file.mimetype}). Allowed: ${meta.options.mimeTypes.map((item) => (item instanceof RegExp ? item.toString() : new RegExp(item).toString())).join(", ")}.`));
                            }
                        }
                    }
                }
                next();
            });
        })(target, propertyKey, descriptor);
        return (0, routing_controllers_openapi_1.OpenAPI)((operation) => {
            operation.requestBody = operation.requestBody || {};
            operation.requestBody.content = operation.requestBody.content || {};
            const schemas = (0, class_validator_jsonschema_1.validationMetadatasToSchemas)({ refPointerPrefix: "#/components/schemas/" });
            const dtoSchema = schemas[dtoClass.name];
            if (!dtoSchema) {
                throw new Error(`Schema for ${dtoClass.name} not found. Make sure the class is decorated with class-validator, reflect-metadata, and the schema generation is called appropriately.`);
            }
            if (dtoSchema.type !== "object") {
                dtoSchema.type = "object";
            }
            if (!dtoSchema.properties) {
                dtoSchema.properties = {};
            }
            for (const meta of fileFields) {
                const fieldName = meta.options.name || meta.propertyKey;
                if (meta.isArray) {
                    dtoSchema.properties[fieldName] = {
                        type: "array",
                        description: generateFileDescription(meta.options, true),
                        items: {
                            type: "string",
                            format: "binary",
                        },
                    };
                    if (meta.options.minFiles) {
                        dtoSchema.properties[fieldName].minItems = meta.options.minFiles;
                    }
                    if (meta.options.maxFiles) {
                        dtoSchema.properties[fieldName].maxItems = meta.options.maxFiles;
                    }
                }
                else {
                    dtoSchema.properties[fieldName] = {
                        type: "string",
                        format: "binary",
                        description: generateFileDescription(meta.options, false),
                    };
                }
            }
            operation.requestBody.content["multipart/form-data"] = {
                schema: dtoSchema,
            };
            return operation;
        })(target, propertyKey, descriptor);
    };
}
function UseMultipart() {
    return function (target, propertyKey, descriptor) {
        const upload = (0, multer_1.default)();
        (0, routing_controllers_1.UseBefore)(upload.any())(target, propertyKey, descriptor);
        (0, routing_controllers_openapi_1.OpenAPI)({
            requestBody: {
                required: true,
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                        },
                    },
                },
            },
        })(target, propertyKey, descriptor);
    };
}
//# sourceMappingURL=files.js.map