import { Project, OptionalKind, EnumMemberStructure } from 'ts-morph';
import path from 'path';

export function generateExtraEnum(
    project: Project,
    outputDir: string,
    enumName: string,
    enumConfig: { values: Array<string> }
) {
    const dirPath = path.resolve(outputDir, 'enums');
    const filePath = path.resolve(dirPath, `Extra${enumName}.enum.ts`);
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });

    sourceFile.addEnum({
        isExported: true,
        name: `Extra${enumName}`,
        members: enumConfig.values.map<OptionalKind<EnumMemberStructure>>((value) => ({
            name: value,
            value,
        })),
    });
}
