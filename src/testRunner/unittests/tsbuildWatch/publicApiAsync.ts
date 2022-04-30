namespace ts.tscWatch {

    it("unittests:: tsbuildWatch:: asyncTest", async () => {});

    it("unittests:: tsbuildWatch:: publicAPISync", async () => {

        interface DeferredPromise {
            waitable: Promise<void>;
            resolve: () => void;
        };
        function createDeferredPromise(): DeferredPromise{
            const dp: Partial<DeferredPromise>={};
            dp.waitable = new Promise(resolve=>{
                dp.resolve=resolve;
            });
            return dp as DeferredPromise;
        }


        const solution: File = {
            path: `${projectRoot}/tsconfig.json`,
            content: JSON.stringify({
                references: [
                    { path: "./shared/tsconfig.json" },
                    { path: "./webpack/tsconfig.json" }
                ],
                files: []
            })
        };
        const sharedConfig: File = {
            path: `${projectRoot}/shared/tsconfig.json`,
            content: JSON.stringify({
                compilerOptions: { composite: true },
            })
        };
        const sharedIndex: File = {
            path: `${projectRoot}/shared/index.ts`,
            content: `export function f1() { }
export class c { }
export enum e { }
// leading
export function f2() { } // trailing`
        };
        const webpackConfig: File = {
            path: `${projectRoot}/webpack/tsconfig.json`,
            content: JSON.stringify({
                compilerOptions: { composite: true, },
                references: [{ path: "../shared/tsconfig.json" }]
            })
        };
        const webpackIndex: File = {
            path: `${projectRoot}/webpack/index.ts`,
            content: `export function f2() { }
export class c2 { }
export enum e2 { }
// leading
export function f22() { } // trailing`
        };
        const sys1 = createWatchedSystem([libFile, solution, sharedConfig, sharedIndex, webpackConfig, webpackIndex], { currentDirectory: projectRoot });
        // @ts-ignore
        const commandLineArgs = ["--b", "--w"];
        // @ts-ignore
        const { sys, baseline, oldSnap, cb:_cb, getPrograms } = createBaseline(sys1);
        //const buildHost = createSolutionBuilderWithWatchHostForBaseline(sys, cb);
        sys.write = (()=>{
            const sysWriteOrig = (sys.write).bind(sys);
            return (message: string)=>{
                console.log(message);
                sysWriteOrig(message);
            };
        })();
        const buildHost = createSolutionBuilderWithWatchHostAsync(sys,
            /*createProgram*/ undefined,
            createDiagnosticReporter(sys, /*pretty*/ true),
            createBuilderStatusReporter(sys, /*pretty*/ true),
            createWatchStatusReporter(sys, /*pretty*/ true)
        );

        const handshake = {
            deferredPromise:createDeferredPromise()
        };

        buildHost.afterProgramEmitAndDiagnosticsAsync = async (program: EmitAndSemanticDiagnosticsBuilderProgram): Promise<void> =>{
            const configFilePath = program.getCompilerOptions().configFilePath??"<configFilePath is undefined>";
            sys.write(`test:: afterProgramEmitAndDiagnosticsAsync: ${configFilePath}`);
        };
        buildHost.afterEmitBundleAsync = async (_config: ParsedCommandLine): Promise<void> => {
            //const configFilePath = config.  //configFilePath??"<configFilePath is undefined>";
            sys.write(`test:: afterEmitBundleAsync`);
        };
        buildHost.solutionSettledAsync = async (totalErrors: number) =>{
            sys.write(`test:: solutionSettledAsync: totalErrors=${totalErrors}`);
            handshake.deferredPromise.resolve();
        };
        buildHost.getCustomTransformersAsync = getCustomTransformersAsync;
        const builder = createSolutionBuilderWithWatchAsync(buildHost, [solution.path], { verbose: true });
        await Promise.race([
            // ADDING THIS TIMEOUT CAUSES MOCHA TO HANG - even after successfull return from Promise.race.
            // new Promise((_,reject)=>{
            //     // eslint-disable-next-line no-restricted-globals
            //     setTimeout(()=>{
            //         reject(new Error(`test:: timeout`));
            //     }, 999999 /* set low for normal test, set high when using debugger on this test */);
            // }),
            Promise.all([
                (async ()=>{
                    await builder.buildAsync();
                    sys.write("test::  return from await builder.buildAsync()");
                })(),
                (async () => {
                    await handshake.deferredPromise.waitable;
                    handshake.deferredPromise = createDeferredPromise();
                    sys.prependFile(sharedIndex.path, "export function fooBar() {}");
                    sys.checkTimeoutQueueLengthAndRun(1);
                    await handshake.deferredPromise.waitable;
                    sys.write("test:: calling closeRequest from test code");
                    builder.closeRequest();
                })(),
            ])
        ]);
        sys.write("test:: test is finished");
        // async function myRunWatchBaseline(){
        //     return runWatchBaselineAsync({
        //         scenario: "publicApiSync",
        //         subScenario: "with custom transformers",
        //         commandLineArgs,
        //         sys,
        //         baseline,
        //         oldSnap,
        //         getPrograms,
        //         changes: [
        //             {
        //                 caption: "change to shared",
        //                 change: sys => sys.prependFile(sharedIndex.path, "export function fooBar() {}"),
        //                 timeouts: sys => {
        //                     sys.checkTimeoutQueueLengthAndRun(1); // Shared
        //                     // sys.checkTimeoutQueueLengthAndRun(1); // webpack
        //                     // sys.checkTimeoutQueueLengthAndRun(1); // solution
        //                     // sys.checkTimeoutQueueLength(0);
        //                 }
        //             }
        //         ],
        //         // watchOrSolution: builder
        //     });
        // }

        async function getCustomTransformersAsync(project: string, program?: Program): Promise<CustomTransformers> {
            const configFilePath = (()=>{
                if (!program) return `<program is undefined>`;
                return program.getCompilerOptions().configFilePath??"<configFilePath is undefined>";
            })();
            sys.write(`test:: getCustomTransformersAsync: ${configFilePath}`);

            const before: TransformerFactory<SourceFile> = context => {
                return file => visitEachChild(file, visit, context);
                function visit(node: Node): VisitResult<Node> {
                    switch (node.kind) {
                        case SyntaxKind.FunctionDeclaration:
                            return visitFunction(node as FunctionDeclaration);
                        default:
                            return visitEachChild(node, visit, context);
                    }
                }
                function visitFunction(node: FunctionDeclaration) {
                    addSyntheticLeadingComment(node, SyntaxKind.MultiLineCommentTrivia, `@before${project}`, /*hasTrailingNewLine*/ true);
                    return node;
                }
            };

            const after: TransformerFactory<SourceFile> = context => {
                return file => visitEachChild(file, visit, context);
                function visit(node: Node): VisitResult<Node> {
                    switch (node.kind) {
                        case SyntaxKind.VariableStatement:
                            return visitVariableStatement(node as VariableStatement);
                        default:
                            return visitEachChild(node, visit, context);
                    }
                }
                function visitVariableStatement(node: VariableStatement) {
                    addSyntheticLeadingComment(node, SyntaxKind.SingleLineCommentTrivia, `@after${project}`);
                    return node;
                }
            };
            return { before: [before], after: [after] };
        }
    });
}
