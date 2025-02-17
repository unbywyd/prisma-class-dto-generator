# prisma-class-dto-generator

[![NPM Version](https://img.shields.io/npm/v/prisma-class-dto-generator.svg?style=for-the-badge)](https://www.npmjs.com/package/prisma-class-dto-generator)
[![GitHub Stars](https://img.shields.io/github/stars/unbywyd/prisma-class-dto-generator.svg?style=for-the-badge&logo=github)](https://github.com/unbywyd/prisma-class-dto-generator)

# ⚡ Prisma DTO Generator – Simplify DTO Configuration  

🎛 **[Prisma DTO Generator](https://prisma-dto-generator.netlify.app/)** is an intuitive UI tool that helps generate DTO configurations for Prisma without manual edits. Define your settings visually, export a `generator-config.json`, and seamlessly integrate DTO generation into your workflow.  

## 🔹 How It Works  
📝 **1. Input Schema** – Paste or upload your **Prisma schema**.  
⚙ **2. Configure** – The tool generates the corresponding **JSON configuration**.  
💾 **3. Export** – Save it as `generator-config.json`.  
🚀 **4. Generate DTOs** – Run `prisma generate` and get structured DTOs instantly.  

## 🎯 Why Use It?  
✅ **Error-Free** – Eliminates manual JSON editing.  
✅ **Consistency** – Ensures uniform DTO structures.  
✅ **Visual & Intuitive** – Quickly adjust configurations before applying changes.  

🔗 **Try it now:** [prisma-dto-generator.netlify.app](https://prisma-dto-generator.netlify.app/)  



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
  mimeTypes?: Array<string>; // RegExp strings
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


### Author

[unbywyd](https://unbywyd.com)
