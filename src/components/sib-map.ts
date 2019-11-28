import { Sib } from '../libs/Sib.js';
import { ListMixin } from '../mixins/listMixin.js';
import { StoreMixin } from '../mixins/storeMixin.js';
import { importCSS } from '../libs/helpers.js';
import { store } from '../libs/store/store.js';

//@ts-ignore
import L from 'https://dev.jspm.io/leaflet';

export const SibMap = {
  name: 'sib-map',
  use: [ListMixin, StoreMixin],
  initialState: {
    markers: {
      default: null
    }
  },
  created(): void {
    importCSS('https://unpkg.com/leaflet@1.3.1/dist/leaflet.css');
    this.markers = [];
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
  get extra_context(): object {
    return {
      geo: "http://www.w3.org/2003/01/geo/wgs84_pos#",
      lat: "geo:lat",
      lng: "geo:long"
    }
  },
  reset() {
    this.map.invalidateSize();

    if (this.markers.length) {
      this.map.fitBounds(L.featureGroup(this.markers).getBounds()); // Center map on markers if some available
    } else {
      this.map.fitWorld(); // ... or on the world if not
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
  async appendChildElt(resourceId: string) {
    const resource = await store.initGraph(resourceId, this.context);
    const lat = await resource['lat'];
    const lng = await resource['lng'];

    if (lat && lng) {
      const marker = L.marker([lat.toString(), lng.toString()], {
        resource: resource,
      });

      marker.addTo(this.map).on('click', this.dispatchSelect.bind(this));
      this.markers.push(marker);
    }
  },
  empty(): void {
    for (let marker of this.markers) this.map.removeLayer(marker);
    this.markers = [];
  },
  isSet() {
    return false;
  },
  async renderDOM(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string) {
    if (!this.filtersAdded && this.searchFields) {
      this.appendFilters();
      return;
    }

    for await (let resource of resources) await this.appendChildElt(resource['@id']);
    this.reset();

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) await nextProcessor(resources, listPostProcessors, div, context);
  }
};

Sib.register(SibMap);