import { GeneratorOptions, DMMF } from '@prisma/generator-helper';
import { Project } from 'ts-morph';

type PrismaClassDTOGeneratorModelConfig = {
    excludeFields?: string[];
    excludeModels?: string[];
    excludeIdFields?: boolean;
    excludeDateAtFields?: boolean;
    excludeIdRelationFields?: boolean;
    excludeModelFields?: {
        [modelName: string]: string[];
    };
    makeFieldsOptional?: boolean;
    includeModelFields?: {
        [modelName: string]: Array<string | PrismaClassDTOGeneratorField>;
    };
    includeRelations?: boolean;
    extendModels?: {
        [modelName: string]: {
            fields: Array<PrismaClassDTOGeneratorField>;
        };
    };
};
type PrismaClassDTOGeneratorListModelConfig = {
    pagination?: true;
    outputModelName?: string;
    filters?: Array<string | PrismaClassDTOGeneratorField>;
    orderable?: boolean | Array<string>;
};
type PrismaClassDTOGeneratorConfig = {
    input: PrismaClassDTOGeneratorModelConfig;
    output: PrismaClassDTOGeneratorModelConfig;
    excludeModels?: string[];
    strictMode?: boolean;
    lists?: {
        [modelName: string]: PrismaClassDTOGeneratorListModelConfig;
    };
    extra?: {
        enums?: {
            [enumName: string]: {
                values: Array<string>;
            };
        };
        models: {
            [modelName: string]: {
                type: "input" | "output";
                fields: Array<PrismaClassDTOGeneratorField>;
            };
        };
    };
};
declare function generate(options: GeneratorOptions): Promise<void>;

type PrismaClassDTOGeneratorField = DMMF.Field & {
    isExtra?: boolean;
    isList?: boolean;
    options?: Record<string, any>;
};
declare function generateClass(config: PrismaClassDTOGeneratorConfig, project: Project, outputDir: string, model: DMMF.Model, mainConfig: PrismaClassDTOGeneratorConfig, foreignKeyMap: Map<string, string>, refs: Array<{
    type: 'input' | 'output';
    name: string;
}>): Promise<string[]>;

export { type PrismaClassDTOGeneratorConfig as P, type PrismaClassDTOGeneratorListModelConfig as a, type PrismaClassDTOGeneratorModelConfig as b, generateClass as c, type PrismaClassDTOGeneratorField as d, generate as g };
