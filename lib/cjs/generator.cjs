#!/usr/bin/env node
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
var generator_exports = {};
module.exports = __toCommonJS(generator_exports);
__reExport(generator_exports, require("./utils/toDTO.js"), module.exports);
__reExport(generator_exports, require("./extra/async-resolver.js"), module.exports);
__reExport(generator_exports, require("./extra/decorators.js"), module.exports);
__reExport(generator_exports, require("./extra/files.js"), module.exports);
__reExport(generator_exports, require("./utils/getEnumValues.js"), module.exports);
var import_index = require("./index.js");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./utils/toDTO.js"),
  ...require("./extra/async-resolver.js"),
  ...require("./extra/decorators.js"),
  ...require("./extra/files.js"),
  ...require("./utils/getEnumValues.js")
});
