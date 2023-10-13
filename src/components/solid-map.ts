import { Sib } from '../libs/Sib';
import { ListMixin } from '../mixins/listMixin';
import { StoreMixin } from '../mixins/storeMixin';
import { WidgetMixin } from '../mixins/widgetMixin';
import { CounterMixin } from '../mixins/counterMixin';
import { FilterMixin } from '../mixins/filterMixin';
import { FederationMixin } from '../mixins/federationMixin';
import { GrouperMixin } from '../mixins/grouperMixin';
import { NextMixin } from '../mixins/nextMixin';
import { store } from '../libs/store/store';
import { uniqID } from '../libs/helpers';
import { spread } from '../libs/lit-helpers';

//@ts-ignore
import L, { MarkerOptions } from 'https://cdn.skypack.dev/'; // TODO : revert to "leaflet" when apps up to date
import 'https://cdn.skypack.dev/leaflet.markercluster'; // TODO : revert to "leaflet.markercluster" when apps up to date

import { html, render } from 'lit-html';
import { ifDefined } from 'lit-html/directives/if-defined';

export const SolidMap = {
  name: 'solid-map',
  use: [
    WidgetMixin,
    ListMixin,
    StoreMixin,
    GrouperMixin,
    CounterMixin,
    FilterMixin,
    FederationMixin,
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
    resetPlanned: false,
    hasBeenResetOnce: false
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

    // reset when it becomes visible to prevent bug https://git.startinblox.com/framework/sib-core/issues/661
    document.body.addEventListener('navigate', () =>
      setTimeout(() => this.isVisible && !this.hasBeenResetOnce && this.reset())
    );
    this.markers = [];
    this.subscriptions = new Map();
  },
  get isVisible() {
    return this.element.offsetParent !== null
  },
  attached(): void {
    const id = uniqID();
    const template = html`
      <div id=${id} style="width:100%;height:100%;"></div>
    `;
    render(template, this.element);

    const div = this.element.querySelector(`#${id}`);
    this.map = L.map(div);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
    ).addTo(this.map);

    if (this.clustering !== null) {
      this.markersCluster = L.markerClusterGroup();
      this.map.addLayer(this.markersCluster);
    }
  },
  reset() {
    if (this.isVisible) { // reset only if visible
      this.map.invalidateSize();

      if (this.markers.length) {
        this.map.fitBounds(L.featureGroup(this.markers).getBounds()); // Center map on markers if some available
      } else {
        this.map.fitWorld(); // ... or on the world if not
      }
      this.hasBeenResetOnce = true;
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
    const attributes:{[key:string]: string} = {};

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
        attributes[attr.name] = attr.value;
      if (attr.name.startsWith('child-'))
        attributes[attr.name.replace(/^child-/, '')] = attr.value;
    }

    const div = document.createElement('div');
    const template = html`
      <solid-display
        fields="${ifDefined(this.fields)}"
        data-src="${resourceId}"
        ...=${spread(attributes)}
      ></solid-display>
    `;
    render(template, div);
    return div.querySelector('solid-display');
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
   */
  renderGroup(groupName: string) {
    const sanitizedGroupName = encodeURIComponent(groupName.toLowerCase()).replace(/%[0-9A-F]{2}/gi, '');
    const div = document.createElement('div'); // used to pass group info to renderDOM
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