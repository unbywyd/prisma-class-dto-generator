var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var generate_extra_enums_exports = {};
__export(generate_extra_enums_exports, {
  generateExtraEnum: () => generateExtraEnum
});
module.exports = __toCommonJS(generate_extra_enums_exports);
var import_path = __toESM(require("path"), 1);
function generateExtraEnum(project, outputDir, enumName, enumConfig, config) {
  const dirPath = import_path.default.resolve(outputDir, "enums");
  const name = enumName;
  const filePath = import_path.default.resolve(dirPath, `${name}.enum.ts`);
  const sourceFile = project.createSourceFile(filePath, void 0, {
    overwrite: true
  });
  sourceFile.addEnum({
    isExported: true,
    name: `${name}`,
    members: enumConfig.values.map((value) => ({
      name: value,
      value
    }))
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateExtraEnum
});
