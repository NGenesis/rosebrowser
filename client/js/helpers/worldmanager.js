'use strict';

// TODO: Do something with ZONE_TABLE, maybe even $.extend(DataTable)
var ZONE_TABLE = {
  NAME: 0, // STR
  FILE: 1, // STR
  START_POS: 2, // STR
  REVIVE_POS: 3, // STR
  IS_UNDERGROUND: 4, // INT
  BG_MUSIC_DAY: 5, // STR
  BG_MUSIC_NIGHT: 6, // STR
  BG_IMAGE: 7, // INT
  MINIMAP_NAME: 8, // STR
  MINIMAP_STARTX: 9, // INT
  MINIMAP_STARTY: 10, // INT
  OBJECT_TABLE: 11, // STR
  CNST_TABLE: 12, // STR
  DAY_CYCLE: 13, // INT
  MORNING_TIME: 14, // INT
  DAY_TIME: 15, // INT
  EVENING_TIME: 16, // INT
  NIGHT_TIME: 17, // INT
  PVP_STATE: 18, // INT
  PLANET_NO: 19, // INT
  TYPE: 20, // INT
  CAMERA_TYPE: 21, // INT
  JOIN_TRIGGER: 22, // STR
  KILL_TRIGGER: 23, // STR
  DEAD_TRIGGER: 24, // STR
  SECTOR_SIZE: 25, // INT
  STRING_ID: 26, // STR
  WEATHER_TYPE: 27, // INT
  PARTY_EXP_A: 28, // INT
  PARTY_EXP_B: 29, // INT
  RIDING_REFUSE_FLAG: 30, // INT
  REVIVE_ZONENO: 31, // INT
  REVIVE_X_POS: 32, // INT
  REVIVE_Y_POS: 33 // INT
};

function WorldManager() {
  this.rootObj = new THREE.Object3D();
  this.cnstModelMgr = null;
  this.decoModelMgr = null;
  this.basePath = null;
  this.textures = [];
  this.shaderMaterial = new THREE.ShaderMaterial({
    uniforms: [],
    vertexShader:   document.getElementById( 'terrainVertexShader' ).textContent,
    fragmentShader: document.getElementById( 'terrainFragmentShader' ).textContent
  });
}

WorldManager.prototype._loadChunkTerrain = function(chunkX, chunkY, callback) {
  var himPath = this.basePath + chunkX + '_' + chunkY + '.HIM';
  var tilPath = this.basePath + chunkX + '_' + chunkY + '.TIL';
  var self = this;

  Tilemap.load(tilPath, function(tilemap) {
    Heightmap.load(himPath, function (heightmap) {
      var geom = new THREE.Geometry();

      for (var vy = 0; vy < 65; ++vy) {
        for (var vx = 0; vx < 65; ++vx) {
          geom.vertices.push(new THREE.Vector3(
            vx * 2.5,
            vy * 2.5,
            heightmap.map[(64 - vy) * 65 + (vx)] * ZZ_SCALE_IN
          ));
        }
      }

      geom.materials = [];

      // TODO: Brett you can clean up this mess thx
      function getGeometryMaterialIndex(tile) {
        var texid1 = tile.layer1 + tile.offset1;
        var texid2 = tile.layer2 + tile.offset2;
        var tex1 = self.textures[tile.layer1 + tile.offset1];
        var tex2 = self.textures[tile.layer2 + tile.offset2];

        for (var m = 0; m < geom.materials.length; ++m) {
          var mat = geom.materials[m];
          if (mat.uniforms.texture1.value === tex1 && mat.uniforms.texture2.value === tex2) {
            return m;
          }
        }

        var mat = self.shaderMaterial.clone();

        mat.uniforms = {
          texture1: { type: 't', value: tex1 },
          texture2: { type: 't', value: tex2 }
        };

        geom.materials.push(mat);
        return geom.materials.length - 1;
      }

      function rotateUV(tile, uv) {
        switch(tile.rotation) {
          case Zone.TILE_ROTATION.FLIP_HORIZONTAL:
            uv.x = 1.0 - uv.x;
            break;
          case Zone.TILE_ROTATION.FLIP_VERTICAL:
            uv.y = 1.0 - uv.y;
            break;
          case Zone.TILE_ROTATION.FLIP_BOTH:
            uv.x = 1.0 - uv.x;
            uv.y = 1.0 - uv.y;
            break;
          case Zone.TILE_ROTATION.CLOCKWISE_90:
            var tmp = uv.x;
            uv.x = uv.y;
            uv.y = tmp;
            break;
          case Zone.TILE_ROTATION.COUNTER_CLOCKWISE_90:
            var tmp = uv.x;
            uv.x = uv.y;
            uv.y = 1.0 - tmp;
            break;
        }
        return uv;
      }

      geom.faceVertexUvs[0] = [];
      geom.faceVertexUvs[1] = [];

      for (var fy = 0; fy < 64; ++fy) {
        for (var fx = 0; fx < 64; ++fx) {
          var v1 = (fy + 0) * 65 + (fx + 0);
          var v2 = (fy + 0) * 65 + (fx + 1);
          var v3 = (fy + 1) * 65 + (fx + 0);
          var v4 = (fy + 1) * 65 + (fx + 1);
          var uv1 = new THREE.Vector2(((fx % 4) + 0) / 4, 1.0 - ((fy % 4) + 0) / 4);
          var uv2 = new THREE.Vector2(((fx % 4) + 1) / 4, 1.0 - ((fy % 4) + 0) / 4);
          var uv3 = new THREE.Vector2(((fx % 4) + 0) / 4, 1.0 - ((fy % 4) + 1) / 4);
          var uv4 = new THREE.Vector2(((fx % 4) + 1) / 4, 1.0 - ((fy % 4) + 1) / 4);

          var idx  = (15 - Math.floor(fy / 4)) * 16 + Math.floor(fx / 4);
          var tile = self.zoneInfo.tiles[tilemap.map[idx].number];
          var matIndex = getGeometryMaterialIndex(tile);

          var f1 = new THREE.Face3(v1, v2, v3);
          var f2 = new THREE.Face3(v4, v3, v2);
          f1.materialIndex = matIndex;
          f2.materialIndex = matIndex;

          geom.faces.push(f1);
          geom.faces.push(f2);
          geom.faceVertexUvs[0].push([uv1, uv2, uv3]);
          geom.faceVertexUvs[0].push([uv4, uv3, uv2]);

          uv1 = rotateUV(tile, uv1);
          uv2 = rotateUV(tile, uv2);
          uv3 = rotateUV(tile, uv3);
          uv4 = rotateUV(tile, uv4);
          geom.faceVertexUvs[1].push([uv1, uv2, uv3]);
          geom.faceVertexUvs[1].push([uv4, uv3, uv2]);
        }
      }

      geom.computeBoundingSphere();
      geom.computeBoundingBox();
      geom.computeFaceNormals();
      geom.computeVertexNormals();

      callback(geom);
    });
  });
};

WorldManager.prototype._loadChunkObjectGroup = function(objList, modelList) {
  for (var i = 0; i < objList.length; ++i) {
    var objData = objList[i];
    var obj = modelList.createForStatic(objData.objectId);
    obj.position.copy(objData.position);
    obj.quaternion.copy(objData.rotation);
    obj.scale.copy(objData.scale);
    obj.updateMatrix();
    obj.matrixAutoUpdate = false;
    this.rootObj.add(obj);
  }
};

WorldManager.prototype._loadChunkObjects = function(chunkX, chunkY, callback) {
  var self = this;
  var ifoPath = this.basePath + chunkX + '_' + chunkY + '.IFO';
  MapInfo.load(ifoPath, function(ifoData) {
    self._loadChunkObjectGroup(ifoData.objects, self.decoModelMgr);
    self._loadChunkObjectGroup(ifoData.buildings, self.cnstModelMgr);

    if (callback) {
      callback();
    }
  });
};

WorldManager.prototype._loadChunk = function(chunkX, chunkY, callback) {
  var self = this;

  this._loadChunkTerrain(chunkX, chunkY, function(geom) {
    var material = new THREE.MeshFaceMaterial( geom.materials );
    var chunkMesh = new THREE.Mesh(geom, material);
    chunkMesh.position.x = (chunkX - 32) * 160 - 80;
    chunkMesh.position.y = (32 - chunkY) * 160 - 80;
    self.rootObj.add(chunkMesh);

    if (callback) {
      callback();
    }
  });
  //this._loadChunkObjects(chunkX, chunkY);
};

WorldManager.prototype.setMap = function(mapIdx, callback) {
  var self = this;
  self.textures = [];

  GDM.get('list_zone', function (zoneTable)
  {
    var mapRow = zoneTable.rows[mapIdx];

    var lastPathSlash = mapRow[ZONE_TABLE.FILE].lastIndexOf('\\');
    self.basePath = mapRow[ZONE_TABLE.FILE].substr(0, lastPathSlash + 1);

    // TODO: Cleanup MAP_BOUNDS, this is nasty. Probably can use REGEX for clean
    var boundsName = self.basePath.toUpperCase();
    boundsName = boundsName.substr("3DDATA\\MAPS\\".length);
    boundsName = boundsName.substr(0, boundsName.length - 1);
    boundsName = boundsName.replace('\\', '/');
    var chunkBounds = MAP_BOUNDS[boundsName];

    Zone.load(mapRow[ZONE_TABLE.FILE], function(zone) {

      self.zoneInfo = zone;

      for (var i = 0; i < zone.textures.length; ++i) {
        // Why ROSE, why?
        if (zone.textures[i] === 'end') {
          break;
        }

        self.textures[i] = RoseTextureManager.load(zone.textures[i]);
      }

      ModelList.load(mapRow[ZONE_TABLE.CNST_TABLE], function(cnstData) {
        ModelList.load(mapRow[ZONE_TABLE.OBJECT_TABLE], function (decoData) {
          self.cnstModelMgr = new ModelListManager(cnstData);
          self.decoModelMgr = new ModelListManager(decoData);

          var chunkSX = chunkBounds[0][0];
          var chunkEX = chunkBounds[0][1];
          var chunkSY = chunkBounds[1][0];
          var chunkEY = chunkBounds[1][1];

          for (var iy = chunkSY; iy <= chunkEY; ++iy) {
            for (var ix = chunkSX; ix <= chunkEX; ++ix) {
              self._loadChunk(ix, iy);
            }
          }

          callback();
        });
      });
    });
  });
};