/// <reference path="../fourslash.ts" />

// @Filename: /tsconfig.json
//// { "compilerOptions": { "module": "commonjs" } }

// @Filename: /node_modules/@types/ts-node/index.d.ts
//// export {};
//// declare const REGISTER_INSTANCE: unique symbol;
//// declare global {
////     namespace NodeJS {
////       interface Process {
////           [REGISTER_INSTANCE]?: Service;
////       }
////   }
//// }

// @Filename: /node_modules/@types/node/index.d.ts
//// declare module "process" {
////     global {
////         var process: NodeJS.Process;
////         namespace NodeJS {
////             interface Process {
////                 argv: string[];
////             }
////         }
////     }
////     export = process;
//// }

// @Filename: /index.ts
//// I/**/

verify.completions({
  marker: "",
  preferences: {
    includeCompletionsForModuleExports: true,
  },
});

edit.insert("N");

// Should not crash
verify.completions({
  marker: "",
  preferences: {
    includeCompletionsForModuleExports: true,
  },
});
