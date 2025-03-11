var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var decorators_exports = {};
__export(decorators_exports, {
  FixArrayJsonSchemaReference: () => FixArrayJsonSchemaReference,
  FixItemJsonSchemaReference: () => FixItemJsonSchemaReference,
  IsEntity: () => IsEntity,
  ReferenceModel: () => ReferenceModel
});
module.exports = __toCommonJS(decorators_exports);
var import_class_validator = require("class-validator");
var import_class_transformer = require("class-transformer");
var import_class_validator_jsonschema = require("class-validator-jsonschema");
var import_async_resolver = require("./async-resolver.js");
var import_syncqueue = require("@tsdiapi/syncqueue");
function FixArrayJsonSchemaReference(reference) {
  return (0, import_class_validator_jsonschema.JSONSchema)({
    type: "array",
    items: {
      $ref: `#/components/schemas/${reference.name}`
    }
  });
}
function FixItemJsonSchemaReference(reference) {
  return (0, import_class_validator_jsonschema.JSONSchema)({
    $ref: `#/components/schemas/${reference.name}`
  });
}
function ApplyJsonSchemaType(type, target, propertyKey, isArray) {
  if (type) {
    if (isArray) {
      FixArrayJsonSchemaReference(type)(target, propertyKey);
    } else {
      FixItemJsonSchemaReference(type)(target, propertyKey);
    }
  }
}
function IsEntity(typeFunction, options) {
  const isArray = options?.each || false;
  return function(target, propertyKey) {
    (0, import_class_validator.ValidateNested)({ each: isArray })(target, propertyKey);
    const referenceType = typeFunction();
    Reflect.defineMetadata("design:itemtype", referenceType, target, propertyKey);
    if (referenceType instanceof Promise) {
      const task = referenceType.then((type) => {
        (0, import_class_transformer.Type)(() => type)(target, propertyKey);
        ApplyJsonSchemaType(type, target, propertyKey, isArray);
      }).catch((err) => {
        console.error("Error resolving type for property :" + String(propertyKey), err);
      });
      (0, import_syncqueue.getSyncQueueProvider)().addTask(task);
      import_async_resolver.AsyncResolver.addTask(task);
    } else {
      (0, import_class_transformer.Type)(() => referenceType)(target, propertyKey);
      ApplyJsonSchemaType(referenceType, target, propertyKey, isArray);
    }
  };
}
function ReferenceModel(modelName) {
  return (target, propertyKey) => {
    (0, import_class_validator_jsonschema.JSONSchema)({
      description: `@reference ${modelName}`
    })(target, propertyKey);
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FixArrayJsonSchemaReference,
  FixItemJsonSchemaReference,
  IsEntity,
  ReferenceModel
});
