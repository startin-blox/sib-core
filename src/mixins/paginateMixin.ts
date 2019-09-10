//@ts-ignore
import asyncSlice from 'https://dev.jspm.io/iter-tools/es2018/async-slice';
//@ts-ignore
import asyncSize from 'https://dev.jspm.io/iter-tools/es2018/async-size';

const PaginateMixin = {
  name: 'paginate-mixin',
  use: [],
  attributes: {
    paginateBy: {
      type: Number,
      default: 0
    },
  },
  initialState: {
    currentPage: []
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
      this.renderPaginationNav(div, await this.getPageCount(resources), context);

      const firstElementIndex = (this.getCurrentPage(context) - 1) * this.paginateBy;
      resources = asyncSlice({
        start: firstElementIndex,
        end: firstElementIndex + this.paginateBy
      }, resources);
    }

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) await nextProcessor(resources, listPostProcessors, div);
  },
  getCurrentPage(context: string) {
    return this.currentPage[context];
  },
  setCurrentPage(page: number, context: string): void {
    if (page < 1) page = 1;
    // if (page > this.pageCount) page = this.pageCount; // TODO : handle this
    this.currentPage[context] = page;
    this.empty();
    this.populate();
  },
  async getPageCount(resources: object[]): Promise<number> {
    const size = await asyncSize(resources);
    return Math.max(1, Math.ceil(size / this.paginateBy));
  },
  renderPaginationNav(div: Element, pageCount: number, context: string): void {
    let insertNode = div.parentNode || div;
    let nav = insertNode.querySelector('nav');
    if (!nav) {
      nav = document.createElement("nav");
      nav.dataset.id = "nav";
      nav.innerHTML = `
      <button data-id="prev">←</button>
      <button data-id="next">→</button>
      <span>
        <span data-id="current">0</span> / <span data-id="count">0</span>
      </span>`;
    }

    const currentPage = this.getCurrentPage(context);
    insertNode.insertBefore(nav, div.nextSibling);

    nav.querySelector('[data-id="prev"]')!.addEventListener('click', () => {
      this.setCurrentPage(currentPage - 1, context);
    });
    nav.querySelector('[data-id="next"]')!.addEventListener('click', () => {
      this.setCurrentPage(currentPage + 1, context);
    });

    nav.querySelector('[data-id="current"]')!.textContent = currentPage;
    nav.querySelector('[data-id="count"]')!.textContent = String(pageCount);
    nav.querySelector('[data-id="prev"]')!.toggleAttribute('disabled', currentPage <= 1);
    nav.querySelector('[data-id="next"]')!.toggleAttribute('disabled', currentPage >= pageCount);
  },
}

export {
  PaginateMixin
}