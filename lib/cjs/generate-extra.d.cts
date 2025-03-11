import { Project } from 'ts-morph';
import { DMMF } from '@prisma/generator-helper';
import { P as PrismaClassDTOGeneratorConfig } from './generate-class-DEBfMVFZ.cjs';

type ExtraField = Partial<DMMF.Field> & {
    name: string;
    type: string;
    isRequired?: boolean;
    relationName?: string;
};
declare function generateExtraModel(config: PrismaClassDTOGeneratorConfig, project: Project, outputDir: string, modelName: string, modelConfig: {
    fields: Array<ExtraField>;
    type: "input" | "output";
}): void;

export { generateExtraModel };
