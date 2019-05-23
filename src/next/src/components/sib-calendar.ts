import { Sib } from '../libs/Sib.js';
import { ListMixin } from '../mixins/listMixin.js';
import { StoreMixin } from '../mixins/storeMixin.js';
import { importCSS } from '../libs/helpers.js';
//@ts-ignore
import Calendar from 'https://dev.jspm.io/tui-calendar';

const SibCalendar = {
  name: 'sib-calendar',
  use: [ListMixin, StoreMixin],
  created() {
    importCSS('https://uicdn.toast.com/tui-calendar/latest/tui-calendar.css');
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.border = '1px solid green';
    this.element.appendChild(div);
    this.calendar = new Calendar(div, { defaultView: 'month' });
    this.calendar.on('clickSchedule', this.dispatchSelect.bind(this));
  },
  get extra_context() {
    return { date: "http://www.w3.org/2001/XMLSchema#dateTime" }
  },
  dispatchSelect(event) {
    const resource = { '@id': event.schedule.id };
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
  },
  empty() {
    this.calendar.clear();
  }
};

export default Sib.register(SibCalendar);