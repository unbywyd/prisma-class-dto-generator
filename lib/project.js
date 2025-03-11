import { Project, ScriptTarget, ModuleKind } from 'ts-morph';
const compilerOptions = {
    target: ScriptTarget.ES2019,
    module: ModuleKind.CommonJS,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    esModuleInterop: true,
};
export const project = new Project({
    compilerOptions: {
        ...compilerOptions,
    },
});
//# sourceMappingURL=project.js.map