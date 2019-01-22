import { Router } from 'express';
import util from 'util';

import redis from 'redis';
import georedis from 'georedis';
import fetch from 'node-fetch';

// it will load the right one based on .env NODE_ENV setting
require('dotenv').config()
let config = require('config');

const hostBP = config.backpack.host;
const portBP = config.backpack.port;

const hostBPservice = config.service.host;
const portBPservice = config.service.port;

const path = '/api/v1/collections/locations';

export default () => {
  const api = Router();

  // Redis connection
  const client = redis.createClient(config.redis.port, config.redis.host);

  client.on('error', (err) => {
    util.log(`Error occurred: ${err}`);
  });

  // Geo redis
  const geo = georedis.initialize(client);

  // Setting locations in geo redis index
  function locationsGeoReindex(res, locations) {
    let locationsTotal = 0;

    locations.forEach((location, index) => {
      if (location.payload.lat && location.payload.lng) {
        geo.addLocation(location.id, {
          latitude: location.payload.lat,
          longitude: location.payload.lng,
        }, (err) => {
          if (err) {
            res.write(err.toString());
          } else {
            locationsTotal += 1;
            res.write(`Adding location: ${location.payload.title}\n`);

            if (index + 1 === locations.length) {
              res.write(`\n\nTotal added: ${locationsTotal}`);
              res.end();
            }
          }
        });
      }
    });
  }

  // Get all locations from API endpoint
  function locationsGetAllFromAPI(res, callback) {
    const url = `http://${hostBP}:${portBP}${path}`;

    fetch(url)
      .then(response => response.json())
      .then((response) => {
        const locations = response.items;
        callback(locationsGeoReindex(res, locations));
      }).catch((err) => {
        util.log(err);
      });
  }

  // Reindex all locations in geo redis
  api.get('/geo-reindex', (req, res) => {
    locationsGetAllFromAPI(res, (locations) => {
      locationsGeoReindex.bind(this, res, locations);
    });
  });

  // Find locations in geo redis by center coords and range
  api.post('/geo-find', (req, res) => {
    const payload = req.body;

    const options = {
      count: 100,
    };

    if (payload.latitude && payload.longitude && payload.radius) {
      geo.nearby({
        latitude: payload.latitude,
        longitude: payload.longitude,
      }, payload.radius, options, (err, locationIdsFromGeo) => {
        if (err) {
          res.json([]).end();
        } else {
          // Get locations within current search params (if any)
          // NOTE: using 10.000 records to get them 'all'
          const url = `http://${hostBP}:${portBP}/api/v1/search?q=${payload.searchQuery}&offset=0&records=10000`;

          fetch(url)
            .then(resSearch => resSearch.json())
            .then((resSearch) => {
              const locationIdsFromSearch = [];

              if (resSearch.results.collections) {
                resSearch.results.collections.forEach((location) => {
                  locationIdsFromSearch.push(location.id);
                });
              }

              // Get intersect of geo and search locations
              const locationIds = locationIdsFromSearch.filter(Set.prototype.has, new Set(locationIdsFromGeo)); // eslint-disable-line max-len

              // Get data of all intersected locations
              Promise.all(locationIds.map((id) => {
                const urlLoc = `http://${hostBP}:${portBP}/api/v1/collections/locations/${id}`;

                return fetch(urlLoc)
                  .then(resLoc => resLoc.json())
                  .then(location => location.payload)
                  .catch((errLoc) => {
                    util.log(errLoc);
                  });
              }))
                .then((data) => {
                  // Remove object with same lat
                  let dataUpdated = data.filter((obj, pos, arr) => { // eslint-disable-line
                    return arr.map((mapObj) => { // eslint-disable-line
                      if (mapObj && mapObj.lat) {
                        return mapObj.lat;
                      }
                    }).indexOf((obj && obj.lat) ? obj.lat : null) === pos;
                  });

                  // Remove object with same lng
                  dataUpdated = data.filter((obj, pos, arr) => { // eslint-disable-line
                    return arr.map((mapObj) => { // eslint-disable-line
                      if (mapObj && mapObj.lng) {
                        return mapObj.lng;
                      }
                    }).indexOf((obj && obj.lng) ? obj.lng : null) === pos;
                  });

                  res.json(dataUpdated);
                  res.end();
                })
                .catch((errAll) => {
                  util.log(errAll);
                  res.end();
                });
            })
            .catch();
        }
      });
    } else {
      res.end('No proper data sent.');
    }
  });

  return api;
};
