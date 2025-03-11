
import { IsArray, IsDefined, IsOptional } from "class-validator";
import { validationMetadatasToSchemas, JSONSchema } from "class-validator-jsonschema";
import type { NextFunction, Request, Response } from "express";
import { BadRequestError, createParamDecorator, UseBefore } from "routing-controllers";
import multer from "multer";
import bytes from "bytes";
import { OpenAPI } from "routing-controllers-openapi";
import { toDTO } from "../utils/toDTO.js";

export function parseFileSize(value: string | number): number {
    if (typeof value === "number") {
        return value;
    }
    return parseFloat(bytes(value as any));
}

export interface FileFieldOptions {
    name?: string;
    isRequired?: boolean;
    maxSize?: string;
    minSize?: string;
    maxFiles?: number;
    minFiles?: number;
    mimeTypes?: RegExp[] | string[];
}

/**
 * Metadata for a single file field.
 */
export interface FileFieldMetadata {
    propertyKey: string;
    isArray: boolean;
    options: FileFieldOptions;
}

const FILE_FIELDS_METADATA = Symbol("FILE_FIELDS_METADATA");

function storeFileFieldMetadata(
    target: any,
    propertyKey: string,
    isArray: boolean,
    options: FileFieldOptions
) {
    const existing: FileFieldMetadata[] =
        Reflect.getMetadata(FILE_FIELDS_METADATA, target.constructor) || [];
    existing.push({
        propertyKey,
        isArray,
        options,
    });
    Reflect.defineMetadata(FILE_FIELDS_METADATA, existing, target.constructor);
}

function getFileFieldsMetadata(dtoClass: Function): FileFieldMetadata[] {
    return Reflect.getMetadata(FILE_FIELDS_METADATA, dtoClass) || [];
}

/**
 * @IsFile - a decorator for a single file field (Express.Multer.File).
 */
export function IsFile(options: FileFieldOptions = {}): PropertyDecorator {
    return (target, propertyKey) => {
        storeFileFieldMetadata(target, propertyKey as string, false, options);
        if (!options.isRequired) {
            IsOptional()(target, propertyKey);
        } else {
            IsDefined()(target, propertyKey);
        }
        const schema: any = {
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
        JSONSchema(schema)(target, propertyKey as string);
    };
}

/**
 * @IsFiles - a decorator for an array of files (Express.Multer.File[]).
 */
export function IsFiles(options: FileFieldOptions = {}): PropertyDecorator {
    return (target, propertyKey) => {
        storeFileFieldMetadata(target, propertyKey as string, true, options);
        if (!options.isRequired) {
            IsOptional()(target, propertyKey);
        } else {
            IsDefined()(target, propertyKey);
        }
        IsArray()(target, propertyKey);

        const schema: any = {
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

        JSONSchema(schema)(target, propertyKey as string);
    };
}

/**
 * @BodyMultipart - merges req.body and req.files into one object.
 */
export function BodyMultipart<T>(type?: { new(): T }): ParameterDecorator {
    return createParamDecorator({
        required: true,
        async value(action) {
            const req: Request = action.request;
            const bodyData = type ? toDTO(type, req.body || {}) : req.body || {};

            const data = Array.isArray(req.files)
                ? { ...bodyData, files: req.files }
                : { ...bodyData, ...req.files || {} };

            return data;
        },
    });
}

function generateFileDescription(options: FileFieldOptions, isArray: boolean): string {
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

export function UseMulter(dtoClass: Function) {
    const uploadEngine = multer({ storage: multer.memoryStorage() });

    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const fileFields: FileFieldMetadata[] = getFileFieldsMetadata(dtoClass);
        const multerFields = fileFields.map((meta) => {
            const fieldName = meta.options.name || meta.propertyKey;
            const maxCount = meta.isArray ? (meta.options.maxFiles ?? 99) : 1;
            return { name: fieldName, maxCount };
        });

        UseBefore((req: Request, res: Response, next: NextFunction) => {
            uploadEngine.fields(multerFields)(req, res, (err) => {
                if (err) return next(err);
                if (!req.files) return next();

                for (const meta of fileFields) {
                    const fieldName = meta.options.name || meta.propertyKey;
                    const files = (req.files as any)[fieldName] as Express.Multer.File[] | undefined;

                    if (!files || files.length === 0) {
                        if (meta.options.isRequired) {
                            return next(new BadRequestError(`No files uploaded for field: ${fieldName}`));
                        } else {
                            if (meta.isArray) {
                                (req.files as any)[fieldName] = [];
                            } else {
                                (req.files as any)[fieldName] = undefined;
                            }
                        }
                        continue;
                    }

                    if (meta.isArray) {
                        if (meta.options.minFiles && files.length < meta.options.minFiles) {
                            return next(
                                new BadRequestError(
                                    `Too few files uploaded for '${fieldName}'. Minimum number: ${meta.options.minFiles}.`
                                )
                            );
                        }
                        if (meta.options.maxFiles && files.length > meta.options.maxFiles) {
                            return next(
                                new BadRequestError(
                                    `Too many files uploaded for '${fieldName}'. Maximum number: ${meta.options.maxFiles}.`
                                )
                            );
                        }
                    } else {
                        if (meta?.options?.isRequired && files.length === 0) {
                            return next(new BadRequestError(`No files uploaded for field: ${fieldName}`));
                        } else if (files?.length) {
                            (req.files as any)[fieldName] = files[0];
                        }
                    }

                    for (const file of files) {
                        if (meta.options.minSize) {
                            const minSizeBytes = parseFileSize(meta.options.minSize);
                            if (file.size < minSizeBytes) {
                                return next(
                                    new BadRequestError(
                                        `File ${file.originalname} is too small. Minimum size is ${meta.options.minSize}.`
                                    )
                                );
                            }
                        }
                        if (meta.options.maxSize) {
                            const maxSizeBytes = parseFileSize(meta.options.maxSize);
                            if (file.size > maxSizeBytes) {
                                return next(
                                    new BadRequestError(
                                        `File ${file.originalname} is too large. Maximum size is ${meta.options.maxSize}.`
                                    )
                                );
                            }
                        }
                        if (meta.options.mimeTypes && meta.options.mimeTypes.length > 0) {
                            const matched = meta.options.mimeTypes.some((item) => {
                                const regex = item instanceof RegExp ? item : new RegExp(item); // Преобразуем строку в RegExp, если нужно
                                return regex.test(file.mimetype);
                            });

                            if (!matched) {
                                return next(new BadRequestError(`File ${file.originalname} has invalid type (${file.mimetype}). Allowed: ${meta.options.mimeTypes.map((item) => (item instanceof RegExp ? item.toString() : new RegExp(item).toString())).join(", ")
                                    }.`));
                            }
                        }
                    }
                }
                next();
            });
        })(target, propertyKey, descriptor);

        return OpenAPI((operation: any) => {
            operation.requestBody = operation.requestBody || {};
            operation.requestBody.content = operation.requestBody.content || {};

            const schemas = validationMetadatasToSchemas({ refPointerPrefix: "#/components/schemas/" });
            const dtoSchema = schemas[dtoClass.name];

            if (!dtoSchema) {
                throw new Error(
                    `Schema for ${dtoClass.name} not found. Make sure the class is decorated with class-validator, reflect-metadata, and the schema generation is called appropriately.`
                );
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
                } else {
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

export function UseMultipart(): MethodDecorator {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const upload = multer();
        UseBefore(upload.any())(target, propertyKey, descriptor);

        OpenAPI({
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
