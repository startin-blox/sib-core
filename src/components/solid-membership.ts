import { Sib } from '../libs/Sib.ts';
import { base_context, store } from '../libs/store/store.ts';
import { NextMixin } from '../mixins/nextMixin.ts';
import { ValidationMixin } from '../mixins/validationMixin.ts';

import { html, render } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { trackRenderAsync } from '../logger.ts';
import { ContextMixin } from '../mixins/contextMixin.ts';

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
      default: null,
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
    },
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
    const currentUserSession = await store.session;
    if (!currentUserSession) return;

    if (!this.dataTargetSrc) this.userId = await currentUserSession.webId;
    else this.userId = this.dataTargetSrc;

    if (!this.userId) return;

    // Retrieve the group resource
    this.resource = await store.getData(this.resourceId);
    if (!this.resource) return;

    // Check if current user is member of this group ?
    const memberPredicate = store.getExpandedPredicate(
      'user_set',
      base_context,
    );
    this.currentMembers = await this.resource[memberPredicate];

    if (!Array.isArray(this.currentMembers)) {
      this.currentMembers = [this.currentMembers];
    }

    this.currentMembers = this.currentMembers.map(member => {
      return { '@id': member['@id'] };
    });

    // Check if current user is member of this group
    this.isMember = this.currentMembers
      ? this.currentMembers.some(member => member['@id'] === this.userId)
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
  changeMembership(e: Event) {
    e.stopPropagation();
    if (!this.dataSrc) return;
    this.performAction(); // In validationMixin, method defining what to do according to the present attributes
  },
  async joinGroup() {
    this.currentMembers.push({ '@id': this.userId });
    const currentRes = {
      '@context': this.context,
      user_set: this.currentMembers,
    };
    return store.patch(currentRes, this.dataSrc).then(response => {
      if (!response) {
        console.warn(
          `Error while joining group ${this.dataSrc} for user ${this.userId}`,
        );
        return;
      }
      this.goToNext(null);
      const eventData = {
        detail: { resource: { '@id': this.dataSrc } },
        bubbles: true,
      };
      this.element.dispatchEvent(new CustomEvent('save', eventData));
      this.element.dispatchEvent(new CustomEvent('memberAdded', eventData)); // Deprecated. To remove in 0.15
      this.planRender();
    });
  },
  async leaveGroup() {
    const userSet = this.currentMembers.filter(value => {
      const userId = value['@id'];
      if (userId === this.userId) return false;
      return true;
    });

    const currentRes = {
      '@context': this.context,
      user_set: userSet,
    };
    return store.patch(currentRes, this.dataSrc).then(response => {
      if (!response) {
        console.warn(
          `Error while leaving group ${this.dataSrc} for user ${this.userId}`,
        );
        return;
      }
      this.goToNext(null);
      const eventData = {
        detail: { resource: { '@id': this.dataSrc } },
        bubbles: true,
      };
      this.element.dispatchEvent(new CustomEvent('save', eventData));
      this.element.dispatchEvent(new CustomEvent('memberRemoved', eventData)); // Deprecated. To remove in 0.15
      this.planRender();
    });
  },
  switchMembership() {
    if (this.isMember) {
      return this.leaveGroup();
    }
    return this.joinGroup();
  },
  validateModal() {
    // Send method to validationMixin, used by the dialog modal and performAction method
    return this.switchMembership();
  },
  update() {
    this.render();
  },
  render: trackRenderAsync(async function (): Promise<void> {
    await this.populate();
    let button = html``;
    if (this.isMember) {
      button = html`
          <solid-ac-checker data-src="${this.dataSrc}"
                permission="acl:Read"
                class=${ifDefined(`${this.classSubmitButton ? `leave ${this.classSubmitButton}` : 'leave'}`)}
              >
            <button @click=${this.changeMembership.bind(this)}>${this.dataLeaveLabel || this.t('solid-leave-group.button')}</button>
            ${this.getModalDialog()}
          </solid-ac-checker>
          `;
    } else {
      button = html`
          <solid-ac-checker data-src="${this.dataSrc}"
                permission="acl:Read"
                class=${ifDefined(`${this.classSubmitButton ? `join ${this.classSubmitButton}` : 'join'}`)}
              >
            <button @click=${this.changeMembership.bind(this)}>${this.dataJoinLabel || this.t('solid-join-group.button')}</button>
            ${this.getModalDialog()}
          </solid-ac-checker>
          `;
    }
    render(button, this.element);
  }, 'SolidMembership:render'),
};

Sib.register(SolidMembership);
