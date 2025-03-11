"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDTO = toDTO;
const class_transformer_1 = require("class-transformer");
function toDTO(DTOClass, data, options = {}) {
    return (0, class_transformer_1.plainToClass)(DTOClass, data, {
        ...options,
        excludeExtraneousValues: true,
    });
}
//# sourceMappingURL=toDTO.js.map