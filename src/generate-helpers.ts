import { SourceFile } from 'ts-morph';

export function generateHelpersIndexFile(sourceFile: SourceFile) {
  sourceFile.addStatements(/* ts */ `
    import { IsBoolean, IsNumber, IsString } from "class-validator";
    import { Expose, plainToClass} from "class-transformer";
    import { validationMetadatasToSchemas } from "class-validator-jsonschema";
    type EnumLike = Array<unknown> | Record<string, unknown>;

    export function getEnumValues<T extends EnumLike>(enumType: T): Array<string> {
      return Array.from(
        new Set(
          Object.keys(enumType)
            .filter((key) => isNaN(Number(key))) // Оставляем только строковые ключи
            .map((key) => (enumType as any)[key]) // Получаем значения из enum
            .filter((value): value is string => typeof value === 'string') // Убираем нестроковые значения
        )
      );
    }

    export function toSlug(str: string) {
      return str
        .trim()
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/[^a-zA-Z0-9_.]+/g, "_")
        .toUpperCase();
    }
    type Constructor<T> = new () => T;

    export function toDTO<T>(DTOClass: Constructor<T>, data: any): T {
      return plainToClass(DTOClass, data, {
        excludeExtraneousValues: true,
      });
    }

    export class IResponseError {
      @IsString()
      message: string;

      @IsString()
      errors: {};

      @IsNumber()
      status: number = 401;

      constructor(message: string, status: number = 401) {
        this.message = message;
        this.errors = {
          [toSlug(message)]: [message],
        };
        this.status = status;
      }
   }

    export type APIResponse<T> = T | IResponseError;

    export class OutputSuccessOrFailDTO {
      @IsBoolean()
      @Expose()
      success: boolean;
    }
    export function successOrFailResponse(success: boolean): OutputSuccessOrFailDTO {
      return toDTO(OutputSuccessOrFailDTO, { success });
    }
      
    export function responseError(
      message: string,
      status: number = 401
    ): IResponseError {
      return new IResponseError(message, status);
    }

    export function getOpenAPIResponse<T>(
      responseClass: new () => T,
      isArray: boolean = false
    ) {
      const schemas = validationMetadatasToSchemas({
        refPointerPrefix: "#/components/schemas/",
      });

      const schemaName = responseClass.name;

      if (!schemas[schemaName]) {
        throw new Error(\`Schema not found for \${schemaName}\`);
      }

      const schemaReference = isArray
        ? { type: "array", items: { $ref: \`#/components/schemas/\${schemaName}\` } }
        : { $ref: \`#/components/schemas/\${schemaName}\` };

      return {
        "400": {
          description: "Bad request",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/IResponseError",
              },
            },
          },
        },
        "200": {
          description: "Successful response",
          content: {
            "application/json": {
              schema: schemaReference,
            },
          },
        },
      };
    }
  `);
}
