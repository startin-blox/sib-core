import { html, render } from "lit-html";
import { store } from '../libs/store/store';

const ServerPaginationMixin = {
  name: 'server-pagination-mixin',
  use: [],
  attributes: {
    limit: {
      type: Number,
      default: undefined
    },
    offset: {
      type: Number,
      default: undefined
    },
    pageCount: {
      type: Number,
      default: 1000
    },
  },
  initialState: {
    currentOffset: [],
  },

  attached(): void {
    this.setCurrentOffset(this.resourceId, 0);
    const parentDiv = this.initParentPaginationDiv(this.div);
  
    this.renderCallbacks.push({
      template: this.renderPaginationNav(this.resourceId, parentDiv),
      parent: parentDiv
    });
  },

  getCurrentOffset(resourceId: string, limit: number) {
    return this.currentOffset[resourceId + "#p" + limit];
  },

  async setCurrentOffset(resourceId: string, offset: number): Promise<void> {
    let index = resourceId + "#p" + this.limit;
    this.currentOffset[index] = this.offset = offset;
    await this.fetchData(this.dataSrc);
  },

  async decreaseCurrentOffset(resourceId: string): Promise<void> {
    let index = resourceId + "#p" + this.limit;
    this.currentOffset[index] = this.offset = this.offset - this.limit;
    await this.fetchData(this.dataSrc);
  },

  async increaseCurrentOffset(resourceId: string): Promise<void> {
    let index = resourceId + "#p" + this.limit;
    this.currentOffset[index] = this.offset = this.offset + this.limit;
    await this.fetchData(this.dataSrc);
  },

  getNavElement(div: HTMLElement) {
    const insertNode = div.parentNode || div;
    return insertNode.querySelector(`nav[data-id="nav"]`);
  },
  /**
   * Find nav element or create it if not existing
   * @param div - insert nav next to this div
   */
  initParentPaginationDiv(div: HTMLElement) {
    let nav = this.getNavElement(div);
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
  renderPaginationNav(resourceId: string, div: HTMLElement): void {
    const currentOffset = this.getCurrentOffset(resourceId, this.limit);

    if (this.limit) {
      render(html`
        <button
          data-id="prev"
          @click=${() => this.decreaseCurrentOffset(resourceId)}
        >←</button>
        <button
          data-id="next"
          ?disabled=${currentOffset >= this.pageCount}
          @click=${ () => this.increaseCurrentOffset(resourceId)}
        >→</button>
        <span>
          <span data-id="current">${this.offset}</span> / <span data-id="count">...</span>
        </span>
      `, div);
    }
  },
}


export {
  ServerPaginationMixin
}