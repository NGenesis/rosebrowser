'use strict';

ui.PartyDialog = function(template, party) {
  ui.Dialog.call(this, template);

  this._level = ui.label(this, '.label.level');
  this._xp = ui.progressbar(this, '.progressbar.exp');
  this._members = ui.list(this, '.list.members');
  this._memberList = [];

  this.centerY();
  this.alignRightEdge(50);

  this._data = party;
  this._data.on('changed', this._update.bind(this));
  this._update();
}

ui.PartyDialog.prototype = Object.create(ui.Dialog.prototype);

ui.PartyDialog.prototype._update = function() {
  if (!this._data.exists) {
    this.hide();
    return;
  }

  this.show();

  this._level.text('Level: ' + this._data.level);
  this._xp.max(PartyData.getLevelMaxXP(this._data.level));
  this._xp.value(this._data.xp);

  if (this._members.length !== this._data.members.length) {
    this._members.clear();
    this._memberList = [];

    for (var i = 0; i < this._data.members.length; ++i) {
      var partyMember = ui.partymember();
      this._memberList.push(partyMember);
      this._members.append(partyMember);
    }
  }

  for (var i = 0; i < this._data.members.length; ++i) {
    this._memberList[i].setMember(this._data.members[i]);
  }

  this.centerY();
  this.alignRightEdge(50);
};

ui.partyDialog = function(party) {
  return new ui.PartyDialog('#dlgParty', party);
};

ui.PartyMember = function(element) {
  ui.Widget.call(this, element);

  this._name = ui.label('.name.flex-fill');
  this._hp = ui.progressbar('.health.absolute');
  this.append(this._name);
  this.append(this._hp);

  this._member = null;
  this._update();
};

ui.PartyMember.prototype = Object.create(ui.Widget.prototype);

ui.PartyMember.prototype.setMember = function(member) {
  this._member = member;
  this._update();
};

ui.PartyMember.prototype._update = function() {
  if (!this._member) {
    return;
  }

  this._name.text(this._member.name);
  this._hp.max(this._member.maxHP);
  this._hp.value(this._member.hp);
};

ui.partymember = ui.widgetConstructor('partymember', ui.PartyMember);
