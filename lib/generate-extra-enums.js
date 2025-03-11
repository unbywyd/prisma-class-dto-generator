"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExtraEnum = generateExtraEnum;
const path_1 = __importDefault(require("path"));
function generateExtraEnum(project, outputDir, enumName, enumConfig, config) {
    const dirPath = path_1.default.resolve(outputDir, 'enums');
    const name = enumName; //config?.extra?.options?.skipExtraPrefix ? enumName : `Extra${enumName}`;
    const filePath = path_1.default.resolve(dirPath, `${name}.enum.ts`);
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