var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var index_exports = {};
module.exports = __toCommonJS(index_exports);
__reExport(index_exports, require("./utils/toDTO.cjs"), module.exports);
__reExport(index_exports, require("./extra/async-resolver.cjs"), module.exports);
__reExport(index_exports, require("./extra/decorators.cjs"), module.exports);
__reExport(index_exports, require("./extra/files.cjs"), module.exports);
__reExport(index_exports, require("./utils/getEnumValues.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./utils/toDTO.cjs"),
  ...require("./extra/async-resolver.cjs"),
  ...require("./extra/decorators.cjs"),
  ...require("./extra/files.cjs"),
  ...require("./utils/getEnumValues.cjs")
});
