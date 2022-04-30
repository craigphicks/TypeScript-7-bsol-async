# Suggestion

Create new interfaces to provide asynchronous versions for the user customizeable functions in  `SolutionBuilder` and `SolutionBuilderWithWatchHost`

## 🔍 Search Terms

SolutionBuilder, SolutionBuilderWithWatchHost, asynchronous API 


## ✅ Viability Checklist

<!--
   Suggestions that don't meet all these criteria are very, very unlikely to be accepted.
   We always recommend reviewing the TypeScript design goals before investing time writing
   a proposal for ideas outside the scope of the project.
-->
My suggestion meets these guidelines:

* [x ] This wouldn't be a breaking change in existing TypeScript/JavaScript code
* [x ] This wouldn't change the runtime behavior of existing JavaScript code
* [x ] This could be implemented without emitting different JS based on the types of the expressions
* [x ] This isn't a runtime feature (e.g. library functionality, non-ECMAScript syntax with JavaScript output, new syntax sugar for JS, etc.)
* [x ] This feature would agree with the rest of [TypeScript's Design Goals](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Design-Goals).


## ⭐ Suggestion

I'm a big fan of using `SolutionBuilder` and `SolutionBuilderWithWatchHost`, the source code for which exists in 
`src/compiler/tsbuildPublic.ts`.

It allows the following to be overidden and/or defined to inject granular custom user functionality into an incremental, watched build.

- `afterProgramEmitAndDiagnostics` 
  - After individual projects have been verified and emitted 
- `afterEmitBundle`
  - Same as `afterProgramEmitAndDiagnostics` but for the case of a single bundle output.
- `createProgram`
  - When a custom emit is desired, 
  - or to grab the program for later use with custom transformers (although this a circuitous route, it seems to be the only way)
- `reportErrorSummary`
  - to detect when the solution has settled. 
- `getCustomTransformers`
  - applying custom tranforms deep inside the emit process.

The suggested feature is to provide asynchronous versions of these interfaces.  


## 📃 Motivating Example



## 💻 Use Cases

Whenever it is desired to write asynchronous code for the above listed functionalites.

For example, supposing asynchronous rollup in `afterProgramEmitAndDiagnostics`, where the output is used as input to another project in the solution.

In the case of `getCustomTransformers`, suppose a library listed in a config file needs to be loaded at runtime, because it is not known at compile time. 
Currently that means the library must be loaded using `require`, because dynamic `import` is not enabled in synchronous code.
Unfortunately `require` cannot be used to load ESM modules, therefore is only possible to load CommonJS modules,
which is an arbitrary constraint.
 
## 💻 Detailed Proposal

In order to understand fully what this proposal would entail, TypeScript 7-dev was cloned and working implementation, and a test module, were written.

The clone is public at `https://github.com/craigphicks/TypeScript-7-bsol-async`.  I'm hoping I could submit it as a pull 
to enable better feedback.

The new and/or modifed code 
- `src/compiler/tsbuildPublicAsync.ts`
  - This is a new source file that parallels it's neighbor `src/compiler/tsbuildPublic.ts`.
  - It borrows a few types from `tsbuildPublic.ts` and has the same dependencies, but is otherwise self contained.
  - `src/compiler/tsbuildPublic.ts` remains completely untouched, as it is already perfect.
- `src/testRunner/unittests/tsbuildWatch/publicApiAsync.ts`
  - It is a new test file to test `src/compiler/tsbuildPublicAsync.ts`
  - It parallels it's neighbor `src/testRunner/unittests/tsbuildWatch/publicApi.ts`, which tests `src/compiler/tsbuildPublic.ts`
- `src/testRunner/unittests/tscWatch/helpers.ts`
  - New code aded to allow the async functionality required to test the new async functionality.

### Public API

```
export type GetCustomTransformersAsync = (
  project: string,
  program?: Program
) => Promise<CustomTransformers | undefined>;
export interface SolutionBuilderHostBaseAsync<T extends BuilderProgram>
  extends ProgramHost<T> {
  /**
   * CreateProgramHookAsync is just an async wrapper whichs call inner non-async CreateProgram<T>.
   * The purpose is to allow an async hook which can be used to call async user functions before or after non-async CreateProgram
   * The user can override createProgramHookAsync like this:
   * ```
   * host.createProgramHookAsync = async (...args: Parameters<CreateProgram<T>>) => {
   *    // optional user functions here
   *    const p = host.createProgram(...args)
   *    // optional user functions here
   *    return p;
   * }
   * ```
   * Note that this hook is not intended for transforms unless the entire "emit" is handled by the user.
   * Generally a "getCustomTransformsAsync" hook (member or passed parameter) should be used for transforms.
   * @param ...args: Parameters<CreateProgram<T>>
   * @returns Promise<T>
   */
  createProgramHookAsync(...args: Parameters<CreateProgram<T>>): Promise<T>;
  getCustomTransformersAsync?: GetCustomTransformersAsync;
  afterProgramEmitAndDiagnosticsAsync?(program: T): Promise<void>;
  afterEmitBundleAsync?(config: ParsedCommandLine): Promise<void>;
  ... others member that already existed in SolutionBuilderHostBase
}
export interface SolutionBuilderHostAsync<T extends BuilderProgram>
  extends SolutionBuilderHostBaseAsync<T> {
  reportErrorSummary?: ReportEmitErrorSummary; // This remains, but solutionSettledAsync can be used instead as "settled" callback
}

export interface SolutionBuilderWithWatchHostAsync<T extends BuilderProgram>
  extends SolutionBuilderHostBaseAsync<T>,
    WatchHost {
  /**
   * optional solutionSettled callback will be called when the solition has no more projectes to make, just before waiting for watch events.
   * @param totalErrors
   */
  solutionSettledAsync?(totalErrors: number): Promise<void>;
}

export interface SolutionBuilderAsync {
  buildAsync(
    project?: string,
    cancellationToken?: CancellationToken,
    writeFile?: WriteFileCallback,
    getCustomTransformersAsync?: GetCustomTransformersAsync
  ): Promise<ExitStatus | undefined>;
  clean(project?: string): ExitStatus;
  buildReferencesAsync(
    project: string,
    cancellationToken?: CancellationToken,
    writeFile?: WriteFileCallback,
    getCustomTransformersAsync?: GetCustomTransformersAsync
  ): Promise<ExitStatus | undefined>;
  cleanReferences(project?: string): ExitStatus;
  /**
   * closeRequest:
   *   - request that async buildAsync/buildReferencesAsync processing terminate, and watches cleared, after any project currently being built is finished.
   *   - In case of non-watch host, this call is a noop.
   */
  closeRequest(): void; // not async
}
```

Note that unlike `SolutionBuilder.build`, which is a one-shot sets up future timer callbacks,
`SolutionBuilderAsync.buildAsync` is continuous (and asynchronous) control loop which returns if `closeRequest()` is issued. 
(If not a watched host, `SolutionBuilderAsync.buildAsync` will return after the inital build).


### Methodology used

- Copied the original `tsbuildPublic.ts`, created the `...Async` interfaces, modifed the callbacks to make them async, and followed the compiler errors 
back up to the topmost level, converting each function async along the way.  
- Every async function gets an `...Async` suffix.  This is very helpful in ensuring that no `awaits` are forgotten in the course of mass changes.  (A mising `await` is a horrible thing to debug).
- Change the top level control to an async loop (`buildAsync`) because (perhaps) that is easier to analyze and maintain - both for the coder the using client.
