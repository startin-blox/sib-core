import SIBBase from '../parents/sib-base.js';
import { SIBListMixin } from '../mixins/index.js';
import { importCSS } from '../helpers/index.js';
import L from 'https://dev.jspm.io/leaflet';

export default class SIBMap extends SIBListMixin(SIBBase) {
  get extra_context() {
    return {
      geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
      lat: 'geo:lat',
      lng: 'geo:long',
    };
  }

  constructor() {
    super();
    importCSS('https://unpkg.com/leaflet@1.3.1/dist/leaflet.css');
    this.markers = [];
    const div = document.createElement('div');
    div.style = 'width: 100%; height: 100%';
    this.map = L.map(div);
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    ).addTo(this.map);
    this.appendChild(div);
  }

  dispatchSelect(event) {
    const resource = event.target.options.resource;
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
    if (resource.lat && resource.lng) {
      const marker = L.marker([resource.lat, resource.lng], {
        resource: resource,
      });
      marker.addTo(this.map).on('click', this.dispatchSelect.bind(this));
      this.markers.push(marker);
    }
  }
  empty() {
    for (let marker of this.markers) this.map.removeLayer(marker);
    this.markers = [];
  }
  populate() {
    super.populate();
    
    this.map.fitBounds(L.featureGroup(this.markers).getBounds());
  }
  isSet() {
    return false;
  }
}
customElements.define('sib-map', SIBMap);
