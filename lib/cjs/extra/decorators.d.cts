declare function FixArrayJsonSchemaReference(reference: any): PropertyDecorator;
declare function FixItemJsonSchemaReference(reference: any): PropertyDecorator;
declare function IsEntity(typeFunction: () => Promise<Function> | Function, options?: {
    each: boolean;
}): PropertyDecorator;
declare function ReferenceModel<T>(modelName: T): PropertyDecorator;

export { FixArrayJsonSchemaReference, FixItemJsonSchemaReference, IsEntity, ReferenceModel };
