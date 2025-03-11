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
var removeDir_exports = {};
__export(removeDir_exports, {
  default: () => removeDir
});
module.exports = __toCommonJS(removeDir_exports);
var import_path = __toESM(require("path"), 1);
var import_fs = require("fs");
async function removeDir(dirPath, onlyContent) {
  const dirEntries = await import_fs.promises.readdir(dirPath, { withFileTypes: true });
  await Promise.all(
    dirEntries.map(async (dirEntry) => {
      const fullPath = import_path.default.join(dirPath, dirEntry.name);
      return dirEntry.isDirectory() ? await removeDir(fullPath, false) : await import_fs.promises.unlink(fullPath);
    })
  );
  if (!onlyContent) {
    await import_fs.promises.rmdir(dirPath);
  }
}
