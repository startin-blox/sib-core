import { Sib } from '../libs/Sib.js';
import { ListMixin } from '../mixins/listMixin.js';
import { StoreMixin } from '../mixins/storeMixin.js';
import { importCSS } from '../libs/helpers.js';
//@ts-ignore
import L from 'https://dev.jspm.io/leaflet';

const SibMap = {
  name: 'sib-map',
  use: [ListMixin, StoreMixin],
  initialState: {
    markers: {
      default: null
    }
  },
  created() {
    importCSS('https://unpkg.com/leaflet@1.3.1/dist/leaflet.css');
    this.markers = [];
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    this.map = L.map(div);
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    ).addTo(this.map);
    this.element.appendChild(div);
  },
  get extra_context() {
    return {
      geo: "http://www.w3.org/2003/01/geo/wgs84_pos#",
      lat: "geo:lat",
      lng: "geo:long"
    }
  },
  dispatchSelect(event) {
    const resource = event.target.options.resource;
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
    if (resource.lat && resource.lng) {
      const marker = L.marker([resource.lat, resource.lng], {
        resource: resource,
      });
      marker.addTo(this.map).on('click', this.dispatchSelect.bind(this));
      this.markers.push(marker);
    }
  },
  empty() {
    for (let marker of this.markers) this.map.removeLayer(marker);
  },
  populate() {
    for (let resource of this.resources) this.appendChildElt(resource);
    console.log(this.markers);
    this.map.fitBounds(L.featureGroup(this.markers).getBounds());
  }
};

export default Sib.register(SibMap);