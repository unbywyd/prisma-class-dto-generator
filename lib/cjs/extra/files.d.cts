declare function parseFileSize(value: string | number): number;
interface FileFieldOptions {
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
interface FileFieldMetadata {
    propertyKey: string;
    isArray: boolean;
    options: FileFieldOptions;
}
/**
 * @IsFile - a decorator for a single file field (Express.Multer.File).
 */
declare function IsFile(options?: FileFieldOptions): PropertyDecorator;
/**
 * @IsFiles - a decorator for an array of files (Express.Multer.File[]).
 */
declare function IsFiles(options?: FileFieldOptions): PropertyDecorator;
/**
 * @BodyMultipart - merges req.body and req.files into one object.
 */
declare function BodyMultipart<T>(type?: {
    new (): T;
}): ParameterDecorator;
declare function UseMulter(dtoClass: Function): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
declare function UseMultipart(): MethodDecorator;

export { BodyMultipart, type FileFieldMetadata, type FileFieldOptions, IsFile, IsFiles, UseMulter, UseMultipart, parseFileSize };
