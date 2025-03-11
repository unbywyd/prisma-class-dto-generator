import path from 'path';
export function generateExtraEnum(project, outputDir, enumName, enumConfig, config) {
    const dirPath = path.resolve(outputDir, 'enums');
    const name = enumName; //config?.extra?.options?.skipExtraPrefix ? enumName : `Extra${enumName}`;
    const filePath = path.resolve(dirPath, `${name}.enum.ts`);
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });
    sourceFile.addEnum({
        isExported: true,
        name: `${name}`,
        members: enumConfig.values.map((value) => ({
            name: value,
            value,
        })),
    });
}
//# sourceMappingURL=generate-extra-enums.js.map