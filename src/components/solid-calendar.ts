import { Sib } from '../libs/Sib.js';
import { ListMixin } from '../mixins/listMixin.js';
import { StoreMixin } from '../mixins/storeMixin.js';
import {NextMixin } from '../mixins/nextMixin.js';
import { importCSS } from '../libs/helpers.js';
import Calendar from 'tui-calendar';
import { store } from '../libs/store/store.js';

export const SolidCalendar = {
  name: 'solid-calendar',
  use: [ListMixin, StoreMixin, NextMixin],
  initialState: {
    subscriptions: null
  },
  created(): void {
    importCSS('../web_modules/tui-calendar/dist/tui-calendar.css');
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.border = '1px solid green';
    this.element.appendChild(div);
    this.calendar = new Calendar(div, { defaultView: 'month' });
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