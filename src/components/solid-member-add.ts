import { Sib } from '../libs/Sib';
import { base_context, store } from '../libs/store/store';
import { NextMixin } from '../mixins/nextMixin';
import { ValidationMixin } from '../mixins/validationMixin';

import { html, render } from 'lit-html';
import { ContextMixin } from '../mixins/contextMixin';
import { newWidgetFactory } from '../new-widgets/new-widget-factory';
import { StoreMixin } from '../mixins/storeMixin';

export const SolidMemberAdd = {
  name: 'solid-member-add',
  use: [NextMixin, ValidationMixin, ContextMixin, StoreMixin],
  attributes: {
    // The list of users to load
    rangeUsers: {
      type: String,
      default: null,
      callback: function (newValue: string, oldValue: string) {
        if (newValue !== oldValue) this.planRender();
      },
    },
    addMemberLabel: {
      type: String,
      default: 'Add a member',
      callback: function (newValue: string, oldValue: string) {
        if (newValue !== oldValue) this.planRender();
      },
    },
  },
  initialState: {
    renderPlanned: false,
  },
  created(): void {
    newWidgetFactory('solid-form-dropdown-autocompletion');
    this.planRender();
  },
  async populate() {
    if (!this.resource) return;

    // Check if current user is member of this group ?
    let memberPredicate = store.getExpandedPredicate('user_set', base_context);
    this.currentMembers = await this.resource[memberPredicate];

    if (!Array.isArray(this.currentMembers)) {
      this.currentMembers = [this.currentMembers];
    }
  },
  planRender() {
    if (!this.renderPlanned) {
      this.renderPlanned = true;
      setTimeout(() => {
        this.render();
        this.renderPlanned = false;
      });
    }
  },
  async addMember(e: Event): Promise<void> {
    if (!this.dataSrc || !this.resourceId) return;
    e.preventDefault();
    this.performAction(); // In validationMixin, method defining what to do according to the present attributes
  },
  async addMembership() {
    this.currentMembers.push(JSON.parse(this.dataTargetSrc));

    let currentRes = {
      "@context": this.context,
      "user_set": this.currentMembers
    }
    return store.patch(currentRes, this.resourceId).then(response => {
      if (!response) {
        console.warn(`Error while adding user ${this.dataTargetSrc} to group ${this.resourceId}`);
        return;
      }

      this.goToNext(null);
      const eventData = { detail: { resource: { "@id": this.dataSrc } }, bubbles: true };
      this.element.dispatchEvent(new CustomEvent('save', eventData));
      this.element.dispatchEvent(new CustomEvent('memberAdded', eventData)); // Deprecated. To remove in 0.15
      this.planRender();
    })
  },
  validateModal() { // Send method to validationMixin, used by the dialog modal and performAction method
    return this.addMembership();
  },
  update() {
    this.render();
  },
  changeSelectedUser(e: Event) {
    if (!e.target || !(e.target as HTMLElement).firstElementChild) return;

    //FIXME: disgusting way to get the @id of the autocomplete slimselect widget value
    this.dataTargetSrc = ((e.target as HTMLElement).firstElementChild as HTMLSelectElement)?.value;
  },
  async render(): Promise<void> {
    // await this.replaceAttributesData(false);
    await this.populate();
    let button = html`
      <solid-ac-checker data-src="${this.resourceId}"
        permission="acl:Write"
      >
        <form 
          src="${this.resourceId}"
          @submit="${this.addMember.bind(this)}"
        >
          <solid-form-dropdown-autocompletion
            range="${this.rangeUsers}"
            data-src="${this.rangeUsers}"
            name="users"
            @change="${this.changeSelectedUser.bind(this)}"
          ></solid-form-dropdown-autocompletion>
          <button type="submit">${this.addMemberLabel}</button>
        </form>

        ${this.getModalDialog()}
      </solid-ac-checker>
      `;
    render(button, this.element);
  }
};

Sib.register(SolidMemberAdd);