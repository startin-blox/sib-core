//@ts-ignore
import asyncSlice from 'https://dev.jspm.io/iter-tools@6/es2015/async-slice';
//@ts-ignore
import asyncMap from 'https://dev.jspm.io/iter-tools@6/es2015/async-map';
//@ts-ignore
import asyncToArray from 'https://dev.jspm.io/iter-tools@6/es2015/async-to-array';

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

      // Get paginate size to count pages
      const resourcesToCount = await asyncToArray(resources); // create an array and consume iterator
      this.renderPaginationNav(div, this.getPageCount(resourcesToCount.length), context);
      resources = await asyncMap(resource => resource, resourcesToCount); // re-create an iterator

      const firstElementIndex = (this.getCurrentPage(context) - 1) * this.paginateBy;
      resources = asyncSlice({
        start: firstElementIndex,
        end: firstElementIndex + this.paginateBy
      }, resources);
    }

    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor) await nextProcessor(resources, listPostProcessors, div);
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

    const prevButton = nav.querySelector('[data-id="prev"]') as HTMLElement;
    const nextButton = nav.querySelector('[data-id="next"]') as HTMLElement;
    // use onclick to override previous listeners
    prevButton.onclick = () => this.setCurrentPage(currentPage - 1, context, pageCount);
    nextButton.onclick = () => this.setCurrentPage(currentPage + 1, context, pageCount);

    nav.querySelector('[data-id="current"]')!.textContent = currentPage;
    nav.querySelector('[data-id="count"]')!.textContent = String(pageCount);
    if (!this.shouldLoop()) {
      nav.querySelector('[data-id="prev"]')!.toggleAttribute('disabled', currentPage <= 1);
      nav.querySelector('[data-id="next"]')!.toggleAttribute('disabled', currentPage >= pageCount);
    }
    nav.toggleAttribute('hidden', pageCount <= 1);
  },
}

export {
  PaginateMixin
}