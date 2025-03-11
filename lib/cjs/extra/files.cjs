var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var files_exports = {};
__export(files_exports, {
  BodyMultipart: () => BodyMultipart,
  IsFile: () => IsFile,
  IsFiles: () => IsFiles,
  UseMulter: () => UseMulter,
  UseMultipart: () => UseMultipart,
  parseFileSize: () => parseFileSize
});
module.exports = __toCommonJS(files_exports);
var import_class_validator = require("class-validator");
var import_class_validator_jsonschema = require("class-validator-jsonschema");
var import_routing_controllers = require("routing-controllers");
var import_multer = __toESM(require("multer"), 1);
var import_bytes = __toESM(require("bytes"), 1);
var import_routing_controllers_openapi = require("routing-controllers-openapi");
var import_toDTO = require("../utils/toDTO.cjs");
function parseFileSize(value) {
  if (typeof value === "number") {
    return value;
  }
  return parseFloat((0, import_bytes.default)(value));
}
const FILE_FIELDS_METADATA = Symbol("FILE_FIELDS_METADATA");
function storeFileFieldMetadata(target, propertyKey, isArray, options) {
  const existing = Reflect.getMetadata(FILE_FIELDS_METADATA, target.constructor) || [];
  existing.push({
    propertyKey,
    isArray,
    options
  });
  Reflect.defineMetadata(FILE_FIELDS_METADATA, existing, target.constructor);
}
function getFileFieldsMetadata(dtoClass) {
  return Reflect.getMetadata(FILE_FIELDS_METADATA, dtoClass) || [];
}
function IsFile(options = {}) {
  return (target, propertyKey) => {
    storeFileFieldMetadata(target, propertyKey, false, options);
    if (!options.isRequired) {
      (0, import_class_validator.IsOptional)()(target, propertyKey);
    } else {
      (0, import_class_validator.IsDefined)()(target, propertyKey);
    }
    const schema = {
      type: "string",
      format: "binary",
      description: generateFileDescription(options, false)
    };
    if (options.maxSize) {
      schema["x-maxSize"] = options.maxSize;
    }
    if (options.minSize) {
      schema["x-minSize"] = options.minSize;
    }
    if (options.mimeTypes) {
      schema["x-mimeTypes"] = options.mimeTypes?.map((item) => item instanceof RegExp ? item.toString() : new RegExp(item).toString());
    }
    if (options.name) {
      schema["x-fieldName"] = options.name;
    }
    (0, import_class_validator_jsonschema.JSONSchema)(schema)(target, propertyKey);
  };
}
function IsFiles(options = {}) {
  return (target, propertyKey) => {
    storeFileFieldMetadata(target, propertyKey, true, options);
    if (!options.isRequired) {
      (0, import_class_validator.IsOptional)()(target, propertyKey);
    } else {
      (0, import_class_validator.IsDefined)()(target, propertyKey);
    }
    (0, import_class_validator.IsArray)()(target, propertyKey);
    const schema = {
      type: "array",
      description: generateFileDescription(options, true),
      items: {
        type: "string",
        format: "binary"
      }
    };
    if (typeof options.maxFiles === "number") {
      schema.maxItems = options.maxFiles;
    }
    if (typeof options.minFiles === "number") {
      schema.minItems = options.minFiles;
    }
    if (options.maxSize) {
      schema["x-maxSize"] = options.maxSize;
    }
    if (options.minSize) {
      schema["x-minSize"] = options.minSize;
    }
    if (options.mimeTypes) {
      schema["x-mimeTypes"] = options.mimeTypes?.map((item) => item instanceof RegExp ? item.toString() : new RegExp(item).toString());
    }
    if (options.name) {
      schema["x-fieldName"] = options.name;
    }
    (0, import_class_validator_jsonschema.JSONSchema)(schema)(target, propertyKey);
  };
}
function BodyMultipart(type) {
  return (0, import_routing_controllers.createParamDecorator)({
    required: true,
    async value(action) {
      const req = action.request;
      const bodyData = type ? (0, import_toDTO.toDTO)(type, req.body || {}) : req.body || {};
      const data = Array.isArray(req.files) ? { ...bodyData, files: req.files } : { ...bodyData, ...req.files || {} };
      return data;
    }
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
  const uploadEngine = (0, import_multer.default)({ storage: import_multer.default.memoryStorage() });
  return function(target, propertyKey, descriptor) {
    const fileFields = getFileFieldsMetadata(dtoClass);
    const multerFields = fileFields.map((meta) => {
      const fieldName = meta.options.name || meta.propertyKey;
      const maxCount = meta.isArray ? meta.options.maxFiles ?? 99 : 1;
      return { name: fieldName, maxCount };
    });
    (0, import_routing_controllers.UseBefore)((req, res, next) => {
      uploadEngine.fields(multerFields)(req, res, (err) => {
        if (err) return next(err);
        if (!req.files) return next();
        for (const meta of fileFields) {
          const fieldName = meta.options.name || meta.propertyKey;
          const files = req.files[fieldName];
          if (!files || files.length === 0) {
            if (meta.options.isRequired) {
              return next(new import_routing_controllers.BadRequestError(`No files uploaded for field: ${fieldName}`));
            } else {
              if (meta.isArray) {
                req.files[fieldName] = [];
              } else {
                req.files[fieldName] = void 0;
              }
            }
            continue;
          }
          if (meta.isArray) {
            if (meta.options.minFiles && files.length < meta.options.minFiles) {
              return next(
                new import_routing_controllers.BadRequestError(
                  `Too few files uploaded for '${fieldName}'. Minimum number: ${meta.options.minFiles}.`
                )
              );
            }
            if (meta.options.maxFiles && files.length > meta.options.maxFiles) {
              return next(
                new import_routing_controllers.BadRequestError(
                  `Too many files uploaded for '${fieldName}'. Maximum number: ${meta.options.maxFiles}.`
                )
              );
            }
          } else {
            if (meta?.options?.isRequired && files.length === 0) {
              return next(new import_routing_controllers.BadRequestError(`No files uploaded for field: ${fieldName}`));
            } else if (files?.length) {
              req.files[fieldName] = files[0];
            }
          }
          for (const file of files) {
            if (meta.options.minSize) {
              const minSizeBytes = parseFileSize(meta.options.minSize);
              if (file.size < minSizeBytes) {
                return next(
                  new import_routing_controllers.BadRequestError(
                    `File ${file.originalname} is too small. Minimum size is ${meta.options.minSize}.`
                  )
                );
              }
            }
            if (meta.options.maxSize) {
              const maxSizeBytes = parseFileSize(meta.options.maxSize);
              if (file.size > maxSizeBytes) {
                return next(
                  new import_routing_controllers.BadRequestError(
                    `File ${file.originalname} is too large. Maximum size is ${meta.options.maxSize}.`
                  )
                );
              }
            }
            if (meta.options.mimeTypes && meta.options.mimeTypes.length > 0) {
              const matched = meta.options.mimeTypes.some((item) => {
                const regex = item instanceof RegExp ? item : new RegExp(item);
                return regex.test(file.mimetype);
              });
              if (!matched) {
                return next(new import_routing_controllers.BadRequestError(`File ${file.originalname} has invalid type (${file.mimetype}). Allowed: ${meta.options.mimeTypes.map((item) => item instanceof RegExp ? item.toString() : new RegExp(item).toString()).join(", ")}.`));
              }
            }
          }
        }
        next();
      });
    })(target, propertyKey, descriptor);
    return (0, import_routing_controllers_openapi.OpenAPI)((operation) => {
      operation.requestBody = operation.requestBody || {};
      operation.requestBody.content = operation.requestBody.content || {};
      const schemas = (0, import_class_validator_jsonschema.validationMetadatasToSchemas)({ refPointerPrefix: "#/components/schemas/" });
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
              format: "binary"
            }
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
            description: generateFileDescription(meta.options, false)
          };
        }
      }
      operation.requestBody.content["multipart/form-data"] = {
        schema: dtoSchema
      };
      return operation;
    })(target, propertyKey, descriptor);
  };
}
function UseMultipart() {
  return function(target, propertyKey, descriptor) {
    const upload = (0, import_multer.default)();
    (0, import_routing_controllers.UseBefore)(upload.any())(target, propertyKey, descriptor);
    (0, import_routing_controllers_openapi.OpenAPI)({
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object"
            }
          }
        }
      }
    })(target, propertyKey, descriptor);
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BodyMultipart,
  IsFile,
  IsFiles,
  UseMulter,
  UseMultipart,
  parseFileSize
});
