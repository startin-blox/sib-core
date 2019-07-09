import { Sib } from '../libs/Sib.js';
import { ListMixin } from '../mixins/listMixin.js';
import { StoreMixin } from '../mixins/storeMixin.js';
import { LocationResourceInterface } from '../libs/interfaces.js';
import { importCSS } from '../libs/helpers.js';
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
    this.map.fitBounds(L.featureGroup(this.markers).getBounds());
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
  appendChildElt(resource: LocationResourceInterface): void {
    if (resource.lat && resource.lng) {
      const marker = L.marker([resource.lat, resource.lng], {
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
  populate(): void {
    for (let resource of this.resources) this.appendChildElt(resource);
    this.reset();
  },
};

Sib.register(SibMap);