import { Project, OptionalKind, EnumMemberStructure } from 'ts-morph';
import path from 'path';
import { PrismaClassDTOGeneratorConfig } from './prisma-generator.js';

export function generateExtraEnum(
    project: Project,
    outputDir: string,
    enumName: string,
    enumConfig: { values: Array<string> },
    config: PrismaClassDTOGeneratorConfig,
) {
    const dirPath = path.resolve(outputDir, 'enums');
    const name = enumName; //config?.extra?.options?.skipExtraPrefix ? enumName : `Extra${enumName}`;
    const filePath = path.resolve(dirPath, `${name}.enum.ts`);
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });

    sourceFile.addEnum({
        isExported: true,
        name: `${name}`,
        members: enumConfig.values.map<OptionalKind<EnumMemberStructure>>((value) => ({
            name: value,
            value,
        })),
    });
}
