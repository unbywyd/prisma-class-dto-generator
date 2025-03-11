"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateEnum;
const path_1 = __importDefault(require("path"));
function generateEnum(project, outputDir, enumItem) {
    const dirPath = path_1.default.resolve(outputDir, 'enums');
    const filePath = path_1.default.resolve(dirPath, `${enumItem.name}.enum.ts`);
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