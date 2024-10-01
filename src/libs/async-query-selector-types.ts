export type AsyncQuerySelectorType = {
  <K extends keyof HTMLElementTagNameMap>(
    selectors: K,
    parent?: ParentNode,
  ): Promise<HTMLElementTagNameMap[K]>
  <K extends keyof SVGElementTagNameMap>(
    selectors: K,
    parent?: ParentNode,
  ): Promise<SVGElementTagNameMap[K]>
  //@ts-ignore
  <K extends keyof MathMLElementTagNameMap>(
    selectors: K,
    parent?: ParentNode,
  //@ts-ignore
  ): Promise<MathMLElementTagNameMap[K]>
  /** @deprecated */
  <K extends keyof HTMLElementDeprecatedTagNameMap>(
    selectors: K,
    parent?: ParentNode,
  ): Promise<HTMLElementDeprecatedTagNameMap[K]>
  <E extends Element = Element>(
    selectors: string,
    parent?: ParentNode,
  ): Promise<E>
}

export type AsyncQuerySelectorAllType = {
  <K extends keyof HTMLElementTagNameMap>(
    selectors: K,
    parent?: ParentNode,
  ): AsyncIterable<HTMLElementTagNameMap[K]>
  <K extends keyof SVGElementTagNameMap>(
    selectors: K,
    parent?: ParentNode,
  ): AsyncIterable<SVGElementTagNameMap[K]>
  //@ts-ignore
  <K extends keyof MathMLElementTagNameMap>(
    selectors: K,
    parent?: ParentNode,
  //@ts-ignore
  ): AsyncIterable<MathMLElementTagNameMap[K]>
  /** @deprecated */
  <K extends keyof HTMLElementDeprecatedTagNameMap>(
    selectors: K,
    parent?: ParentNode,
  ): AsyncIterable<HTMLElementDeprecatedTagNameMap[K]>
  <E extends Element = Element>(
    selectors: string,
    parent?: ParentNode,
  ): AsyncIterable<E>
}
