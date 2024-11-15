import { html, render } from 'lit';

const ServerPaginationMixin = {
  name: 'server-pagination-mixin',
  use: [],
  attributes: {
    limit: {
      type: Number,
      default: undefined,
    },
    offset: {
      type: Number,
      default: undefined,
    },
    pageCount: {
      type: Number,
      default: 1000,
    },
    pageNumber: {
      type: Number,
      default: 0,
    },
  },
  initialState: {
    currentOffset: [],
  },

  attached(): void {
    if (this.limit) {
      this.setCurrentOffset(this.resourceId, 0);
      const parentDiv = this.initServerPaginationDiv(this.div);

      this.renderCallbacks.push({
        template: this.renderServerPaginationNav(this.resourceId, parentDiv),
        parent: parentDiv,
      });
    }
  },

  getCurrentOffset(resourceId: string, limit: number) {
    return this.currentOffset[resourceId + '#p' + limit];
  },

  async setCurrentOffset(resourceId: string, offset: number): Promise<void> {
    let index = resourceId + '#p' + this.limit;
    this.currentOffset[index] = this.offset = offset;
    this.pageNumber = Number(this.offset / this.limit);
    this.currentPage[resourceId] = this.pageNumber;

    await this.fetchData(this.dataSrc);
  },

  async decreaseCurrentOffset(resourceId: string): Promise<void> {
    let index = resourceId + '#p' + this.limit;
    this.currentOffset[index] = this.offset = this.offset - this.limit;
    this.currentPage[index] = this.offset / this.limit;
    this.pageNumber = this.offset / this.limit;

    this.updateNavButtons(resourceId, index, -1);
    await this.fetchData(this.dataSrc);
  },

  async increaseCurrentOffset(resourceId: string): Promise<void> {
    let index = resourceId + '#p' + this.limit;
    this.currentOffset[index] = this.offset = this.offset + this.limit;
    this.currentPage[index] = this.offset / this.limit;

    this.updateNavButtons(resourceId, index, 1);
    await this.fetchData(this.dataSrc);
  },

  async updateNavButtons(resourceId: string, index: string, variance: number) {
    this.element.querySelector("[data-id='prev']").disabled =
      this.currentOffset[index] <= 0;
    // this.element.querySelector("[data-id='next']").disabled = await this.resource['ldp:contains'].length == 0;
    this.element.querySelector("[data-id='current']").innerText =
      this.getCurrentServedPage(resourceId, variance);
  },

  getServerNavElement(div: HTMLElement) {
    if (div) {
      const insertNode = div.parentNode || div;
      return insertNode.querySelector(`nav[data-id="nav"]`);
    }

    return null;
  },

  getCurrentServedPage(context: string, variance: number): Promise<void> {
    this.currentPage[context] = Number(this.currentPage[context]) + variance;
    this.pageNumber = this.currentPage[context];
    return this.currentPage[context];
  },

  /**
   * Find nav element or create it if not existing
   * @param div - insert nav next to this div
   */
  initServerPaginationDiv(div: HTMLElement) {
    let nav = this.getServerNavElement(div);
    if (!nav) {
      nav = document.createElement('nav');
      nav.setAttribute('data-id', 'nav');
      const insertNode = div.parentNode || div;
      insertNode.appendChild(nav);
    }
    return nav;
  },

  /**
   * Create pagination template
   */
  renderServerPaginationNav(resourceId: string, div: HTMLElement): void {
    if (this.limit) {
      const currentOffset = this.getCurrentOffset(resourceId, this.limit);
      var currentPageNumber = this.getCurrentServedPage(resourceId, 1);
      const pageCount = Math.ceil(this.pageCount / this.limit);

      render(
        html`
        <button
          data-id="prev"
          ?disabled=${currentOffset <= 0}
          @click=${() => this.decreaseCurrentOffset(resourceId)}
        >←</button>
        <span data-id="current">
          ${currentPageNumber}
        </span>
        <button
          data-id="next"
          ?disabled=${currentOffset >= (pageCount - 1) * this.limit}
          @click=${() => this.increaseCurrentOffset(resourceId)}
        >→</button>
        <span>
        </span>
      `,
        div,
      );
    }
  },
};

export { ServerPaginationMixin };
