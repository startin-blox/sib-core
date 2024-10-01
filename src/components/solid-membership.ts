import { Sib } from '../libs/Sib';
import { base_context, store } from '../libs/store/store';
import { NextMixin } from '../mixins/nextMixin';
import { ValidationMixin } from '../mixins/validationMixin';

import { html, render } from 'lit-html';
import { ContextMixin } from '../mixins/contextMixin';
import { ifDefined } from 'lit-html/directives/if-defined';
import { trackRenderAsync } from '../logger';

export const SolidMembership = {
  name: 'solid-membership',
  use: [NextMixin, ValidationMixin, ContextMixin],
  attributes: {
    dataSrc: {
      type: String,
      default: null,
      callback: function () {
        this.resourceId = this.dataSrc;
      },
    },
    dataTargetSrc: {
      type: String,
      default: null
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
    },
    classSubmitButton: {
      type: String,
      default: undefined,
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
    if (!currentUserSession) return;

    if (!this.dataTargetSrc)
      this.userId = await currentUserSession.webId;
    else
      this.userId = this.dataTargetSrc;

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

    this.currentMembers = this.currentMembers.map(member => { return {"@id": member['@id'] } });

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
    this.currentMembers.push({"@id": this.userId});
    let currentRes = {
      "@context": this.context,
      "user_set": this.currentMembers
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
  render: trackRenderAsync(
    async function(): Promise<void> {
      await this.populate();
      let button = html``;
      if (this.isMember) {
        button = html`
          <solid-ac-checker data-src="${this.dataSrc}"
                permission="acl:Read"
                class=${ifDefined(`${this.classSubmitButton ?  'leave ' + this.classSubmitButton: 'leave'}`)}
              >
            <button @click=${this.changeMembership.bind(this)}>${this.dataLeaveLabel || this.t("solid-leave-group.button")}</button>
            ${this.getModalDialog()}
          </solid-ac-checker>
          `;
      } else {
        button = html`
          <solid-ac-checker data-src="${this.dataSrc}"
                permission="acl:Read"
                class=${ifDefined(`${this.classSubmitButton ?  'join ' + this.classSubmitButton: 'join'}`)}
              >
            <button @click=${this.changeMembership.bind(this)}>${this.dataJoinLabel || this.t("solid-join-group.button")}</button>
            ${this.getModalDialog()}
          </solid-ac-checker>
          `;
      }
      render(button, this.element);
    },
    "SolidMembership:render")
};

Sib.register(SolidMembership);