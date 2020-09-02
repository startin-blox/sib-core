import { Sib } from '../libs/Sib.js';
import { ListMixin } from '../mixins/listMixin.js';
import { StoreMixin } from '../mixins/storeMixin.js';
import { WidgetMixin } from '../mixins/widgetMixin.js';
import { CounterMixin } from '../mixins/counterMixin.js';
import { FilterMixin } from '../mixins/filterMixin.js';
import { GrouperMixin } from '../mixins/grouperMixin.js';
import { importCSS } from '../libs/helpers.js';
import { store } from '../libs/store/store.js';

//@ts-ignore
import L from 'https://dev.jspm.io/leaflet@1';

export const SolidMap = {
  name: 'solid-map',
  use: [
    WidgetMixin,
    ListMixin,
    StoreMixin,
    GrouperMixin,
    CounterMixin,
    FilterMixin,
  ],
  initialState: {
    markers: {
      default: null
    },
    subscriptions: null,
    resetPlanned: false
  },
  created(): void {
    importCSS('https://unpkg.com/leaflet@1.3.1/dist/leaflet.css');
    importCSS('./../style/default-theme.css');
    this.markers = [];
    this.subscriptions = new Map();
  },
  attached(): void {
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    this.map = L.map(div);
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
    ).addTo(this.map);
    this.element.appendChild(div);
  },
  reset() {
    this.map.invalidateSize();

    if (this.markers.length) {
      this.map.fitBounds(L.featureGroup(this.markers).getBounds()); // Center map on markers if some available
    } else {
      this.map.fitWorld(); // ... or on the world if not
    }
  },
  /**
   * Execute a reset only if none is planned already
   */
  planReset() {
    if (!this.resetPlanned) {
      this.resetPlanned = true;
      setTimeout(() => {
        this.reset();
        this.resetPlanned = false;
      })
    }
  },
  dispatchSelect(event: CustomEvent): void {
    const target = event.target as Element;
    const resource = target['options'].resource;
    this.element.dispatchEvent(
      new CustomEvent('resourceSelect', { detail: { resource: resource } })
    );
    if (this.next) {
      this.element.dispatchEvent(
        new CustomEvent('requestNavigation', {
          bubbles: true,
          detail: { route: this.next, resource: resource }
        })
      );
    }
  },

  /**
   * Override listMixin method: initialize a marker on the map
   * @param resourceId: id of the resource to display
   * @param groupClass: class of the group of markers
   */
  async appendChildElt(resourceId: string, groupClass: string) {
    const resource = await store.getData(resourceId, this.context);
    if (!this.subscriptions.get(resourceId)) {
      this.subscriptions.set(resourceId, PubSub.subscribe(resourceId, () => this.updateDOM()))
    }
    if (!resource) return;
    const lat = await resource['lat'];
    const lng = await resource['lng'];

    if (lat && lng) {
      const icon = L.divIcon({ // create the icon, doc here: https://leafletjs.com/reference-1.6.0.html#icon
        className: 'sib-custom-marker ' + groupClass, // default class used for styling
        iconSize: [8, 8],
        iconAnchor: [12, 34],
        popupAnchor: [0,-34]
      });

      const marker = L.marker([lat.toString(), lng.toString()], { // create a marker, doc here: https://leafletjs.com/reference-1.6.0.html#marker
        resource: resource,
        icon: icon
      }).addTo(this.map)
        .on('click', this.dispatchSelect.bind(this));

      if (this.fields !== null) { // show popups only if fields attribute
        marker.bindPopup(() => this.getPopupContent(resourceId), { minWidth: 150 }) // re-generate popup solid-display
      }

      this.markers.push(marker);
    }
  },
  /**
   * Generate the solid-display of the popup
   * @param resourceId: id of the popup clicked
   */
  getPopupContent(resourceId: string) {
    const child = document.createElement('solid-display');
    if (this.fields != null) child.setAttribute('fields', this.fields);

    for (let attr of this.element.attributes) {
      //copy widget and value attributes
      if (
        attr.name.startsWith('value-') ||
        attr.name.startsWith('label-') ||
        attr.name.startsWith('widget-') ||
        attr.name.startsWith('class-') ||
        attr.name.startsWith('multiple-') ||
        attr.name.startsWith('editable-') ||
        attr.name.startsWith('action-') ||
        attr.name.startsWith('default-') ||
        attr.name == 'extra-context'
      )
        child.setAttribute(attr.name, attr.value);
      if (attr.name.startsWith('child-'))
        child.setAttribute(attr.name.replace(/^child-/, ''), attr.value);
    }
    child.dataset.src = resourceId; // set id after the extra-context is
    return child
  },
  /**
   * Override widgetMixin method: empty the map
   */
  empty(): void {
    for (let marker of this.markers) this.map.removeLayer(marker);
    this.markers = [];
  },
  /**
   * Override widgetMixin method
   */
  isSet() {
    return false;
  },
  /**
   * Override groupMixin method
   * @param groupName: value of the group
   * @param div: Originally, div to insert content in. Used here to pass informations to the renderDOM method
   */
  renderGroup(groupName: string, div: HTMLElement) {
    const sanitizedGroupName = encodeURIComponent(groupName.toLowerCase()).replace(/%[0-9A-F]{2}/gi,'');
    div.dataset.groupClass = 'group-' + sanitizedGroupName;
    return div;
  },
  /**
   * Override listMixin method: display all the resources
   * @param resources
   * @param listPostProcessors
   * @param div
   * @param context
   */
  async renderDOM(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string) {
    const groupClass = div.dataset.groupClass || ''; // get the group class from the useless div element
    await Promise.all(resources.map(resource => this.appendChildElt(resource['@id'], groupClass)))
    this.planReset();

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) await nextProcessor(resources, listPostProcessors, div, context);
  }
};

Sib.register(SolidMap);