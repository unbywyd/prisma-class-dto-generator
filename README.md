# Prisma Class DTO Generator (v7.0.0+)

[![NPM Version](https://img.shields.io/npm/v/prisma-class-dto-generator.svg?style=for-the-badge)](https://www.npmjs.com/package/prisma-class-dto-generator)
[![GitHub Stars](https://img.shields.io/github/stars/unbywyd/prisma-class-dto-generator.svg?style=for-the-badge&logo=github)](https://github.com/unbywyd/prisma-class-dto-generator)

## ⚡ Prisma DTO Generator – CLI & Programmatic Usage

❗🔴❗ Starting from **version 7.0.0**, `prisma-class-dto-generator` is no longer a Prisma generator but a **standalone CLI tool and library** that can be used independently. The package has been migrated to **ESM (ECMAScript Modules) with NextNode** to ensure compatibility with modern Node.js environments.

**[New: Prisma DTO Generator UI Constructor](https://prisma-dto-generator.netlify.app/)** is an intuitive UI tool that helps generate DTO configurations for Prisma without manual edits. Define your settings visually, export a `generator-config.json`, and seamlessly integrate DTO generation into your workflow.  


## 🔹 How It Works

You can use `prisma-class-dto-generator` in two ways:
1. **CLI Mode** – Run from the command line.
2. **Programmatic Mode** – Import and execute within your Node.js application.

### 🚀 CLI Usage

```sh
npx prisma-class-dto-generator --path=./prisma/schema.prisma --output=./dto_generated
```

or install globally:

```sh
npm install -g prisma-class-dto-generator
prismadtogen --path=./prisma/schema.prisma --output=./dto_generated
```

### 🎛 Available CLI Options

```sh
Usage: prismadtogen --path=[path_to_schema]

Options:
  --help, -h            Show this help message
  --version, -v         Show the installed version
  --path=[path]         Specify a Prisma schema file (default: ./prisma/schema.prisma)
  --output=[path]       Specify the output directory (default: ./dto_generated)
```

### 🎯 Why Use It?
✅ **Standalone & Flexible** – Not tied to Prisma's generator system.
✅ **ESM & NextNode Support** – Fully compatible with modern Node.js environments.
✅ **Error-Free DTO Generation** – Automates repetitive DTO creation.
✅ **Consistent & Maintainable** – Ensures uniform DTO structures.

---

## 📦 Programmatic Usage

You can also use it inside a Node.js project:

```ts
import { generate } from "prisma-class-dto-generator";

await generate({
  cwd: process.cwd(),
  schemaPath: "./prisma/schema.prisma",
  output: "./dto_generated"
});
```

## 📌 Features

- **Automated DTO Generation** – Creates input/output DTO classes for each Prisma model.
- **List DTOs** – Supports pagination, filters, sorting, and flexible array elements.
- **Enum Handling** – Generates enums from the Prisma schema.
- **Selective Generation** – Fine-grained control over which models and fields to include.
- **Custom Decorators** – Supports `@filterable`, `@exclude input|output`, `@listable`, and `@orderable` annotations.
- **File Type Support** – Includes `@IsFile` and `@IsFiles` decorators for file uploads.
- **Lazy Imports for Deep Type Integration** – Enables modular DTO architecture.
- **Class-Validator & OpenAPI Integration** – Works seamlessly with `class-validator`, `class-transformer`, and `routing-controllers-openapi`.

## 🛠 Installation

```sh
npm install prisma-class-dto-generator
```

or

```sh
yarn add prisma-class-dto-generator
```

## 🔧 Configuration

The tool allows configuring DTO generation via a JSON file:

```json
{
  "input": {
    "extendModels": {
      "Item": {
        "fields": [
          { "name": "title", "isRequired": false }
        ]
      }
    }
  }
}
```

## 📄 Example Prisma Schema Configuration

To integrate with Prisma, add a generator entry in `schema.prisma`:

```prisma
generator class_validator {
  provider   = "node node_modules/prisma-class-dto-generator"
  output     = "../src/dto_sources"
  configPath = "./"
}
```

---

## 🔗 Links & Resources

- **Website:** [Prisma DTO Generator](https://prisma-dto-generator.netlify.app/)
- **GitHub Repository:** [unbywyd/prisma-class-dto-generator](https://github.com/unbywyd/prisma-class-dto-generator)
- **NPM Package:** [prisma-class-dto-generator](https://www.npmjs.com/package/prisma-class-dto-generator)

## 📌 Author

Developed by [unbywyd](https://unbywyd.com).
