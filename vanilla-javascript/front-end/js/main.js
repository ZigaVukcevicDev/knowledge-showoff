/* global google */

/**
 * Entry Point for webpack module bundler.
 *
 */

import GoogleMapAPI from './google-map-api';
import googleMapStyles from './google-map-api-styles';

// Google init map
function initMap() {
  // eslint-disable-next-line no-unused-vars
  const googleMapAPI = new GoogleMapAPI({
    selectors: {
      map: '.js-map',
      list: {
        panel: '.js-locations-list',
        item: '.js-locations-list-item',
      },
      info: {
        panel: '.js-location-info',
        close: '.js-location-info-close',
      },
      filters: {
        panel: '.js-locations-filters',
        actions: '.js-locations-actions',
        open: '.js-locations-filters-open',
        close: '.js-locations-filters-close',
        reset: '.js-locations-filters-reset',
        submit: '.js-locations-filters-submit',
      },
      search: {
        input: '.js-locations-search-input',
        more: '.js-locations-search-more',
        noResults: '.js-locations-search-no-results',
      },
      zoomNotice: '.js-zoom-notice',
    },
    zoom: {
      init: 16,
      min: 11,
    },
    markerIcons: {
      path: '/static/images/icons/markers/',
      init: 'marker.png',
      selected: 'marker-selected.png',
    },
    center: {
      coords: {
        lat: 46.0504,
        lng: 14.50607,
      },
      overrideWithGeolocation: false,
    },
    styles: googleMapStyles,
    controls: {
      zoom: false,
      mapType: false,
      scale: false,
      streetView: false,
      fullscreen: false,
    },
    fetchLocationsOnBoundsChange: true,
    fetchBelowZoom: 15,
    search: {
      uri: '/api/v1/search',
      uriGeoService: '/services/locations',
      collection: 'locations',
      records: {
        perPage: 18,
        offset: 0,
      },
      queryMinLength: 2,
    },
  });
}

// Google dom listener for init map
if (typeof google === 'object') {
  google.maps.event.addDomListener(window, 'load', initMap);
}
