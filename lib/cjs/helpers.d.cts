import { DMMF } from '@prisma/generator-helper';
import { Project, OptionalKind, DecoratorStructure, SourceFile } from 'ts-morph';
import { P as PrismaClassDTOGeneratorConfig } from './generate-class-DEBfMVFZ.cjs';

declare const generateModelsIndexFile: (prismaClientDmmf: DMMF.Document, project: Project, outputDir: string, config: PrismaClassDTOGeneratorConfig) => void;
declare const shouldImportPrisma: (fields: DMMF.Field[]) => boolean;
declare const shouldImportHelpers: (fields: DMMF.Field[]) => boolean;
declare const getTSDataTypeFromFieldType: (field: DMMF.Field, config: PrismaClassDTOGeneratorConfig) => string;
declare const getDecoratorsByFieldType: (field: DMMF.Field, config: PrismaClassDTOGeneratorConfig) => OptionalKind<DecoratorStructure>[];
declare const getDecoratorsImportsByType: (field: DMMF.Field) => unknown[];
declare const generateClassValidatorImport: (sourceFile: SourceFile, validatorImports: Array<string>) => void;
declare const generatePrismaImport: (sourceFile: SourceFile) => void;
declare const generateRelationImportsImport: (sourceFile: SourceFile, relationImports: Array<string>) => void;
declare const generateHelpersImports: (sourceFile: SourceFile, helpersImports: Array<string>) => void;
declare const generateEnumImports: (sourceFile: SourceFile, fields: DMMF.Field[], config: PrismaClassDTOGeneratorConfig) => void;
declare function generateEnumsIndexFile(sourceFile: SourceFile, enumNames: string[]): void;
declare const generateClassTransformerImport: (sourceFile: SourceFile, transformerImports: Array<string>) => void;
type FieldDirectives = {
    filterable: boolean;
    listable: boolean;
    pagination: boolean;
    orderable: boolean;
    exclude: 'input' | 'output';
};
declare function getFieldDirectives(documentation: string | undefined): FieldDirectives;

export { type FieldDirectives, generateClassTransformerImport, generateClassValidatorImport, generateEnumImports, generateEnumsIndexFile, generateHelpersImports, generateModelsIndexFile, generatePrismaImport, generateRelationImportsImport, getDecoratorsByFieldType, getDecoratorsImportsByType, getFieldDirectives, getTSDataTypeFromFieldType, shouldImportHelpers, shouldImportPrisma };
