/// <reference path='fourslash.ts' />

////abstract class A {
////    abstract f(a: number, b: string): boolean;
////    abstract f(a: number, b: string): this;
////    abstract f(a: string, b: number): Function;
////    abstract f(a: string): Function;
////    abstract foo(): number;
////}
////
////class C extends A {}

verify.codeFix({
    description: "Implement inherited abstract class",
    newFileContent:
`abstract class A {
    abstract f(a: number, b: string): boolean;
    abstract f(a: number, b: string): this;
    abstract f(a: string, b: number): Function;
    abstract f(a: string): Function;
    abstract foo(): number;
}

class C extends A {
    f(a: number, b: string): boolean;
    f(a: number, b: string): this;
    f(a: string, b: number): Function;
    f(a: string): Function;
    f(a: unknown, b?: unknown): boolean | Function | this {
        throw new Error("Method not implemented.");
    }
    foo(): number {
        throw new Error("Method not implemented.");
    }
}`
});
