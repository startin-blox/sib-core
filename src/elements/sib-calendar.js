import SIBBase from '../parents/sib-base.js';
import { SIBListMixin } from '../mixins/index.js';
import { importCSS } from '../helpers/index.js';
import Calendar from 'https://dev.jspm.io/tui-calendar';

export default class SIBCalendar extends SIBListMixin(SIBBase) {
  get extra_context() {
    return { date: 'http://www.w3.org/2001/XMLSchema#dateTime' };
  }

  constructor() {
    super();
    importCSS('https://uicdn.toast.com/tui-calendar/latest/tui-calendar.css');
    const div = document.createElement('div');
    div.style = 'width: 100%; height: 100%; border:1px solid green;';
    this.appendChild(div);
    this.calendar = new Calendar(div, { defaultView: 'month' });
    this.calendar.on('clickSchedule', this.dispatchSelect.bind(this));
  }

  dispatchSelect(event) {
    const resource = { '@id': event.schedule.id };
    this.dispatchEvent(
      new CustomEvent('resourceSelect', { detail: { resource: resource } }),
    );
    if (this.next) {
      this.dispatchEvent(
        new CustomEvent('requestNavigation', {
          bubbles: true,
          detail: { route: this.next, resource: resource },
        }),
      );
    }
  }

  appendChildElt(resource) {
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
  }

  empty() {
    this.calendar.clear();
  }
}
customElements.define('sib-calendar', SIBCalendar);
