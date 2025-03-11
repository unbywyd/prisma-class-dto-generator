var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var toDTO_exports = {};
__export(toDTO_exports, {
  toDTO: () => toDTO
});
module.exports = __toCommonJS(toDTO_exports);
var import_class_transformer = require("class-transformer");
function toDTO(DTOClass, data, options = {}) {
  return (0, import_class_transformer.plainToClass)(DTOClass, data, {
    ...options,
    excludeExtraneousValues: true
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  toDTO
});
