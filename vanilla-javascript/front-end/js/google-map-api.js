/* global google, debounce */
/* eslint-disable class-methods-use-this */

/**
 * Google map API class
 *
 */

import URI from 'urijs';

if (!Array.from) {
  Array.from = data => Array.prototype.slice.call(data);
}
export default class GoogleMapAPI {
  constructor(config) {
    // Setting config
    this.config = config;

    // Setting uri
    this.uri = new URI();

    // Setting icons
    this.icons = {
      init: `${config.markerIcons.path}${config.markerIcons.init}`,
      selected: `${config.markerIcons.path}${config.markerIcons.selected}`,
    };

    this.locations = [];
    this.mapInstanceCreate();

    this.infoCloseAddListener();
    this.filtersAddListeners();
    this.searchAddListeners();

    this.searchQuerySet();
    this.locationsListGetFromSearchAPI(this.searchQuery, this.config.search.records.offset, this.config.search.records.perPage); // eslint-disable-line max-len
  }

  /**
   * Methods for setting up center of map
   *
   */

  getCenterFromUri() {
    // Check if coords properties really exists in uri
    if (this.uri.hasQuery('gMapCenterLat')
     && this.uri.hasQuery('gMapCenterLng')) {
      const updatedCoords = {
        lat: this.helpers()
          .replaceCommaToDotAndParseToFloat(this.uri.query(true).gMapCenterLat),
        lng: this.helpers()
          .replaceCommaToDotAndParseToFloat(this.uri.query(true).gMapCenterLng),
      };

      this.isMarkerInCenterSelected = true;
      this.map.panTo({ lat: updatedCoords.lat, lng: updatedCoords.lng });
    }
  }

  getCenterFromGeolocation() {
    // If config is overrideWithGeolocation set up and uri config does not prevent it
    if (this.config.center.overrideWithGeolocation
      && !this.uri.query(true).gMapOverrideWithGeolocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const updatedCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          this.map.setCenter(updatedCoords);
        }, () => {
          this.getCenterFromGeolocationHandleError();
        });
      } else {
        this.getCenterFromGeolocationHandleError();
      }
    }
  }

  getCenterFromGeolocationHandleError() {}

  updateCenter() {
    // Methods will check config and uri and act according to its values
    this.getCenterFromGeolocation();
    this.getCenterFromUri();
  }

  /**
   * Methods for map
   *
   */

  mapInstanceCreate() {
    // Gathering data for map
    this.elementMap = document.querySelector(this.config.selectors.map);

    // Creating instance
    this.map = new google.maps.Map(this.elementMap, {
      center: new google.maps.LatLng(this.config.center.coords.lat, this.config.center.coords.lng),
      zoom: this.config.zoom.init,
      minZoom: this.config.zoom.min,
      styles: this.config.styles,
      zoomControl: this.config.controls.zoom,
      mapTypeControl: this.config.controls.mapType,
      scaleControl: this.config.controls.scale,
      streetViewControl: this.config.controls.streetView,
      fullscreenControl: this.config.controls.fullscreen,
    });

    this.updateCenter();
    this.boundsAddListener();
  }

  /**
   * Methods for boundaries
   *
   */

  boundsAddListener() {
    const that = this;

    google.maps.event.addListener(this.map, 'bounds_changed', debounce(function () { // eslint-disable-line func-names
      if (that.config.fetchLocationsOnBoundsChange) {
        // Get bounds, radius and zoom
        that.boundsSet(this.getBounds());
        const radius = that.boundsCalculateRadius();
        const zoomCurrent = that.map.getZoom();

        if (zoomCurrent <= that.config.fetchBelowZoom) {
          that.markersDelete();
          that.zoomNoticeShow();
        } else {
          that.infoClose();
          that.zoomNoticeHide();
          that.locationsGetFromAPI(that.map.getCenter(), radius);
        }
      }
    }, 500));
  }

  boundsSet(coords) {
    this.bounds = {
      latUpperLeft: coords.getSouthWest().lat(),
      lngUpperLeft: coords.getSouthWest().lng(),
      latLowerRight: coords.getNorthEast().lat(),
      lngLowerRight: coords.getNorthEast().lng(),
    };
  }

  boundsCalculateRadius() {
    // Using pythagorean expression
    const distHor = ((this.bounds.latLowerRight - this.bounds.latUpperLeft) / 2) ** 2;
    const distVert = ((this.bounds.lngLowerRight - this.bounds.lngUpperLeft) / 2) ** 2;

    const radius = Math.sqrt(distHor + distVert) * 100000;

    return parseInt(radius, 10);
  }

  /**
   * Methods for locations
   *
   */

  locationsGetFromAPI(coordsCenter, radius) {
    const uriGeoService = new URI(`${window.location.origin}${this.config.search.uriGeoService}/geo-find`);

    // Change url for searching locally
    if (uriGeoService.hostname() === 'localhost') {
      uriGeoService.hostname('127.0.0.1');
      uriGeoService.port('2004');
    }

    const postData = {
      searchQuery: encodeURIComponent(this.searchQuery),
      latitude: coordsCenter.lat(),
      longitude: coordsCenter.lng(),
      radius,
    };

    fetch(uriGeoService.toString(), {
      method: 'POST',
      body: JSON.stringify(postData),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then((locations) => {
        // Only if this.locations has been set already
        if (this.locations.length) {
          this.markersDelete();
        }

        this.locations = locations;
        this.markersSet();

        if (this.isMarkerInCenterSelected) {
          const locationFound = this.markerSingleGet({
            lat: this.helpers().parseFloatToFixed(coordsCenter.lat()),
            lng: this.helpers().parseFloatToFixed(coordsCenter.lng()),
          });

          this.markerSingleSelect(locationFound);
          this.isMarkerInCenterSelected = false;
        }
      })
      .catch(() => {});
  }

  /**
   * Methods for multiple markers
   *
   */

  markersSet() {
    this.locations = this.locations.map((location) => { // eslint-disable-line array-callback-return, consistent-return, max-len
      if (location && location.lat && location.lng) {
        return this.markerSingleSet(location);
      }
    });
  }

  markersReset() {
    this.locations.forEach((location) => {
      this.markerSingleReset(location.marker);
    });
  }

  markersDelete() {
    this.locations.forEach((location) => {
      if (location) {
        location.marker.setMap(null);
      }
    });

    this.locations = [];
  }

  /**
   * Methods for single marker
   *
   */

  markerSingleGet(locationWithMarkerToBeFound) {
    let locationWithMarkerFound;

    this.locations.forEach((location) => {
      // Parse coordinates to fixed 5 decimals, as they have been
      // altered when creating marker by Google maps
      const markerLat = this.helpers().parseFloatToFixed(location.marker.position.lat());
      const markerLng = this.helpers().parseFloatToFixed(location.marker.position.lng());

      if (markerLat === locationWithMarkerToBeFound.lat
       && markerLng === locationWithMarkerToBeFound.lng) {
        locationWithMarkerFound = location;
      }
    });

    return locationWithMarkerFound;
  }

  markerSingleSet(location) {
    const lat = this.helpers().replaceCommaToDotAndParseToFloat(location.lat);
    const lng = this.helpers().replaceCommaToDotAndParseToFloat(location.lng);

    // Deleting coords on location data (they will be in marker already)
    delete location.lat; // eslint-disable-line no-param-reassign
    delete location.lng; // eslint-disable-line no-param-reassign

    // Creating instance of marker
    const marker = new google.maps.Marker({
      position: {
        lat,
        lng,
      },
      icon: this.icons.init,
      map: this.map,
      isSelected: false,
    });

    const locationUpdatedWithMarker = {
      ...location,
      marker,
    };

    // Adding listeners to marker
    this.markerSingleAddListeners(locationUpdatedWithMarker);

    return locationUpdatedWithMarker;
  }

  markerSingleSelect(location) {
    this.isMarkerInCenterSelected = true;

    // Reseting all markers to have init icon
    this.markersReset();

    // Setting marker to have value it is selected and setting icon to selected
    location.marker.isSelected = true; // eslint-disable-line no-param-reassign
    location.marker.setIcon(this.icons.selected);

    // Handle info
    this.infoAddData(location);
    this.infoOpen();
  }

  markerSingleMouseOver(marker) {
    marker.setIcon(this.icons.selected);
  }

  markerSingleMouseOut(marker) {
    // Only change icon if marker is not selected
    if (!marker.isSelected) {
      marker.setIcon(this.icons.init);
    }
  }

  markerSingleReset(marker) {
    marker.isSelected = false; // eslint-disable-line no-param-reassign
    marker.setIcon(this.icons.init);
  }

  markerSinglePanTo(marker) {
    this.map.panTo(marker.position);
  }

  markerSingleAddListeners(location) {
    const listeners = [
      {
        event: 'click',
        method: this.markerSingleSelect,
        bindData: location,
      },
      {
        event: 'mouseover',
        method: this.markerSingleMouseOver,
        bindData: location.marker,
      },
      {
        event: 'mouseout',
        method: this.markerSingleMouseOut,
        bindData: location.marker,
      },
    ];

    listeners.forEach((listener) => {
      google.maps.event.addListener(
        location.marker,
        listener.event,
        listener.method.bind(this, listener.bindData),
      );
    });
  }

  /**
   * Methods for locations list
   *
   */

  locationsListGetFromSearchAPI(query, recordsOffset, recordsPerPage) {
    this.searchNoResultsHide();

    this.elementList = document.querySelector(this.config.selectors.list.panel);
    const uriSearch = new URI(window.location.origin + this.config.search.uri);

    // Change url for searching locally
    if (uriSearch.hostname() === 'localhost') {
      uriSearch.hostname('backpack');
      uriSearch.port('2000');
    }

    // Search records with given search string
    uriSearch.addSearch('q', query.toLowerCase());

    if (recordsOffset >= 0 && recordsPerPage) {
      uriSearch.addSearch('offset', recordsOffset);
      uriSearch.addSearch('records', recordsPerPage);
    }

    return fetch(uriSearch.toString())
      .then(res => res.json())
      .then((data) => {
        if (data.results.collections) {
          this.locationsList = data.results.collections;

          const recordsAll = data.size;
          const recordsShowing = this.listItemsNumberGet() + data.results.collections.length;

          this.listItemsCreate(recordsAll, recordsShowing);
        } else {
          this.searchNoResultsShow();
        }
      })
      .catch(() => {});
  }

  listItemsCreate(recordsAll, recordsShowing) {
    const uriLocation = new URI(window.location.origin + '/api/v1/collections/locations/'); // eslint-disable-line prefer-template

    // Change url for getting locations locally
    if (uriLocation.hostname() === 'localhost') {
      uriLocation.hostname('backpack');
      uriLocation.port('2000');
    }

    this.locationsList.forEach((location, index) => {
      fetch(uriLocation.toString() + location.id) // eslint-disable-line implicit-arrow-linebreak
        .then(res => res.json())
        .then((data) => {
          this.listItemSingleCreate(data.payload, recordsAll, recordsShowing, index);
        })
        .catch(() => {});
    });
  }

  listItemsDelete() {
    this.elementList.innerHTML = '';
  }

  listItemsNumberGet() {
    return this.elementList.childElementCount;
  }

  /**
   * Methods for list single item
   *
   */

  listItemSingleCreate(location, recordsAll, recordsShowing, index) {
    location.lat = this.helpers().replaceCommaToDotAndParseToFloat(location.lat); // eslint-disable-line no-param-reassign, max-len
    location.lng = this.helpers().replaceCommaToDotAndParseToFloat(location.lng); // eslint-disable-line no-param-reassign, max-len

    // Building item html
    const itemClassList = 'locations__list-item';

    const itemHtml = `<li class="${itemClassList} js-locations-list-item">
        <button class="${itemClassList}-button" title="${location.title}">
          <div class="${itemClassList}-image-container">
            <img
              class="${itemClassList}-image"
              src="https://via.placeholder.com/32/ffffff/999999/?text=m" alt="" />
          </div>
          <span>
            <span class="${itemClassList}-title">${location.title}</span>
            <span class="${itemClassList}-address-street">${location.addressStreet}, ${location.addressCity}</span>
          </span>
          <div class="${itemClassList}-icon">
            <svg class="icon icon--open" aria-hidden="true">
              <use xlink:href="/static/images/icons/symbol-defs.svg#icon-open"></use>
            </svg>
          </div>
        </button>
      </li>`;

    // Inserting item html in list
    this.elementList.insertAdjacentHTML('beforeend', itemHtml);

    // Getting last item in list
    const elementList = this.elementList.querySelectorAll(this.config.selectors.list.item);
    const elementItemSingle = elementList[elementList.length - 1];

    // If last list item
    if (this.locationsList.length === index + 1) {
      // Determine if there are more records to show
      if (recordsAll > recordsShowing) {
        this.searchMoreShow();
        this.searchMoreOffsetSet();
      } else {
        this.searchMoreHide();
        this.searchMoreOffsetSet(true);
      }
    }

    // Adding listener for item
    this.listItemSingleAddListener(elementItemSingle, location);
  }

  listItemSingleAddListener(element, location) {
    element.addEventListener('click', (event) => {
      event.preventDefault();

      this.isMarkerInCenterSelected = true;
      this.map.setZoom(this.config.zoom.init);
      this.map.panTo({ lat: location.lat, lng: location.lng });
    });
  }

  /**
   * Methods for zoom notice
   *
   */

  zoomNoticeShow() {
    const elementZoomNotice = document.querySelector(this.config.selectors.zoomNotice);
    elementZoomNotice.classList.remove('-is-hidden');
  }

  zoomNoticeHide() {
    const elementZoomNotice = document.querySelector(this.config.selectors.zoomNotice);
    elementZoomNotice.classList.add('-is-hidden');
  }

  /**
   * Methods for info
   *
   */

  infoAddData(location) {
    const items = [
      {
        selector: '.js-location-info-image',
        key: 'image',
      },
      {
        selector: '.js-location-info-title',
        key: 'title',
      },
      {
        selector: '.js-location-info-category',
        key: 'category',
      },
      {
        selector: '.js-location-info-address-street',
        key: 'addressStreet',
      },
      {
        selector: '.js-location-info-address-city',
        key: 'addressCity',
      },
      {
        selector: '.js-location-info-phone-numbers',
        key: 'phoneNumbers',
      },
      {
        selector: '.js-location-info-href',
        key: 'href',
      },
      {
        selector: '.js-location-info-email',
        key: 'email',
      },
      {
        selector: '.js-location-info-desc',
        key: 'desc',
      },
    ];

    items.forEach((item) => {
      const element = document.querySelector(item.selector);
      const value = location[item.key];

      // If link, set href value
      if (item.key === 'href' || item.key === 'email') {
        if (value) {
          // Output link
          const mailTo = item.key === 'href' ? '' : 'mailto:';
          element.innerHTML = `<a href="${mailTo}${value}" title="${value}" target="_blank" rel="noopener">${value}</a>`;
        } else {
          // Output regular text
          element.innerText = '/';
        }
      // If image, set src value
      } else if (item.key === 'image') {
        element.src = 'https://via.placeholder.com/56/ffffff/999999/?text=m';
      // Phone numbers
      } else if (item.key === 'phoneNumbers') {
        if (value) {
          // Putting numbers in order with comma
          if (value.toString().includes(',')) {
            const phoneNumbers = value.split(',');
            let phoneNumbersWithSeparator = phoneNumbers.map((number) => {
              const numberUpdated = number.trim();
              return numberUpdated;
            });

            phoneNumbersWithSeparator = phoneNumbers.join(', ');
            element.innerText = phoneNumbersWithSeparator;
          } else {
            element.innerText = value;
          }
        } else {
          element.innerText = '/';
        }
      // Other values
      } else if (item.key === 'title'
              || item.key === 'category'
              || item.key === 'addressStreet'
              || item.key === 'addressCity'
              || item.key === 'desc') {
        element.innerText = value || '/';
      }
    });
  }

  infoOpen() {
    const elementInfo = document.querySelector(this.config.selectors.info.panel);
    elementInfo.classList.remove('-is-hidden');
  }

  infoClose() {
    const elementInfo = document.querySelector(this.config.selectors.info.panel);
    elementInfo.classList.add('-is-hidden');
    this.markersReset();
  }

  infoCloseAddListener() {
    const elementInfoClose = document.querySelector(this.config.selectors.info.close);
    elementInfoClose.addEventListener('click', () => {
      this.infoClose();
    });
  }

  /**
   * Methods for filters
   *
   */

  filtersAddListeners() {
    this.filtersOpenAddListener();
    this.filtersCloseAddListener();
    this.filtersResetAddListener();
    this.filtersSubmitAddListener();
  }

  filtersOpen() {
    const elementFilters = document.querySelector(this.config.selectors.filters.panel);
    elementFilters.classList.remove('-is-hidden');
    const elementFiltersActions = document.querySelector(this.config.selectors.filters.actions);
    elementFiltersActions.classList.remove('-is-hidden');

    this.filtersStateGet();
  }

  filtersClose() {
    const elementFilters = document.querySelector(this.config.selectors.filters.panel);
    elementFilters.classList.add('-is-hidden');
    const elementFiltersActions = document.querySelector(this.config.selectors.filters.actions);
    elementFiltersActions.classList.add('-is-hidden');
  }

  filtersStateSet() {
    let elements = document.querySelectorAll('[class*="js-location-category-"]');
    elements = Array.from(elements);

    this.filtersState = [];

    elements.forEach((element) => {
      const { phrase } = element.querySelector('input').dataset;
      const input = element.querySelector('input');

      if (input.checked) {
        this.filtersState.push(phrase);
      }
    });
  }

  filtersStateGet() {
    if (this.filtersState) {
      let elements = document.querySelectorAll('[class*="js-location-category-"]');
      elements = Array.from(elements);

      this.filtersState.forEach((filter) => {
        elements.forEach((element) => {
          const { phrase } = element.querySelector('input').dataset;
          const input = element.querySelector('input');

          if (phrase === filter) {
            input.checked = true;
          }
        });
      });
    }
  }

  filtersReset() {
    this.filtersStateSet();

    let elements = document.querySelectorAll('[class*="js-location-category-"]');
    elements = Array.from(elements);

    elements.forEach((element) => {
      const input = element.querySelector('input');
      input.checked = false;
    });
  }

  filtersSubmit() {
    this.searchQuerySet();
    this.listItemsDelete();
    this.locationsListGetFromSearchAPI(this.searchQuery, this.config.search.records.offset, this.config.search.records.perPage); // eslint-disable-line max-len
    this.filtersStateSet();
    this.filtersClose();
    google.maps.event.trigger(this.map, 'bounds_changed');
  }

  filtersOpenAddListener() {
    const elementFiltersOpen = document.querySelector(this.config.selectors.filters.open);
    elementFiltersOpen.addEventListener('click', () => {
      this.filtersOpen();
    });
  }

  filtersCloseAddListener() {
    const elementFiltersClose = document.querySelector(this.config.selectors.filters.close);
    elementFiltersClose.addEventListener('click', () => {
      this.filtersClose();
    });
  }

  filtersResetAddListener() {
    const elementFiltersReset = document.querySelector(this.config.selectors.filters.reset);
    elementFiltersReset.addEventListener('click', () => {
      this.filtersReset();
    });
  }

  filtersSubmitAddListener() {
    const elementFiltersSubmit = document.querySelector(this.config.selectors.filters.submit);
    elementFiltersSubmit.addEventListener('click', () => {
      this.filtersSubmit();
    });
  }

  /**
   * Methods for search
   *
   */

  searchAddListeners() {
    this.searchInputAddListener();
    this.searchMoreAddListener();
  }

  searchInputAddListener() {
    const elementSearch = document.querySelector(`${this.config.selectors.search.input} input`);

    elementSearch.addEventListener('keyup', debounce(() => {
      this.searchNoResultsHide();
      this.searchMoreHide();
      this.searchMoreOffsetSet(true);

      if (elementSearch.value.length === 0
       || elementSearch.value.length >= this.config.search.queryMinLength) {
        this.searchQuerySet();
        this.listItemsDelete();
        this.locationsListGetFromSearchAPI(this.searchQuery, this.config.search.records.offset, this.config.search.records.perPage); // eslint-disable-line max-len

        google.maps.event.trigger(this.map, 'bounds_changed');
      }
    }, 300));
  }

  searchMoreAddListener() {
    const element = document.querySelector(this.config.selectors.search.more);
    element.addEventListener('click', () => {
      const offsetCurrent = parseInt(element.dataset.offset, 10);
      this.locationsListGetFromSearchAPI(this.searchQuery, offsetCurrent, this.config.search.records.perPage); // eslint-disable-line max-len
    });
  }

  searchMoreOffsetSet(resetToZero) {
    const element = document.querySelector(this.config.selectors.search.more);
    if (resetToZero) {
      element.dataset.offset = 0;
    } else {
      const offsetCurrent = parseInt(element.dataset.offset, 10);
      element.dataset.offset = offsetCurrent + this.config.search.records.perPage;
    }
  }

  searchMoreShow() {
    const element = document.querySelector(this.config.selectors.search.more);
    element.classList.remove('-is-hidden');
  }

  searchMoreHide() {
    const element = document.querySelector(this.config.selectors.search.more);
    element.classList.add('-is-hidden');
  }

  searchNoResultsShow() {
    const element = document.querySelector(this.config.selectors.search.noResults);
    element.classList.remove('-is-hidden');
  }

  searchNoResultsHide() {
    const element = document.querySelector(this.config.selectors.search.noResults);
    element.classList.add('-is-hidden');
  }

  searchQuerySet() {
    // Set collection name
    this.searchQuery = `${this.config.search.collection}`;

    // Get search field value
    const elementInput = document.querySelector(`${this.config.selectors.search.input} input`);

    if (elementInput.value) {
      const parts = elementInput.value.split(' ');
      const that = this;

      parts.forEach((part) => {
        this.searchQuery = `${that.searchQuery} ${part}*`;
      });
    }

    // Get filter options
    let elementsFilter = document.querySelectorAll('[class*="js-location-category-"]');
    elementsFilter = Array.from(elementsFilter);

    const filters = [];
    elementsFilter.forEach((element) => {
      const { phrase } = element.querySelector('input').dataset;
      const input = element.querySelector('input');
      if (input.checked) {
        filters.push(phrase);
      }
    });

    if (filters.length) {
      this.searchQuery = `${this.searchQuery} (${filters.join('|')})`;
    }
  }

  /**
   * Helper methods
   *
   */

  helpers() {
    return {
      replaceCommaToDotAndParseToFloat(value) {
      /* NOTE: If location comes in with coords as string with comma
               e.g. "46,27431", they need to be parsed in right format,
               e.g. 46.27431. If this is the case, specified helper below
               will handle this, otherwise given coords will be used. */

        const comma = ',';
        let valueUpdated = value;

        // If value is not a number already
        if (typeof valueUpdated !== 'number') {
          // If value really contains comma
          if (value.includes(comma)) {
            valueUpdated = value.replace(comma, '.');
          }
        }

        return parseFloat(valueUpdated);
      },
      parseFloatToFixed(value) {
        return parseFloat(value.toFixed(5));
      },
      setUriToUrl() {
        window.history.replaceState(null, null, this.uri);
      },
    };
  }
}
