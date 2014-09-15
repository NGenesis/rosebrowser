'use strict';

var fs = require('fs');
var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config.yml');

if (!config.data || !config.data.local) {
  console.log('You need a proper config with local specified!');
  process.exit(0);
}

var bounds = {};
var mapsDir = config.data.local + '3ddata/maps';

var planets = fs.readdirSync(mapsDir);

for (var i = 0; i < planets.length; ++i) {
  var planet = planets[i];
  var planetDir = mapsDir + '/' + planet;

  var maps = fs.readdirSync(planetDir);

  for (var j = 0; j < maps.length; ++j) {
    var map = maps[j];
    var mapDir = planetDir + '/' + map;

    var files =  fs.readdirSync(mapDir);
    var minX = 64, maxX = 0;
    var minY = 64, maxY = 0;

    for (var k = 0; k < files.length; ++k)  {
      var file = files[k];
      var match = file.match(/([0-9]*)_([0-9]*).HIM/i);

      if (match) {
        minX = Math.min(minX, +match[1]);
        maxX = Math.max(maxX, +match[1]);
        minY = Math.min(minY, +match[2]);
        maxY = Math.max(maxY, +match[2]);
      }
    }

    var name = planet + '/' + map;
    bounds[name.toUpperCase()] = [[minX, maxX], [minY, maxY]];
  }
}

var comment = '// This file was auto-generated by mapbounds.js, do not edit directly\n';
var data = 'var MAP_BOUNDS = ' + JSON.stringify(bounds, null, 2) + ';\n';
fs.writeFileSync('client/js/helpers/mapbounds.js', comment + data);
