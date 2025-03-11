"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncResolver = void 0;
class AsyncResolver {
    static tasks = [];
    static addTask(task) {
        this.tasks.push(task);
    }
    static async resolveAll() {
        if (this.tasks.length > 0) {
            await Promise.all(this.tasks);
        }
    }
}
exports.AsyncResolver = AsyncResolver;
//# sourceMappingURL=async-resolver.js.map