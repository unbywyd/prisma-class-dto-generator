import { Project } from 'ts-morph';
import { P as PrismaClassDTOGeneratorConfig } from './generate-class-DEBfMVFZ.cjs';
import '@prisma/generator-helper';

declare function generateExtraEnum(project: Project, outputDir: string, enumName: string, enumConfig: {
    values: Array<string>;
}, config: PrismaClassDTOGeneratorConfig): void;

export { generateExtraEnum };
