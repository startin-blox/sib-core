import { Sib } from '../libs/Sib.js';
import { ListMixin } from '../mixins/listMixin.js';
import { StoreMixin } from '../mixins/storeMixin.js';
import { importCSS } from '../libs/helpers.js';
//@ts-ignore
import Calendar from 'https://dev.jspm.io/tui-calendar';

export const SibCalendar = {
  name: 'sib-calendar',
  use: [ListMixin, StoreMixin],
  created(): void {
    importCSS('https://uicdn.toast.com/tui-calendar/latest/tui-calendar.css');
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.border = '1px solid green';
    this.element.appendChild(div);
    this.calendar = new Calendar(div, { defaultView: 'month' });
    this.calendar.on('clickSchedule', this.dispatchSelect.bind(this));
  },
  get extra_context(): object {
    return { date: "http://www.w3.org/2001/XMLSchema#dateTime" }
  },
  dispatchSelect(event: Event): void {
    const resource = { '@id': event['schedule'].id };
    this.element.dispatchEvent(
      new CustomEvent('resourceSelect', { detail: { resource: resource } }),
    );
    if (this.next) {
      this.element.dispatchEvent(
        new CustomEvent('requestNavigation', {
          bubbles: true,
          detail: { route: this.next, resource: resource },
        }),
      );
    }
  },
  appendChildElt(resource): void {
    if (resource.name && resource.date) {
      this.calendar.createSchedules([
        {
          id: resource['@id'],
          title: resource.name,
          category: 'time',
          start: resource.date,
        },
      ]);
    }
  },
  empty(): void {
    this.calendar.clear();
  }
};

Sib.register(SibCalendar);