# prisma-class-dto-generator

[![NPM Version](https://img.shields.io/npm/v/prisma-class-dto-generator.svg?style=for-the-badge)](https://www.npmjs.com/package/prisma-class-dto-generator)
[![GitHub Stars](https://img.shields.io/github/stars/unbywyd/prisma-class-dto-generator.svg?style=for-the-badge&logo=github)](https://github.com/unbywyd/prisma-class-dto-generator)
[![GitHub License](https://img.shields.io/github/license/unbywyd/prisma-class-dto-generator.svg?style=for-the-badge)](https://github.com/unbywyd/prisma-class-dto-generator/blob/master/LICENSE)

A generator for [Prisma ORM](https://www.prisma.io/) that creates fully-typed Data Transfer Objects (DTOs) based on decorators from [`class-validator`](https://www.npmjs.com/package/class-validator) and [`class-transformer`](https://www.npmjs.com/package/class-transformer). It also provides a custom `@Entity` decorator for enhanced type support, enabling correct JSON schema generation. The resulting DTOs are ready for server-side TypeScript applications, and are well-suited for use with frameworks like [`routing-controllers`](https://www.npmjs.com/package/routing-controllers), [`routing-controllers-openapi`](https://www.npmjs.com/package/routing-controllers-openapi), and [`class-validator-jsonschema`](https://www.npmjs.com/package/class-validator-jsonschema).

**Author:** [unbywyd](https://unbywyd.com)  
**License:** Free

---

## Features

- **Automated DTO Generation:** For each Prisma model, generates corresponding input and output DTO classes. For example, a model `App` will produce `InputAppDTO` and `OutputAppDTO`.
- **List Types:** Supports generating list DTOs for batch queries, including:
  - Pagination
  - Filters
  - Sorting
  - Flexible array elements (i.e., specifying which models the array should contain)
- **Enum Generation:** Handles generation of enums from the Prisma schema.
- **Custom Models & Enums:** Ability to create arbitrary custom models and enums via configuration.
- **Fine-Grained Control via Schema Comments:**  
  Decorators like `@filterable`, `@exclude input|output`, `@listable`, and `@orderable` let you control which fields appear in inputs, outputs, filters, and sorting.
- **Selective Generation:** Choose exactly which models to generate, which fields to include or exclude, and how they should be extended.
- **Integration with Class-Validator-JsonSchema & Routing-Controllers-OpenAPI:**  
  Easily generate OpenAPI specs and JSON schemas from your DTOs.  
  Example:
  ```typescript
  @OpenAPI({
    summary: "Get incoming requests",
    description: "Get incoming requests",
    responses: getOpenAPIResponse(OutputRequestDTO, true)
  })
  ```
- **File type support:** Custom decorators `@IsFile` and `@IsFiles` for file uploads, with options for file size, type, and more.

```typescript
// From https://www.npmjs.com/package/routing-controllers-openapi-extra?activeTab=code
// Options
export interface FileFieldOptions {
  name?: string; // Field name
  isRequired?: boolean;
  maxSize?: string;
  minSize?: string;
  maxFiles?: number;
  minFiles?: number;
  mimeTypes?: RegExp[];
}
```

```typescript
// Schema:
 "AppConfig": [
    "value",
    {
        "name": "file",
        "type": "File", // Custom type
        "isRequired": false,
        "options": {
            "maxSize": "10mb"
        }
    },
    {
        "name": "files",
        "type": "File", // Custom type
        "isList": true, // Array of files
        "options": { // Options for each file (routing-controllers-openapi-extra)
            "maxSize": "10mb",
            "maxFiles": 5
        }
    }
]

// DTO:
import { IsFile, IsFiles } from "routing-controllers-openapi-extra";

export class InputAppConfigDTO {
    @IsDefined()
    @Expose()
    value!: Prisma.JsonValue;

    @IsOptional()
    @Expose()
    @IsFile({"maxSize":"10mb"})
    file?: File;

    @IsOptional()
    @Expose()
    @IsFiles({"maxSize":"10mb","maxFiles":5})
    files?: File[];
    static className: string = 'InputAppConfigDTO';
}
```

- **Lazy Imports for Deep Type Integration**:

```typescript
@Entity(() => import('./ExtraAppDTO.model').then(m => m.ExtraAppDTO), true)
items: ExtraAppDTO[];
```

## Installation

```bash
npm install prisma-class-dto-generator
```

## Usage

Just add the generator to your `schema.prisma` file:

```prisma
generator class_validator {
  provider   = "node node_modules/prisma-class-dto-generator"
  output     = "../src/dto_sources"
  configPath = "./"
}
```

## Configuration

Create a **generator-config.json** file next to your Prisma schema file (e.g. schema.prisma). This JSON file allows you to specify **input/output** configurations, excluded fields, included relations, extended models, list configurations, and more.

### TYPE: GeneratorConfig

```typescript
export type PrismaClassDTOGeneratorField = PrismaDMMF.Field & {
  isExtra?: boolean;
  isList?: boolean;
  options?: Record<string, any>;
};

export type PrismaClassDTOGeneratorModelConfig = {
  excludeFields?: string[];
  excludeModels?: string[];
  makeFieldsOptional?: boolean; // [NEW] Make all fields optional
  excludeModelFields?: {
    [modelName: string]: string[];
  };
  includeModelFields?: {
    [modelName: string]: Array<string | PrismaClassDTOGeneratorField>;
  };
  includeRelations?: boolean;
  extendModels?: {
    [modelName: string]: {
      fields: Array<PrismaClassDTOGeneratorField>;
    };
  };
};
export type PrismaClassDTOGeneratorListModelConfig = {
  pagination?: true;
  outputModelName?: string; // Type of items in the array by default is the current model name
  filters?: Array<string | PrismaClassDTOGeneratorField>;
  orderable?: boolean | Array<string>; // Array = Specific fields (enum)
};
export type PrismaClassDTOGeneratorConfig = {
  input: PrismaClassDTOGeneratorModelConfig;
  output: PrismaClassDTOGeneratorModelConfig;
  excludeModels?: string[];
  list?: {
    // Generate list DTOs
    models: {
      [modelName: string]: PrismaClassDTOGeneratorListModelConfig;
    };
  };
  extra?: {
    // Additional models and enums
    options: {
      skipExtraPrefix?: boolean; [NEW] // Skip adding 'Extra' prefix to extra models
    };
    enums?: {
      [enumName: string]: {
        values: Array<string>;
      };
    };
    models: {
      [modelName: string]: {
        type: 'input' | 'output';
        fields: Array<PrismaClassDTOGeneratorField>;
      };
    };
  };
};
```

Example **generator-config.json**:

```
{
  "excludeModels": [],
  "input": {
    "excludeFields": ["id", "createdAt", "updatedAt"],
    "includeRelations": true,
    "includeModelFields": {
      "App": ["name", "description", "test"]
    }
  },
  "output": {
    "excludeFields": [],
    "includeRelations": true,
    "excludeModelFields": {
      "App": []
    },
    "includeModelFields": {},
    "extendModels": {
      "App": {
        "fields": [
          {
            "name": "role",
            "type": "ERole",
            "isExtra": true,
            "kind": "enum",
            "isRequired": false
          }
        ]
      }
    }
  },
  "list": {
    "models": {
      "App": {
        "pagination": true,
        "orderable": true,
        "filters": [
          {
            "name": "test_best",
            "type": "String",
            "isList": true
          }
        ]
      }
    }
  },
  "extra": {
    "enums": {
      "ERole": {
        "values": ["ADMIN", "USER"]
      }
    },
    "models": {
      "App": {
        "fields": [
          { "name": "test", "type": "String", "isRequired": true },
          { "name": "description", "type": "String", "isRequired": true },
          { "name": "role", "type": "Role", "kind": "enum", "isRequired": true }
        ]
      },
      "Best": {
        "fields": [
          { "name": "app", "type": "App", "relationName": "app", "isRequired": true },
          { "name": "paidAt", "type": "DateTime", "isRequired": true },
          { "name": "gena", "type": "Gena", "relationName": "gena", "isRequired": true }
        ]
      }
    }
  }
}
```

Comment-Based Configuration within Prisma Schema:

```prisma
model App {
  id          String   @id @default(cuid())
  name        String   @unique /// @filterable
  description String?  /// @exclude output
  logoUrl     String?
  isActive    Boolean  @default(true)
  apiKey      String   @unique @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt /// @filterable
  email       String   @unique /// @filterable
  password    String   /// @exclude input
  isConfirmed Boolean  @default(false)
  test        Test[]
  /// @listable
  /// @orderable
}
```

### Details

#### Note on extendModels

The extendModels option in the configuration allows you to either add new fields or update existing fields in the DTOs:

Adding new fields: If a field specified in extendModels does not exist in the original model, it will be added as a new field.
Updating existing fields: If a field with the same name already exists, its properties (e.g., isRequired) will be overridden with the values from extendModels.
Example
Given the following configuration:

```json
{
  "input": {
    "extendModels": {
      "Item": {
        "fields": [
          {
            "name": "title",
            "isRequired": false
          }
        ]
      }
    }
  }
}
```

- If the **Item** model already has a title field, its **isRequired** property will be updated to **false**.
- If the **title** field does not exist in the **Item** model, it will be added as a new optional field.

### Supported Comments:

- @**filterable**: Enables filtering for this field in list queries.
- @**exclude {type}** output|input: Exclude a field from either the output or input DTO.
- @**listable**: Makes the entire model listable.
- @**orderable**: Enables sorting capabilities.
- @**pagination**: Enables pagination capabilities.

### Helper ToDTO

Utility functions like toDTO help you transform plain data to DTO instances with class-transformer:

```typescript
import { plainToClass } from 'class-transformer';

export function toDTO<T>(DtoClass: new (...args: any[]) => T, data: any): T {
  return plainToClass(DtoClass, data, {
    excludeExtraneousValues: true,
  });
}
```

### Author

[unbywyd](https://unbywyd.com)
