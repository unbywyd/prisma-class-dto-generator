import { EnvValue, GeneratorOptions } from '@prisma/generator-helper';
import { getDMMF, parseEnvValue } from '@prisma/internals';
import { promises as fs } from 'fs';
import path from 'path';
import generateClass, { PrismaClassDTOGeneratorField } from './generate-class';
import generateEnum from './generate-enum';
import { generateEnumsIndexFile, generateModelsIndexFile } from './helpers';
import { project } from './project';
import removeDir from './utils/removeDir';
import { generateListDTO } from './generate-list';
import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';

export type PrismaClassDTOGeneratorModelConfig = {
  excludeFields?: string[];
  excludeModels?: string[];
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
  list?: {
    models: true | {
      [modelName: string]: PrismaClassDTOGeneratorListModelConfig
    }
  },
  extra?: {
    options: {
      skipExtraPrefix?: boolean
    },
    enums?: {
      [enumName: string]: {
        values: Array<string>
      }
    },
    models: true | {
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
    if (fileConfig.input?.includeRelations === undefined) {
      fileConfig.input.includeRelations = false;
    }
    if (fileConfig.output?.includeRelations === undefined) {
      fileConfig.output.includeRelations = true;
    }
    return fileConfig;
  } catch (e) {
    return defaultValues;
  }

}

export async function generate(options: GeneratorOptions) {
  const outputDir = parseEnvValue(options.generator.output as EnvValue);
  await fs.mkdir(outputDir, { recursive: true });
  await removeDir(outputDir, true);

  const configRelativeFilePath = options?.generator?.config?.configPath as string || '';

  const schemaDir = path.dirname(options.schemaPath);
  const configFilePath = path.resolve(schemaDir, configRelativeFilePath, 'generator-config.json');

  const config = await parseConfig(configFilePath);


  const prismaClientProvider = options.otherGenerators.find(
    (it) => parseEnvValue(it.provider) === 'prisma-client-js',
  );

  const prismaClientDmmf = await getDMMF({
    datamodel: options.datamodel,
    previewFeatures: prismaClientProvider?.previewFeatures,
  });

  const enumNames = new Set<string>();
  prismaClientDmmf.datamodel.enums.forEach((enumItem) => {
    enumNames.add(enumItem.name);
    generateEnum(project, outputDir, enumItem);
  });

  const extraOptions = config.extra?.options || {};

  if (config.extra?.enums) {
    const keys = Object.keys(config.extra.enums);
    for (const key of keys) {
      const name = extraOptions?.skipExtraPrefix ? key : 'Extra' + key;
      enumNames.add(name);
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

  const excludeModels = config.excludeModels || [];
  const listPrepared = new Set<string>();

  const foreignKeyMap = buildForeignKeyMap(prismaClientDmmf);

  const prepareModels = prismaClientDmmf.datamodel.models.filter((model) => !excludeModels.includes(model.name));
  for (const model of prepareModels) {
    const _listPrepared = await generateClass(config, project, outputDir, model, config, foreignKeyMap);
    if (_listPrepared?.length) {
      _listPrepared.forEach((name) => listPrepared.add(name));
    }
  }

  const dirPath = path.resolve(outputDir, 'models');
  const list = config.list?.models || {};
  for (const [modelName, listConfig] of Object.entries(list)) {
    if (listPrepared.has(modelName)) {
      continue;
    }
    generateListDTO(listConfig, project, dirPath, { name: modelName }, config);
  }

  generateModelsIndexFile(prismaClientDmmf, project, outputDir, config);
  await project.save();
}
