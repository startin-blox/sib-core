import { ifDefined } from 'lit/directives/if-defined.js';
import { Sib } from '../libs/Sib.ts';
import { base_context, store } from '../libs/store/store.ts';
import { NextMixin } from '../mixins/nextMixin.ts';
import { ValidationMixin } from '../mixins/validationMixin.ts';

import { html, render } from 'lit';
import { trackRenderAsync } from '../logger.ts';
import { ContextMixin } from '../mixins/contextMixin.ts';

export const SolidMemberDelete = {
  name: 'solid-member-delete',
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
    dataLabel: {
      type: String,
      default: null,
      callback: function (newValue: string, oldValue: string) {
        if (newValue !== oldValue) this.planRender();
      },
    },
    // The user id to remove from the group
    dataTargetSrc: {
      type: String,
      default: null,
      callback: function (newValue: string, oldValue: string) {
        if (newValue !== oldValue) {
          this.planRender();
        }
      },
    },
    dataUnknownMember: {
      type: String,
      default: 'Given user is not a member of this group',
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
    if (!this.resourceId) return;

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
      ? this.currentMembers.some(member => member['@id'] === this.dataTargetSrc)
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
  removeMember(e: Event) {
    e.stopPropagation();
    if (!this.dataSrc) return;
    this.performAction(); // In validationMixin, method defining what to do according to the present attributes
  },
  async deleteMembership() {
    const userSet = this.currentMembers.filter(value => {
      const userId = value['@id'];
      if (userId === this.dataTargetSrc) return false;
      return true;
    });

    const currentRes = {
      '@context': this.context,
      user_set: userSet,
    };
    return store.patch(currentRes, this.dataSrc).then(response => {
      if (!response) {
        console.warn(
          `Error while removing user ${this.dataTargetSrc} from group ${this.dataSrc}`,
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
  validateModal() {
    // Send method to validationMixin, used by the dialog modal and performAction method
    return this.deleteMembership();
  },
  update() {
    this.render();
  },
  render: trackRenderAsync(async function (): Promise<void> {
    // await this.replaceAttributesData(false);
    await this.populate();
    let button = html``;
    if (this.isMember) {
      button = html`
        <solid-ac-checker data-src="${this.dataSrc}"
              permission="acl:Write"
              class=${ifDefined(this.classSubmitButton)}
            >
          <button
            @click=${this.removeMember.bind(this)}>
              ${this.dataLabel || this.t('solid-delete-member.button')}
          </button>
          ${this.getModalDialog()}
        </solid-ac-checker>
        `;
    } else {
      button = html`<span>${this.dataUnknownMember || this.t('solid-member-unknown.span')}</span>`;
    }
    render(button, this.element);
  }, 'SolidMemberDelete:render'),
};

Sib.register(SolidMemberDelete);
