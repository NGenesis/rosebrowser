'use strict';

function GameState() {
  this.worldMgr = new WorldManager();
  this.worldMgr.rootObj.position.set(5200, 5200, 0);
  this.gomMgr = new GOMVisManager(this.worldMgr);
  this.activeMapIdx = -1;
  this.mcPawnRoot = new THREE.Object3D();

  this.pickPosH = new THREE.AxisHelper(2);
}

GameState.prototype.setMap = function(mapIdx) {
  this.activeMapIdx = mapIdx;
};

GameState.prototype.prepare = function(callback) {
  this.mapSwitchPrep(callback);
};

/**
 * This is used for initial login as well as map switch.
 * @param callback
 */
GameState.prototype.mapSwitchPrep = function(callback) {
  this.worldMgr.setMap(this.activeMapIdx, function() {
    callback();
  });
};

GameState.prototype.update = function(delta) {
  GOM.update(delta);

  this.mcPawnRoot.position.copy(MC.position);
  this.worldMgr.setViewerInfo(MC.position);
  this.worldMgr.update(delta);
  this.gomMgr.update(delta);
};

GameState.prototype.debugPrintScene = function() {
  function _printThis(obj) {
    var out = '';
    out += 'OBJ';
    out += '[' + obj.name + ']';
    out += ' @ ' + obj.position.x + ',' + obj.position.y + ',' + obj.position.z;

    console.groupCollapsed(out);
    for (var j = 0; j < obj.children.length; ++j) {
      _printThis(obj.children[j]);
    }
    console.groupEnd();
  }
  _printThis(scene);
};

GameState.prototype.enter = function() {
  debugGui.add(this, 'debugPrintScene');

  this.worldMgr.addToScene();
  this.gomMgr.addToScene();

  var mcPawn = this.gomMgr.findByObject(MC);

  // Some of this will need to be moved to a place thats used when you
  //  switch maps as well...
  camera.lookAt(0, 0, 0);
  camera.position.set(4, 4, 4);
  this.mcPawnRoot.add(camera);
  scene.add(this.mcPawnRoot);

  this.pickPosH.position.copy(MC.position);
  scene.add(this.pickPosH);

  var controls = new THREE.OrbitControls(camera);
  controls.damping = 0.2;

  netGame.joinZone(MC.position.z, function() {
    console.log('ZONE JOINED');
  });

  var projector = new THREE.Projector();
  var self = this;
  InputManager.on('mousedown', function(e) {
    e.preventDefault();

    if ( event.button !== 0 ) {
      return;
    }

    var mouse = new THREE.Vector3(0, 0, 0.5);
    mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
    projector.unprojectVector( mouse, camera );

    var cameraPos = camera.localToWorld(new THREE.Vector3(0,0,0));
    var ray = new THREE.Raycaster(cameraPos, mouse.sub( cameraPos ).normalize());
    //var octreeObjects = self.worldMgr.octree.search( ray.ray.origin, ray.ray.far, true, ray.ray.direction );
    var inters = ray.intersectObjects( self.worldMgr.terChunks );
    if (inters.length > 0) {
      var moveToPos = inters[0].point;
      MC.moveTo(moveToPos.x, moveToPos.y);
      self.pickPosH.position.copy(moveToPos);
    }
  }, false );
};

GameState.prototype.leave = function() {
  scene.remove(this.worldMgr.rootObj);
};

var gsGame = new GameState();
