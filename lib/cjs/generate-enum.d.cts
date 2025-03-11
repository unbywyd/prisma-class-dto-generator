import { DMMF } from '@prisma/generator-helper';
import { Project } from 'ts-morph';

declare function generateEnum(project: Project, outputDir: string, enumItem: DMMF.DatamodelEnum): void;

export { generateEnum as default };
