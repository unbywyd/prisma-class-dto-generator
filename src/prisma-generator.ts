import { EnvValue, GeneratorOptions } from '@prisma/generator-helper';
import { getDMMF, parseEnvValue } from '@prisma/internals';
import { promises as fs } from 'fs';
import path from 'path';
import generateClass, { PrismaClassDTOGeneratorField } from './generate-class';
import generateEnum from './generate-enum';
import { generateHelpersIndexFile } from './generate-helpers';
import { generateDecoratorsFile, generateEnumsIndexFile, generateModelsIndexFile } from './helpers';
import { project } from './project';
import removeDir from './utils/removeDir';

export type PrismaClassDTOGeneratorModelConfig = {
  excludeFields?: string[];
  excludeModelFields?: {
    [modelName: string]: string[]
  };
  includeModelFields?: {
    [modelName: string]: string[]
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
  itemsModePrefix?: string,
  filters?: Array<string | PrismaClassDTOGeneratorField>,
  orderable?: boolean
};
export type PrismaClassDTOGeneratorConfig = {
  input: PrismaClassDTOGeneratorModelConfig;
  output: PrismaClassDTOGeneratorModelConfig;
  excludeModels?: string[];
  list?: {
    includeModels: true | {
      [modelName: string]: PrismaClassDTOGeneratorListModelConfig
    }
  },
  extra?: {
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
    return fileConfig;
  } catch (e) {
    return defaultValues;
  }

}

export async function generate(options: GeneratorOptions) {
  const outputDir = parseEnvValue(options.generator.output as EnvValue);
  await fs.mkdir(outputDir, { recursive: true });
  await removeDir(outputDir, true);

  const configRelativeFilePath = options?.generator?.config?.configPath as string;

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

  if (config.extra?.enums) {
    const keys = Object.keys(config.extra.enums);
    for (const key of keys) {
      enumNames.add('Extra' + key);
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

  prismaClientDmmf.datamodel.models.filter((model) => !excludeModels.includes(model.name)).
    forEach((model) =>
      generateClass(config, project, outputDir, model),
    );

  const helpersIndexSourceFile = project.createSourceFile(
    path.resolve(outputDir, 'helpers', 'index.ts'),
    undefined,
    { overwrite: true },
  );
  generateHelpersIndexFile(helpersIndexSourceFile);

  await generateDecoratorsFile(outputDir);

  generateModelsIndexFile(prismaClientDmmf, project, outputDir, config);
  await project.save();
}
