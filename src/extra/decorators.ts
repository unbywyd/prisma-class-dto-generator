
import {
    ValidateNested
} from "class-validator";
import { Type } from "class-transformer";
import { JSONSchema } from "class-validator-jsonschema";
import { AsyncResolver } from "./async-resolver.js";
import { getSyncQueueProvider } from "@tsdiapi/syncqueue";

export function FixArrayJsonSchemaReference(reference: any): PropertyDecorator {
    return JSONSchema({
        type: "array",
        items: {
            $ref: `#/components/schemas/${reference.name}`,
        },
    }) as PropertyDecorator;
}

export function FixItemJsonSchemaReference(reference: any): PropertyDecorator {
    return JSONSchema({
        $ref: `#/components/schemas/${reference.name}`,
    }) as PropertyDecorator;
}

function ApplyJsonSchemaType(type: any, target: Object, propertyKey: string | symbol, isArray: boolean) {
    if (type) {
        if (isArray) {
            FixArrayJsonSchemaReference(type)(target, propertyKey);
        } else {
            FixItemJsonSchemaReference(type)(target, propertyKey);
        }
    }
}

export function IsEntity(typeFunction: () => Promise<Function> | Function, options?: { each: boolean }): PropertyDecorator {
    const isArray = options?.each || false;
    return function (target: Object, propertyKey: string | symbol) {
        ValidateNested({ each: isArray })(target, propertyKey);

        const referenceType = typeFunction();
        Reflect.defineMetadata("design:itemtype", referenceType, target, propertyKey);

        if (referenceType instanceof Promise) {
            const task = referenceType.then(type => {
                Type(() => type)(target, propertyKey);
                ApplyJsonSchemaType(type, target, propertyKey, isArray);
            }).catch(err => {
                console.error("Error resolving type for property :" + String(propertyKey), err);
            });
            getSyncQueueProvider().addTask(task);
            AsyncResolver.addTask(task);
        } else {
            Type(() => referenceType)(target, propertyKey);
            ApplyJsonSchemaType(referenceType, target, propertyKey, isArray);
        }
    };
}

export function ReferenceModel<T>(modelName: T): PropertyDecorator {
    return (target, propertyKey) => {
        JSONSchema({
            description: `@reference ${modelName}`,
        })(target, propertyKey as string);
    };
}