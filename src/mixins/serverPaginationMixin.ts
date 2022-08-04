import { html, render } from "lit-html";

const ServerPaginationMixin = {
  name: 'server-pagination-mixin',
  use: [],
  attributes: {
    limit: {
      type: Number,
      default: 0
    },
    offset: {
      type: Number,
      default: 0
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
    // if (!this.currentOffset[this.resourceId + "#p" + this.limit]) {
    //   this.currentOffset[this.resourceId + "#p" + this.limit] = this.limit;
    // }

    const parentDiv = this.initParentPaginationDiv(this.div);
    console.log("Current Div", this.div);
    console.log("ParentDiv", parentDiv);
  
    this.renderCallbacks.push({
      template: this.renderPaginationNav(this.resourceId, parentDiv),
      parent: parentDiv
    });
  },

  getCurrentOffset(resourceId: string, limit: number) {
    return this.currentOffset[resourceId + "#p" + limit];
  },

  async setCurrentOffset(resourceId: string, offset: number): Promise<void> {
    console.log("Going thorugh the event");
    let index = resourceId + "#p" + this.limit;
    this.currentOffset[this.resourceId + "#p" + this.limit] 
    console.log(["offset index", index, offset, this.offset]);
    this.currentOffset[index] = this.offset = offset;
    await this.fetchData(this.dataSrc);
  },

  async decreaseCurrentOffset(resourceId: string, offset: number): Promise<void> {
    console.log("Going thorugh the event");
    let index = resourceId + "#p" + this.limit;
    this.currentOffset[this.resourceId + "#p" + this.limit] 
    console.log(["offset index", index, offset, this.offset]);
    this.currentOffset[index] = this.offset = this.offset - this.limit;
    await this.fetchData(this.dataSrc);
  },

  async increaseCurrentOffset(resourceId: string, offset: number): Promise<void> {
    console.log("Going thorugh the event");
    let index = resourceId + "#p" + this.limit;
    this.currentOffset[this.resourceId + "#p" + this.limit] 
    console.log(["offset index", index, offset, this.offset]);
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
    console.log("currentOffset", this.currentOffset[this.resourceId + "#p" + this.limit]);
    console.log(this.currentOffset[this.resourceId + "#p" + this.limit] < this.limit);
    const currentOffset = this.getCurrentOffset(resourceId, this.limit);

    if (this.limit) {
      console.log("Offset in pagination nav", currentOffset, currentOffset - this.limit, currentOffset + this.limit, currentOffset + this.limit);
      render(html`
        <button
          data-id="prev"
          ?disabled=${currentOffset <= this.limit}
          @click=${() => this.decreaseCurrentOffset(resourceId, currentOffset - this.limit)}
        >←</button>
        <button
          data-id="next"
          ?disabled=${currentOffset >= this.pageCount}
          @click=${ () => this.increaseCurrentOffset(resourceId, currentOffset + this.limit)}
        >→</button>
        <span>
          <span data-id="current">${this.getCurrentOffset(resourceId, this.limit)}</span> / <span data-id="count">...</span>
        </span>
      `, div);
    }
  },
}


export {
  ServerPaginationMixin
}