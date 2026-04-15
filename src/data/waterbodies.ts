import { AOI } from '../types';

export const PREDEFINED_WATERBODIES: { name: string; aoi: AOI }[] = [
  {
    name: 'Lake Tahoe, USA',
    aoi: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-120.14, 38.94],
          [-119.93, 38.94],
          [-119.93, 39.23],
          [-120.14, 39.23],
          [-120.14, 38.94]
        ]]
      },
      properties: { area: 490000000 }
    }
  },
  {
    name: 'Lake Geneva, Switzerland',
    aoi: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [6.14, 46.20],
          [6.92, 46.20],
          [6.92, 46.45],
          [6.14, 46.45],
          [6.14, 46.20]
        ]]
      },
      properties: { area: 580000000 }
    }
  },
  {
    name: 'Lake Victoria, Africa',
    aoi: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [31.6, -2.8],
          [34.2, -2.8],
          [34.2, 0.4],
          [31.6, 0.4],
          [31.6, -2.8]
        ]]
      },
      properties: { area: 59947000000 }
    }
  },
  {
    name: 'San Francisco Bay, USA',
    aoi: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.5, 37.4],
          [-122.0, 37.4],
          [-122.0, 38.1],
          [-122.5, 38.1],
          [-122.5, 37.4]
        ]]
      },
      properties: { area: 1000000000 }
    }
  }
];
