import { html, TemplateResult } from "lit-html";

const PaginateMixin = {
  name: 'paginate-mixin',
  use: [],
  attributes: {
    paginateBy: {
      type: Number,
      default: 0
    },
    paginateLoop: {
      type: String,
      default: null
    }
  },
  initialState: {
    currentPage: [],
  },
  created() {
    this.currentPage = [];
  },
  attached(): void {
    this.listPostProcessors.push(this.paginateCallback.bind(this));
  },
  async paginateCallback(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string) {
    if (this.paginateBy > 0) {
      if (!this.currentPage[context]) this.currentPage[context] = 1;
      const parentDiv = this.initParentPaginationDiv(div, context);
      this.renderCallbacks.push({
        template: this.renderPaginationNav(this.getPageCount(resources.length),context),
        parent: parentDiv
      });

      const firstElementIndex = (this.getCurrentPage(context) - 1) * this.paginateBy;
      resources = resources.slice(firstElementIndex, firstElementIndex + this.paginateBy);
    }

    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor) await nextProcessor(resources, listPostProcessors, div,context);
  },
  getNavElement(context: string) {
    return this.element.querySelector(`nav[data-context="${context}"]`);
  },
  /**
   * Find nav element or create it if not existing
   * @param div - insert nav next to this div
   * @param context - use context to find nav element
   */
  initParentPaginationDiv(div: HTMLElement, context: string) {
    let nav = this.getNavElement(context);
    if (!nav) {
      nav = document.createElement('nav');
      nav.setAttribute('data-context', context);
      const insertNode = div.parentNode || div;
      insertNode.appendChild(nav);
    }
    return nav;
  },
  getCurrentPage(context: string) {
    return this.currentPage[context];
  },
  setCurrentPage(page: number, context: string, pageCount: number): void {
    if (page < 1) page = !this.shouldLoop() ? 1 : pageCount;
    if (page > pageCount) page = !this.shouldLoop() ? pageCount : 1;
    this.currentPage[context] = page;
    this.empty();
    this.populate();
  },
  getPageCount(size: number): number {
    return Math.max(1, Math.ceil(size / this.paginateBy));
  },
  shouldLoop(): boolean {
    return this.paginateLoop !== null;
  },
  /**
   * Create pagination template
   * @param pageCount
   * @param context
   */
  renderPaginationNav(pageCount: number, context: string): TemplateResult {
    this.getNavElement(context).toggleAttribute('hidden', pageCount <= 1);
    const currentPage = this.getCurrentPage(context);

    return html`
      <button
        data-id="prev"
        ?disabled=${!this.shouldLoop() && currentPage <= 1}
        @click=${() => this.setCurrentPage(currentPage - 1, context, pageCount)}
      >←</button>
      <button
        data-id="next"
        ?disabled=${!this.shouldLoop() && currentPage >= pageCount}
        @click=${ () => this.setCurrentPage(currentPage + 1, context, pageCount)}
      >→</button>
      <span>
        <span data-id="current">${currentPage}</span> / <span data-id="count">${String(pageCount)}</span>
      </span>
    `;
  },
}

export {
  PaginateMixin
}