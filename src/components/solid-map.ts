import { Sib } from '../libs/Sib';
import { ListMixin } from '../mixins/listMixin';
import { StoreMixin } from '../mixins/storeMixin';
import { WidgetMixin } from '../mixins/widgetMixin';
import { CounterMixin } from '../mixins/counterMixin';
import { FilterMixin } from '../mixins/filterMixin';
import { GrouperMixin } from '../mixins/grouperMixin';
import { NextMixin } from '../mixins/nextMixin';
import { store } from '../libs/store/store';

import L, { MarkerOptions } from 'leaflet';
import 'leaflet.markercluster';

export const SolidMap = {
  name: 'solid-map',
  use: [
    WidgetMixin,
    ListMixin,
    StoreMixin,
    GrouperMixin,
    CounterMixin,
    FilterMixin,
    NextMixin,
  ],
  attributes: {
    clustering: {
      type: Boolean,
      default: null
    }
  },
  initialState: {
    markers: {
      default: null
    },
    subscriptions: null,
    resetPlanned: false
  },
  created(): void {
    //@ts-ignore
    import('leaflet/dist/leaflet.css');
    //@ts-ignore
    import('../style/default-theme.css');
    //@ts-ignore
    import('leaflet.markercluster/dist/MarkerCluster.css');
    //@ts-ignore
    import('leaflet.markercluster/dist/MarkerCluster.Default.css');

    document.body.addEventListener('navigate', () =>
      setTimeout(() => this.element.offsetParent && this.reset())
    );
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
    if (this.clustering !== null) {
      this.markersCluster = L.markerClusterGroup();
      this.map.addLayer(this.markersCluster);
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
    this.goToNext(resource);
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

      // create a marker, doc here: https://leafletjs.com/reference-1.6.0.html#marker
      const marker = L.marker(
        [lat.toString(), lng.toString()], 
        {resource, icon} as MarkerOptions
      );
      if(this.clustering === null) marker.addTo(this.map);
      else this.markersCluster.addLayer(marker);
      marker.on('click', this.dispatchSelect.bind(this));

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
    if (!this.map) return;
    if (this.markersCluster) this.map.removeLayer(this.markersCluster);
    for (let marker of this.markers) this.map.removeLayer(marker);
    if(this.clustering !== null) {
      this.markersCluster = L.markerClusterGroup();
      this.map.addLayer(this.markersCluster);
    }
    this.markers = [];
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