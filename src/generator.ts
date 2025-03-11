#! /usr/bin/env node
export * from "./index.js";
import { generatorHandler } from '@prisma/generator-helper';
import { generate } from './prisma-generator.js';

generatorHandler({
  onManifest: () => ({
    defaultOutput: './generated',
    prettyName: 'Prisma Class DTO Generator',
    requiresGenerators: ['prisma-client-js'],
  }),
  onGenerate: generate,
});
