declare function SyntaxError(message: any, expected: any, found: any, location: any): void;
declare namespace SyntaxError {
    var buildMessage: (expected: any, found: any) => string;
}
declare function parse(input: string, options?: any): any;
export { SyntaxError, parse };
declare const _default: {
    SyntaxError: typeof SyntaxError;
    parse: typeof parse;
};
export default _default;
