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
var getEnumValues_exports = {};
__export(getEnumValues_exports, {
  getEnumValues: () => getEnumValues
});
module.exports = __toCommonJS(getEnumValues_exports);
function getEnumValues(enumType) {
  return Array.from(
    new Set(
      Object.keys(enumType).filter((key) => isNaN(Number(key))).map((key) => enumType[key]).filter((value) => typeof value === "string")
      // Убираем нестроковые значения
    )
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getEnumValues
});
