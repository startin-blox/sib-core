import { stringToDom } from '../libs/helpers.js';

const PaginateMixin = {
  name: 'paginate-mixin',
  use: [],
  initialState: {
    paginationElements: null
  },
  attributes: {
    paginateBy: {
      type: Number,
      default: 0
    },
    currentPage: {
      type: Number,
      default: 1
    }
  },
  get pageCount(): number {
    return Math.max(1, this.resource.count | Math.ceil(this.resources.length / this.paginateBy));
  },
  get currentPageResources(): object[] {
    if (this.paginateBy == 0 || this.resource.count) return this.resources;
    const firstElementIndex = (this.currentPage - 1) * this.paginateBy;
    return this.resources.slice(
      firstElementIndex,
      firstElementIndex + this.paginateBy,
    );
  },
  setCurrentPage(page: number): void {
    if (page < 1) page = 1;
    if (page > this.pageCount) page = this.pageCount;
    this.currentPage = page;
    this.populate();
  },
  renderPaginationNav(div: Element): void {
    const paginateBy = this.paginateBy;
    if (this.paginationElements) {
      this.paginationElements.nav.toggleAttribute(
        'hidden',
        paginateBy == 0,
      );
    }
    if (!paginateBy) return;
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
        if(this.resource.previous) {
          this.element.dataset.src = this.resource.previous
        }
      });
      elements['next'].addEventListener('click', () => {
        this.currentPage += 1;
        this.empty();
        this.populate();
        if(this.resource.next) {
          this.element.dataset.src = this.resource.next
        }
      });
    }
    const elements = this.paginationElements;
    elements.current.textContent = this.currentPage;
    elements.count.textContent = this.pageCount;
    elements.prev.toggleAttribute('disabled', this.currentPage <= 1);
    elements.next.toggleAttribute('disabled',this.currentPage >= this.pageCount);
    return;
  },
}

export {
  PaginateMixin
}
