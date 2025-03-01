import { ClassTransformOptions, plainToClass } from "class-transformer";
type Constructor<T> = new () => T;
export function toDTO<T>(DTOClass: Constructor<T>, data: any, options: Partial<ClassTransformOptions> = {}): T {
    return plainToClass(DTOClass, data, {
        ...options,
        excludeExtraneousValues: true,
    });
}
