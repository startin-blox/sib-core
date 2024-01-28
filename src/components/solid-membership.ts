import { Sib } from '../libs/Sib';
import { base_context, store } from '../libs/store/store';
import { NextMixin } from '../mixins/nextMixin';
import { ValidationMixin } from '../mixins/validationMixin';
// import { AttributeBinderMixin } from '../mixins/attributeBinderMixin';

import { html, render } from 'lit-html';
import { ContextMixin } from '../mixins/contextMixin';

export const SolidMembership = {
  name: 'solid-membership',
  use: [NextMixin, ValidationMixin, ContextMixin],
  attributes: {
    // Data Source being a group URI in that case
    dataSrc: {
      type: String,
      default: null,
      callback: function () {
        this.resourceId = this.dataSrc;
      },
    },
    dataLeaveLabel: {
      type: String,
      default: null,
      callback: function (newValue: string, oldValue: string) {
        if (newValue !== oldValue) this.planRender();
      },
    },
    dataJoinLabel: {
      type: String,
      default: null,
      callback: function (newValue: string, oldValue: string) {
        if (newValue !== oldValue) this.planRender();
      },
    }
  },
  initialState: {
    renderPlanned: false,
  },
  created(): void {
    this.planRender();
  },
  async populate() {
    if (!store.session) return;

    // Retrieve the current user from the current store authenticated session
    let currentUserSession = await store.session;
    this.userId = await currentUserSession.webId;
    if (!this.userId) return;

    // Retrieve the group resource
    this.resource = await store.getData(this.resourceId);
    if (!this.resource) return;

    // Check if current user is member of this group ?
    let memberPredicate = store.getExpandedPredicate('user_set', base_context);
    this.currentMembers = await this.resource[memberPredicate];

    if (!Array.isArray(this.currentMembers)) {
      this.currentMembers = [this.currentMembers];
    }

    // Check if current user is member of this group
    this.isMember = this.currentMembers
      ? this.currentMembers.some((member) => member['@id'] === this.userId)
      : false;
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
  async changeMembership(e: Event): Promise<void> {
    e.stopPropagation();
    if (!this.dataSrc) return;
    this.performAction(); // In validationMixin, method defining what to do according to the present attributes
  },
  async joinGroup() {
    let userSet = this.currentMembers.push({"@id": this.userId});
    let currentRes = {
      "@context": this.context,
      "user_set": userSet
    }
    return store.patch(currentRes, this.dataSrc).then(response => {
      if (!response) {
        console.warn(`Error while joining group ${this.dataSrc} for user ${this.userId}`);
        return;
      }
      this.goToNext(null);
      const eventData = { detail: { resource: { "@id": this.dataSrc } }, bubbles: true };
      this.element.dispatchEvent(new CustomEvent('save', eventData));
      this.element.dispatchEvent(new CustomEvent('memberAdded', eventData)); // Deprecated. To remove in 0.15
      this.planRender();
    });
  },
  async leaveGroup() {
    let userSet = this.currentMembers.filter((value) => {
      const userId = value['@id'];
      if (userId == this.userId) 
        return false;
      else return true;
    });

    let currentRes = {
      "@context": this.context,
      "user_set": userSet
    }
    return store.patch(currentRes, this.dataSrc).then(response => {
      if (!response) {
        console.warn(`Error while leaving group ${this.dataSrc} for user ${this.userId}`);
        return;
      }
      this.goToNext(null);
      const eventData = { detail: { resource: { "@id": this.dataSrc } }, bubbles: true };
      this.element.dispatchEvent(new CustomEvent('save', eventData));
      this.element.dispatchEvent(new CustomEvent('memberRemoved', eventData)); // Deprecated. To remove in 0.15
      this.planRender();
    })
  },
  switchMembership() {
    if (this.isMember) {
      return this.leaveGroup();
    } else {
      return this.joinGroup();
    }
  },
  validateModal() { // Send method to validationMixin, used by the dialog modal and performAction method
    return this.switchMembership();
  },
  update() {
    this.render();
  },
  async render(): Promise<void> {
    // await this.replaceAttributesData(false);
    await this.populate();
    let button = html``;
    if (this.isMember) {
      button = html`
        <solid-ac-checker data-src="${this.dataSrc}"
              permission="acl:Read"
            >
          <button @click=${this.changeMembership.bind(this)}>${this.dataLeaveLabel || this.t("solid-leave-group.button")}</button>
          ${this.getModalDialog()}
        </solid-ac-checker>
        `;
    } else {
      button = html`
        <solid-ac-checker data-src="${this.dataSrc}"
              permission="acl:Read"
            >
          <button @click=${this.changeMembership.bind(this)}>${this.dataJoinLabel || this.t("solid-join-group.button")}</button>
          ${this.getModalDialog()}
        </solid-ac-checker>
        `;
    }
    render(button, this.element);
  }
};

Sib.register(SolidMembership);