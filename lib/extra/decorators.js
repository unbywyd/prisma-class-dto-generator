"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixArrayJsonSchemaReference = FixArrayJsonSchemaReference;
exports.FixItemJsonSchemaReference = FixItemJsonSchemaReference;
exports.IsEntity = IsEntity;
exports.ReferenceModel = ReferenceModel;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const class_validator_jsonschema_1 = require("class-validator-jsonschema");
const async_resolver_js_1 = require("./async-resolver.js");
const syncqueue_1 = require("@tsdiapi/syncqueue");
function FixArrayJsonSchemaReference(reference) {
    return (0, class_validator_jsonschema_1.JSONSchema)({
        type: "array",
        items: {
            $ref: `#/components/schemas/${reference.name}`,
        },
    });
}
function FixItemJsonSchemaReference(reference) {
    return (0, class_validator_jsonschema_1.JSONSchema)({
        $ref: `#/components/schemas/${reference.name}`,
    });
}
function ApplyJsonSchemaType(type, target, propertyKey, isArray) {
    if (type) {
        if (isArray) {
            FixArrayJsonSchemaReference(type)(target, propertyKey);
        }
        else {
            FixItemJsonSchemaReference(type)(target, propertyKey);
        }
    }
}
function IsEntity(typeFunction, options) {
    const isArray = (options === null || options === void 0 ? void 0 : options.each) || false;
    return function (target, propertyKey) {
        (0, class_validator_1.ValidateNested)({ each: isArray })(target, propertyKey);
        const referenceType = typeFunction();
        Reflect.defineMetadata("design:itemtype", referenceType, target, propertyKey);
        if (referenceType instanceof Promise) {
            const task = referenceType.then(type => {
                (0, class_transformer_1.Type)(() => type)(target, propertyKey);
                ApplyJsonSchemaType(type, target, propertyKey, isArray);
            }).catch(err => {
                console.error("Error resolving type for property :" + String(propertyKey), err);
            });
            (0, syncqueue_1.getSyncQueueProvider)().addTask(task);
            async_resolver_js_1.AsyncResolver.addTask(task);
        }
        else {
            (0, class_transformer_1.Type)(() => referenceType)(target, propertyKey);
            ApplyJsonSchemaType(referenceType, target, propertyKey, isArray);
        }
    };
}
function ReferenceModel(modelName) {
    return (target, propertyKey) => {
        (0, class_validator_jsonschema_1.JSONSchema)({
            description: `@reference ${modelName}`,
        })(target, propertyKey);
    };
}
//# sourceMappingURL=decorators.js.map