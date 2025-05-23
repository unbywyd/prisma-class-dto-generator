import pkg from '@prisma/internals';
const { getDMMF } = pkg;
import { promises as fs } from 'fs';
import path from 'path';
import generateClass, { PrismaClassDTOGeneratorField } from './generate-class.js';
import generateEnum from './generate-enum.js';
import { generateEnumsIndexFile, generateModelsIndexFile } from './helpers.js';
import { project } from './project.js';
import { generateListDTO } from './generate-list.js';
import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import fsExtra from 'fs-extra';
import { loadPrismaSchema } from './prisma-schema-loader.js';

export type PrismaClassDTOGeneratorModelConfig = {
  excludeFields?: string[];
  excludeModels?: string[];
  excludeIdFields?: boolean;
  excludeDateAtFields?: boolean;
  excludeIdRelationFields?: boolean;
  excludeModelFields?: {
    [modelName: string]: string[]
  };
  makeFieldsOptional?: boolean;
  includeModelFields?: {
    [modelName: string]: Array<string | PrismaClassDTOGeneratorField>
  };
  includeRelations?: boolean;
  extendModels?: {
    [modelName: string]: {
      fields: Array<PrismaClassDTOGeneratorField>
    }
  }
};
export type PrismaClassDTOGeneratorListModelConfig = {
  pagination?: true,
  outputModelName?: string,
  filters?: Array<string | PrismaClassDTOGeneratorField>,
  orderable?: boolean | Array<string>,
};
export type PrismaClassDTOGeneratorConfig = {
  input: PrismaClassDTOGeneratorModelConfig;
  output: PrismaClassDTOGeneratorModelConfig;
  excludeModels?: string[];
  strictMode?: boolean;
  lists?: {
    [modelName: string]: PrismaClassDTOGeneratorListModelConfig
  },
  extra?: {
    enums?: {
      [enumName: string]: {
        values: Array<string>
      }
    },
    models: {
      [modelName: string]: {
        type: "input" | "output",
        fields: Array<PrismaClassDTOGeneratorField>
      }
    }
  }
};

function buildForeignKeyMap(dmmf: PrismaDMMF.Document): Map<string, string> {
  const foreignKeyMap = new Map<string, string>();

  for (const model of dmmf.datamodel.models) {
    for (const field of model.fields) {
      // Если поле - это объект (kind === "object") и в нём заданы relationFromFields,
      // значит, это реляционное поле, указывающее, откуда берётся FK (например, [ 'updatedById' ])
      if (field.kind === 'object' && field.relationFromFields?.length) {
        const relatedModelName = field.type; // Например, "Admin"

        // relationFromFields может содержать несколько ключей (если составной ключ),
        // обычно бывает 1, но на всякий случай обходим все
        field.relationFromFields.forEach(fkFieldName => {
          // Сохраняем в Map, что в модели M поле fkFieldName -> указывает на relatedModelName
          foreignKeyMap.set(`${model.name}.${fkFieldName}`, relatedModelName);
        });
      }
    }
  }

  return foreignKeyMap;
}

async function parseConfig(absolutePath: string): Promise<PrismaClassDTOGeneratorConfig> {
  const res = (config: Partial<PrismaClassDTOGeneratorConfig>): PrismaClassDTOGeneratorConfig => {
    if (!config.input) {
      config.input = {
        excludeFields: [],
        includeRelations: false,
        excludeModels: [],
        excludeModelFields: {},
        includeModelFields: {},
        extendModels: {},
      };
    }
    if (!config.output) {
      config.output = {
        excludeFields: [],
        includeRelations: false,
        excludeModels: [],
        excludeModelFields: {},
        includeModelFields: {},
        extendModels: {},
      };
    }
    if (!config.extra) {
      config.extra = {
        //options: {},
        enums: {},
        models: {}
      };
    }

    if (!config.input.excludeFields) {
      config.input.excludeFields = [];
    }
    if (!config.output.excludeFields) {
      config.output.excludeFields = [];
    }
    if (!config.input.excludeModels) {
      config.input.excludeModels = [];
    }
    if (!config.output.excludeModels) {
      config.output.excludeModels = [];
    }
    if (!config.input.excludeModelFields) {
      config.input.excludeModelFields = {};
    }
    if (!config.output.excludeModelFields) {
      config.output.excludeModelFields = {};
    }
    if (!config.input.includeModelFields) {
      config.input.includeModelFields = {};
    }
    if (!config.output.includeModelFields) {
      config.output.includeModelFields = {};
    }
    if (!config.input.extendModels) {
      config.input.extendModels = {};
    }
    if (!config.output.extendModels) {
      config.output.extendModels = {};
    }
    if (!config.extra.enums) {
      config.extra.enums = {};
    }
    if (!config.extra.models) {
      config.extra.models = {};
    }

    if (config.input?.includeRelations === undefined) {
      config.input.includeRelations = false;
    }
    if (config.output?.includeRelations === undefined) {
      config.output.includeRelations = true;
    }

    return config as PrismaClassDTOGeneratorConfig;
  }

  const defaultValues = {
    input: {
      excludeFields: [] as string[],
      includeRelations: false
    },
    output: {
      includeRelations: true,
      excludeFields: [] as string[]
    }
  };

  try {
    const fileContent = await fs.readFile(absolutePath, 'utf-8'); // Читаем содержимое файла
    const fileConfig = JSON.parse(fileContent);
    return res(fileConfig);
  } catch (e) {
    return res(defaultValues);
  }

}

export type GeneratorOptions = {
  schemaPath?: string,
  cwd?: string,
  output?: string
}

export async function generate(options: GeneratorOptions) {
  let prismaLoaded = null;
  try {
    prismaLoaded = await loadPrismaSchema(options.cwd || process.cwd(), options.schemaPath);
  } catch (e) {
    console.error(e);
    return;
  }

  const prismaPath = prismaLoaded.path;
  const prismaCWD = path.dirname(prismaPath);
  const outputDir = path.resolve(prismaCWD, options.output || 'dto_generated');
  await fsExtra.emptyDir(outputDir);

  const configFilePath = path.resolve(prismaCWD, 'generator-config.json');
  if (!fsExtra.existsSync(configFilePath)) {
    console.error('Config file not found, please create generator-config.json in prisma directory');
    return;
  }
  let config = null;
  try {
    config = await parseConfig(configFilePath);
  } catch (e) {
    console.error(`Error parsing config file: ${e.message}`);
    return;
  }

  const prismaClientDmmf = await getDMMF({
    datamodel: prismaLoaded.schema,
  });

  const enumNames = new Set<string>();
  prismaClientDmmf.datamodel.enums.forEach((enumItem) => {
    enumNames.add(enumItem.name);
    generateEnum(project, outputDir, enumItem);
  });


  if (config.extra?.enums) {
    const keys = Object.keys(config.extra.enums);
    for (const key of keys) {
      enumNames.add(key);
    }
  }

  if (enumNames.size > 0) {
    const enumsIndexSourceFile = project.createSourceFile(
      path.resolve(outputDir, 'enums', 'index.ts'),
      undefined,
      { overwrite: true },
    );
    generateEnumsIndexFile(enumsIndexSourceFile, [...enumNames]);
  }

  let excludeModels = config.excludeModels || [];
  const listPrepared = new Set<string>();

  const foreignKeyMap = buildForeignKeyMap(prismaClientDmmf);

  const referenceModels: Array<{ type: 'input' | 'output', name: string }> = [];

  const models = prismaClientDmmf.datamodel.models;
  const checkFieldsToReference = (fields: Array<string | PrismaClassDTOGeneratorField>, type: 'input' | 'output') => {
    for (const field of fields) {
      if (typeof field !== 'string') {
        if (field?.relationName && field.type) {
          if (!referenceModels.find((item) => item.name === field.type) && models.find((model) => model.name === field.type)) {
            referenceModels.push({ type, name: field.type });
            if (excludeModels.includes(field.type)) {
              excludeModels = excludeModels.filter((model) => model !== field.type);
            }
          }
        }
      }
    }
  }
  config.excludeModels = excludeModels;

  if (config.extra?.models && Object.keys(config.extra?.models).length) {
    for (const key in config.extra.models) {
      const fields = config.extra.models[key].fields;
      if (!fields.length) {
        continue;
      }
      checkFieldsToReference(fields, config.extra.models[key].type || 'output');
    }
  }

  if (config?.input?.includeModelFields && Object.keys(config.input.includeModelFields).length) {
    for (const key in config.input.includeModelFields) {
      const fields = config.input.includeModelFields[key];
      if (!fields.length) {
        continue;
      }
      checkFieldsToReference(fields, 'input');
    }
  }
  if (config?.input?.extendModels && Object.keys(config.input.extendModels).length) {
    for (const key in config.input.extendModels) {
      const fields = config.input.extendModels[key].fields;
      if (!fields.length) {
        continue;
      }
      checkFieldsToReference(fields, 'input');
    }
  }

  if (config?.output?.extendModels && Object.keys(config.output.extendModels).length) {
    for (const key in config.output.extendModels) {
      const fields = config.output.extendModels[key].fields;
      if (!fields.length) {
        continue;
      }
      checkFieldsToReference(fields, 'output');
    }
  }
  if (config?.output?.includeModelFields && Object.keys(config.output.includeModelFields).length) {
    for (const key in config.output.includeModelFields) {
      const fields = config.output.includeModelFields[key];
      if (!fields.length) {
        continue;
      }
      checkFieldsToReference(fields, 'output');
    }
  }


  const prepareModels = models.filter((model) => !excludeModels.includes(model.name));
  for (const model of prepareModels) {
    const _listPrepared = await generateClass(config, project, outputDir, model, config, foreignKeyMap, referenceModels);
    if (_listPrepared?.length) {
      _listPrepared.forEach((name) => listPrepared.add(name));
    }
  }

  const dirPath = path.resolve(outputDir, 'models');
  const list = config.lists || {};
  for (const [modelName, listConfig] of Object.entries(list)) {
    if (listPrepared.has(modelName)) {
      continue;
    }
    generateListDTO(listConfig, project, dirPath, { name: modelName }, config);
  }

  generateModelsIndexFile(prismaClientDmmf, project, outputDir, config);
  await project.save();
}
