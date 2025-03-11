import path from 'path';
export default function generateEnum(project, outputDir, enumItem) {
    const dirPath = path.resolve(outputDir, 'enums');
    const filePath = path.resolve(dirPath, `${enumItem.name}.enum.ts`);
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });
    sourceFile.addEnum({
        isExported: true,
        name: enumItem.name,
        members: enumItem.values.map(({ name }) => ({
            name,
            value: name,
        })),
    });
}
//# sourceMappingURL=generate-enum.js.map