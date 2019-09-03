import { stringToDom } from '../libs/helpers.js';

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
    currentPage: 1,
    paginationElements: null
  },
  attached(): void {
    this.listPostProcessors.push(this.paginateCallback.bind(this));
  },
  paginateCallback(resources: object[], listPostProcessors: Function[], div: HTMLElement, toExecuteNext: number) {
    if (this.paginateBy > 0) {
      this.renderPaginationNav(div, resources);
      const firstElementIndex = (this.currentPage - 1) * this.paginateBy;
      resources = resources.slice(
        firstElementIndex,
        firstElementIndex + this.paginateBy,
      );
    }
    this.listPostProcessors[toExecuteNext](resources, listPostProcessors, div, toExecuteNext + 1);
  },
  setCurrentPage(page: number): void {
    if (page < 1) page = 1;
    if (page > this.pageCount) page = this.pageCount;
    this.currentPage = page;
    this.empty();
    this.populate();
  },
  getPageCount(resources: object[]): number {
    return Math.max(1, Math.ceil(resources.length / this.paginateBy));
  },
  renderPaginationNav(div: Element, resources: object[]): void {
    const paginateBy = this.paginateBy;
    if (this.paginationElements) {
      this.paginationElements.nav.toggleAttribute(
        'hidden',
        paginateBy == 0,
      );
    }
    if (!this.paginationElements) {
      const elements = (this.paginationElements = {});
      const nav = stringToDom(/*html*/ `<nav data-id='nav'>
      <button data-id="prev">←</button>
      <button data-id="next">→</button>
      <span>
      <span data-id="current">0</span>
      / <span data-id="count">0</span>
      </span>
      </nav>`);
      nav.querySelectorAll('[data-id]').forEach(elm => {
        const id = elm.getAttribute('data-id');
        elm.removeAttribute('data-id')
        if(id) elements[id] = elm;
      });
      this.element.insertBefore(elements['nav'], div.nextSibling);
      elements['prev'].addEventListener('click', () => {
        this.currentPage -= 1;
        this.empty();
        this.populate();
      });
      elements['next'].addEventListener('click', () => {
        this.currentPage += 1;
        this.empty();
        this.populate();
      });
    }
    const elements = this.paginationElements;
    const pageCount = this.getPageCount(resources);
    elements.current.textContent = this.currentPage;
    elements.count.textContent = pageCount;
    elements.prev.toggleAttribute('disabled', this.currentPage <= 1);
    elements.next.toggleAttribute('disabled', this.currentPage >= pageCount);
    return;
  },
}

export {
  PaginateMixin
}