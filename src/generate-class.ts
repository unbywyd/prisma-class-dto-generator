import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import path from 'path';
import { OptionalKind, Project, PropertyDeclarationStructure } from 'ts-morph';
import {
  generateClassValidatorImport,
  generateEnumImports,
  generateHelpersImports,
  generatePrismaImport,
  generateClassTransformerImport,
  generateRelationImportsImport,
  getDecoratorsByFieldType,
  getDecoratorsImportsByType,
  getTSDataTypeFromFieldType,
  shouldImportHelpers,
  shouldImportPrisma,
  getFieldDirectives,
} from './helpers';
import { PrismaClassDTOGeneratorConfig } from './prisma-generator';
import { generateListDTO } from './generate-list';
import { generateExtraModel } from './generate-extra';
import { generateExtraEnum } from './generate-extra-enums';

export type PrismaClassDTOGeneratorField = PrismaDMMF.Field & {
  isExtra?: boolean;
  isList?: boolean;
  options?: Record<string, any>;
};
export default async function generateClass(
  config: PrismaClassDTOGeneratorConfig,
  project: Project,
  outputDir: string,
  model: PrismaDMMF.Model,
  mainConfig: PrismaClassDTOGeneratorConfig,
  foreignKeyMap: Map<string, string>,
) {
  const dirPath = path.resolve(outputDir, 'models');



  // Генерация Input DTO
  const excludeInutModels = config.input.excludeModels || [];
  if (!excludeInutModels.includes(model.name)) {
    generateDTO(config.input, project, dirPath, model, 'Input', config, foreignKeyMap);
  }

  const excludeOutputModels = config.output.excludeModels || [];
  if (!excludeOutputModels.includes(model.name)) {
    // Генерация Output DTO
    generateDTO(config.output, project, dirPath, model, 'Output', config, foreignKeyMap);
  }



  const directives = getFieldDirectives(model.documentation);

  if (config.extra?.models) {
    for (const [extraModelName, extraModelConfig] of Object.entries(config.extra.models)) {
      generateExtraModel(config, project, outputDir, extraModelName, extraModelConfig);
    }
  }

  if (config.extra?.enums) {
    for (const [extraEnumName, extraEnumConfig] of Object.entries(config.extra.enums)) {
      generateExtraEnum(project, outputDir, extraEnumName, extraEnumConfig, mainConfig);
    }
  }

  const listPrepared = [];

  const listModels = (config.list?.models || {}) as Record<string, { pagination?: true; filters?: Array<string> }>;
  if (directives.listable) {
    const configList = listModels[model.name] || {
      pagination: true,
      filters: [],
    };
    generateListDTO(configList, project, dirPath, model, mainConfig);
    listPrepared.push(model.name);
  }
  return listPrepared;

}

function generateDTO(
  config: PrismaClassDTOGeneratorConfig['input'] | PrismaClassDTOGeneratorConfig['output'],
  project: Project,
  dirPath: string,
  model: PrismaDMMF.Model,
  dtoType: 'Input' | 'Output',
  mainConfig: PrismaClassDTOGeneratorConfig,
  foreignKeyMap: Map<string, string>,
) {
  const filePath = path.resolve(dirPath, `${dtoType}${model.name}DTO.model.ts`);
  const sourceFile = project.createSourceFile(filePath, undefined, {
    overwrite: true,
  });

  const excludeModelFields = config.excludeModelFields?.[model.name] || [];


  const excludeModels = [...mainConfig.excludeModels || [], ...config.excludeModels || []];
  const includeOnlyFields = config.includeModelFields?.[model.name] || [];

  const includeOnlyFieldNames = includeOnlyFields.map((field) => 'string' === typeof field ? field : field.name);

  const isFieldExclude = (field: PrismaDMMF.Field) => {
    if (includeOnlyFieldNames.length > 0) {
      const isInclude = includeOnlyFieldNames.includes(field.name);
      if (!isInclude) {
        return true;
      }
    }
    if (field.relationName && excludeModels.includes(field.type)) {
      return true;
    }
    const directives = getFieldDirectives(field.documentation);
    const type = dtoType.toLowerCase();
    return config.excludeFields?.includes(field.name) || directives.exclude == type || excludeModelFields.includes(field.name);
  }



  let fields = model.fields.filter((field) => {
    return !isFieldExclude(field);
  });

  const extendFields = (config.extendModels?.[model.name]?.fields || []).filter((field) => {
    return !isFieldExclude({ name: field.name } as PrismaDMMF.Field);
  });


  const mergeInputFields = [];

  for (const field of includeOnlyFields) {
    if ('string' != typeof field) {
      if (!fields.find(f => f.name === field.name)) {
        const inExtend = extendFields.find(f => f.name === field.name);
        if (!inExtend) {
          extendFields.push(field);
        } else {
          extendFields[extendFields.indexOf(inExtend)] = Object.assign(field, inExtend);
        }
      } else {
        mergeInputFields.push(field);
      }
    }
  }


  const fieldsMap = new Map(fields.map(field => [field.name, field])) as Map<string, PrismaDMMF.Field>;
  extendFields.forEach((extendField) => {
    const existingField = fieldsMap.get(extendField.name);

    if (existingField) {
      // Обновляем существующее поле
      fieldsMap.set(extendField.name, {
        ...existingField,
        ...extendField, // Переопределяем свойства
      });
    } else {
      // Добавляем новое поле
      fieldsMap.set(extendField.name, {
        ...extendField,
        isRequired: extendField.isRequired ?? false,
        isExtra: extendField.isExtra ?? false,
        isList: extendField.isList ?? false,
        relationName: extendField.relationName || null,
        documentation: '',
      } as PrismaDMMF.Field);
    }
  });

  if (mergeInputFields?.length > 0) {
    mergeInputFields.forEach((extendField) => {
      const existingField = fieldsMap.get(extendField.name);

      if (existingField) {
        // Обновляем существующее поле
        fieldsMap.set(extendField.name, {
          ...existingField,
          ...extendField, // Переопределяем свойства
        });
      }
    });
  }



  fields = Array.from(fieldsMap.values());

  const makeFieldsOptional = config.makeFieldsOptional || false;
  if (makeFieldsOptional) {
    fields = fields.map((field) => {
      return {
        ...field,
        isRequired: false,
      };
    });
  }

  // Собираем импорты валидаторов
  const validatorImports = [
    ...new Set(
      fields
        .map((field) => getDecoratorsImportsByType(field))
        .flatMap((item) => item),
    ),
  ];

  // Собираем трансформеры
  const transformerImports = ['Expose', 'Type'];

  if (shouldImportPrisma(fields as PrismaDMMF.Field[])) {
    generatePrismaImport(sourceFile);
  }

  generateClassValidatorImport(sourceFile, validatorImports as Array<string>);
  generateClassTransformerImport(sourceFile, transformerImports);

  const relationImports = new Map<string, string>();

  //const referenceFields = [...model.fields.filter((field) => field.relationName), ...extendFieldsTransformed.filter(e => e.relationName)];
  const referenceFields = fields.filter((field) => field.relationName);


  const extraOptions = mainConfig.extra?.options || {};

  // Отвечает за импорт
  referenceFields.forEach((field) => {
    const extraName = extraOptions.skipExtraPrefix ? `${field.type}DTO` : `Extra${field.type}DTO`;
    const relatedDTOName = (field as PrismaClassDTOGeneratorField).isExtra ? extraName : `${dtoType}${field.type}DTO`;
    const relativePath = `./${relatedDTOName}.model`;

    if (isFieldExclude(field as PrismaDMMF.Field)) {
      return;
    }

    if (!relationImports.has(relatedDTOName)) {
      relationImports.set(relatedDTOName, relativePath);
    }
  });

  relationImports.forEach((path, name) => {
    sourceFile.addImportDeclaration({
      moduleSpecifier: path,
      namedImports: [name],
    });
  });

  // Импорты вспомогательных методов (если нужны)
  if (shouldImportHelpers(fields as PrismaDMMF.Field[])) {
    generateHelpersImports(sourceFile, ['getEnumValues']);
  }

  generateEnumImports(sourceFile, fields as PrismaDMMF.Field[], mainConfig);

  let hasRelations = fields.some((field) => field.relationName);
  const hasFileType = fields.some((field) => field.type === 'File');
  const hasFilesType = fields.some((field) => field.type === 'File' && field.isList);

  const allFields = config.includeRelations ? fields : fields.filter((field) => !field.relationName).filter((field) => !isFieldExclude(field as PrismaDMMF.Field));

  const properties = allFields.map<OptionalKind<PropertyDeclarationStructure>>((field) => {
    const decorators = getDecoratorsByFieldType(field, mainConfig);
    let type = getTSDataTypeFromFieldType(field, mainConfig);

    if (field.type === 'File') {
      const options = (field as PrismaClassDTOGeneratorField).options || {};
      const isArray = field.isList;

      if (field?.isRequired) {
        options.isRequired = true;
      }
      if (isArray) {
        decorators.push({
          name: 'IsFiles',
          arguments: [
            JSON.stringify(options),
          ],
        });
      } else {
        decorators.push({
          name: 'IsFile',
          arguments: [
            JSON.stringify(options),
          ],
        });
      }
    }

    if (field.relationName) {
      const isArray = field.isList;
      const extraName = extraOptions.skipExtraPrefix ? `${field.type}DTO` : `Extra${field.type}DTO`;
      const relatedDTOName = (field as PrismaClassDTOGeneratorField).isExtra ? extraName : `${dtoType}${field.type}DTO`; // Генерация корректного имени

      const relativePath = `./${relatedDTOName}.model`; // Генерация пути к DTO
      type = isArray ? `${relatedDTOName}[]` : relatedDTOName;
      decorators.push({
        name: 'IsEntity',
        arguments: [
          `() => import('${relativePath}').then(m => m.${relatedDTOName})`,
          `{ each: ${isArray} }`,
        ],
      });
      decorators.push({
        name: 'ReferenceModel',
        arguments: [`"${field.type}"`],
      });
    } else {
      const referenceModelName = foreignKeyMap.get(`${model.name}.${field.name}`);
      if (referenceModelName) {
        hasRelations = true;
        decorators.push({
          name: 'ReferenceModel',
          arguments: [`"${referenceModelName}"`],
        });
      }
    }
    return {
      name: field.name,
      type,
      hasExclamationToken: field.isRequired,
      hasQuestionToken: !field.isRequired,
      trailingTrivia: '\r\n',
      decorators: decorators,
    };
  });

  if (hasRelations || hasFileType) {
    const _imports = [];
    if (hasRelations) {
      _imports.push('IsEntity');
      _imports.push('ReferenceModel');
    }
    if (hasFileType) {
      _imports.push('IsFile');
    }
    if (hasFilesType) {
      _imports.push('IsFiles');
    }
    sourceFile.addImportDeclaration({
      moduleSpecifier: 'routing-controllers-openapi-extra',
      namedImports: _imports
    });
  }



  // Создаём класс DTO
  const classDeclaration = sourceFile.addClass({
    name: `${dtoType}${model.name}DTO`,
    isExported: true,
    properties: properties,
  });

  classDeclaration.addProperty({
    name: 'className',
    type: 'string',
    isStatic: true,
    initializer: `'${dtoType}${model.name}DTO'`,
  });
}
