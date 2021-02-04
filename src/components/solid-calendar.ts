import { Sib } from '../libs/Sib';
import { ListMixin } from '../mixins/listMixin';
import { StoreMixin } from '../mixins/storeMixin';
import { NextMixin } from '../mixins/nextMixin';
import { store } from '../libs/store/store';
import { uniqID } from '../libs/helpers';

import Calendar from 'tui-calendar';
import { html, render } from 'lit-html';

export const SolidCalendar = {
  name: 'solid-calendar',
  use: [
    ListMixin,
    StoreMixin,
    NextMixin
  ],
  initialState: {
    subscriptions: null
  },
  created(): void {
    //@ts-ignore
    import('tui-calendar/dist/tui-calendar.css');
    const id = uniqID();
    const template = html`
      <div id=${id} style="width:100%;height:100%;"></div>
    `;
    render(template, this.element);
    this.calendar = new Calendar(this.element.querySelector(`#${id}`), { defaultView: 'month' });
    this.calendar.on('clickSchedule', this.dispatchSelect.bind(this));
    this.subscriptions = new Map();
  },
  get extra_context(): object {
    return { date: "http://www.w3.org/2001/XMLSchema#dateTime" }
  },
  dispatchSelect(event: Event): void {
    const resource = { '@id': event['schedule'].id };
    this.element.dispatchEvent(
      new CustomEvent('resourceSelect', { detail: { resource: resource } }),
    );
    this.goToNext(resource);
  },
  async appendChildElt(resourceId: string) {
    const resource = await store.getData(resourceId, this.context);
    if(!resource) return;
    if (!this.subscriptions.get(resourceId)) {
      this.subscriptions.set(resourceId, PubSub.subscribe(resourceId, () => this.updateDOM()))
    } // TODO : mixin gestion des enfants
    const date = await resource['date'];
    const name = await resource['name'];

    if (name && date) {
      this.calendar.createSchedules([
        {
          id: resource['@id'],
          title: name.toString(),
          category: 'time',
          start: date.toString(),
        },
      ]);
    }
  },
  empty(): void {
    this.calendar.clear();
  }
};

Sib.register(SolidCalendar);