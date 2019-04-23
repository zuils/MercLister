getCookies();
var tooltip = document.querySelectorAll('.ttip');
document.addEventListener('mousemove', fn, false);
function fn(e) {
	for (var i = tooltip.length; i--;) {
		tooltip[i].style.left = e.pageX + 'px';
		tooltip[i].style.top = e.pageY + 'px';
	}
}

function readSave() {
	var txt = document.getElementById("savegame").value;
	if (txt.indexOf("Fe12NAfA3R6z4k0z") > -1 || txt.substring(0, 32) == "7a990d405d2c6fb93aa8fbb0ec1a3b23") {
		document.getElementById("alive").innerHTML = "Decoding...";
    if (txt.substring(0, 32) == "7a990d405d2c6fb93aa8fbb0ec1a3b23") {
      var pako = window.pako;
      var data = JSON.parse(pako.inflate(atob(txt.substring(32)), {to: 'string'}));
    }
    else {
      var result = txt.split("Fe12NAfA3R6z4k0z");
      txt = "";
      for (var i = 0; i < result[0].length; i += 2)
        txt += result[0][i];
      var data = JSON.parse(atob(txt));
    }
    clearInterval(window.timer);
		setCookies();
		var numTTDs = document.getElementById("numTTDs").value;
		var showDays = document.getElementById("showDays").checked;
		var showTTD = document.getElementById("showTTD").checked;
		alive(data, showTTD, numTTDs, showDays, document.getElementById("updateTime").checked);
		quest(data, document.getElementById("inputQuests").value, document.getElementById("sortQuests").checked);
		mercs(data.mercenaries.mercRoller.seed, document.getElementById("inputMercs").value, showTTD, showDays, document.getElementById("showMercTTDs").checked, numTTDs);
	}
	else if (txt)
		document.getElementById("alive").innerHTML = "Not a valid save, try again.";
}

function randNum(seed) {
	return (seed * 16807) % 2147483647;
}

function secToString(s, showDays) {
	var d = 0, h = 0, m = 0;
	var str = '';
	if (s < 0)
		s = 0;
	s = Math.round(s);
	if (s >= 86400 && showDays) {
		d = Math.floor(s / 86400);
		s -= d * 86400;
		str += '<b>' + d + '</b>-';
	}
	if (s >= 3600) {
		h = Math.floor(s / 3600);
		s -= h * 3600;
		str += h < 10 ? '0' + h + ':' : h + ':';
	}
	if (h == 0 && d)
		str += '00:';
	if (s >= 60) {
		m = Math.floor(s / 60);
		s -= m * 60;
		str += m < 10 ? '0' + m + ':' : m + ':';
	}
	if (m == 0)
		str += '00:';
	if (s < 10)
		str += '0';
	str += s;
	return str;
}

function alive(data, showTTD, numTTDs, showDays, updateTime) {
	var QA = getQA(data);
	var rarityMulitpliers = [,0.5, 0.75, 1, 2, 5, 20, 50, 200];
	var bonusTypes = [,"Gold", "HS", "Rubies", "Skills", "Lives", "Recruitment"];
	var rarities = [,"Common", "Uncommon", "Rare", "Epic", "Fabled", "Mythical", "Legendary", "Transcendent"];
	var rarityColors = [,"DDDDDD", "#1EFF00", "#0080FF", "#B048F8", "#77FF77", "#BBBBFF", "#FFFF00", "#FF00FF"]
	var output = "";
	var mercs = data.mercenaries.mercenaries;
	// sort by createTime
	var temp = {};
	for (var i in mercs) {
		for (var j in mercs) {
			if (mercs[i].createTime < mercs[j].createTime && j < i) {
				temp = mercs[i];
				mercs[i] = mercs[j];
				mercs[j] = temp;
			}
		}
		if (!headersDone) {
			var headersDone = 1;
			output += '<table class="striped"><tr><th>Lvl</th><th>Name</th><th class="tsource">Current<span class="ttip">Time remaining on the current quest (' + (showDays ? 'd-' : '') + 'hh:mm:ss)</span></th>';
			if (showTTD)
				output += '<th class="tsource">TTD<span class="ttip">Quest time remaining before the mercenary dies (' + (showDays ? 'd-' : '') + 'hh:mm:ss)</span></th>';
			if (showTTD && !numTTDs) {
				output += "<th class='tsource'>0<span class='ttip'>If your merc dies before finishing their next quest this would be their new TTD after being revived</span></th>";
			}
			else if (showTTD)
				for (var j = 0; j < numTTDs; j++) { 
					output += "<th class='tsource'>" + j + "<span class='ttip'>If your merc dies after " + j + " seed change" + (j == 1 ? "" : "s") + " this would be their new TTD after being revived</span></th>";
				};
			output += '</tr>';
		}
	}
	for (var i in mercs) {
		// level + xp, tooltip: rubies on revive
		var lvlTooltip = Math.ceil(Math.pow(1.5, mercs[i].level) + 10) + ' rubies to revive';
		if (mercs[i].questResult == 0 && mercs[i].lastQuestDuration) {
			var newLvl = mercs[i].level + Number(mercs[i].experience) + mercs[i].lastQuestDuration / 86400;
			lvlTooltip += '<br>@' + newLvl.toFixed(2) + ': ' + Math.ceil(Math.pow(1.5, Math.floor(newLvl)) + 10) + ' rubies';
		}
		output += '<tr><td class="tsource">' + (mercs[i].level + mercs[i].experience).toFixed(2) + '<span class="ttip">' + lvlTooltip + '</span></td>';

		// name, tooltip: rarity type/bonus
		output += '<td class="tsource">' + mercs[i].name + '<span class="ttip"><font class="shadow5" color=' + rarityColors[mercs[i].rarity] + '>' + rarities[mercs[i].rarity] + '</font><br>' + (mercs[i].statId == 5 ? 'Extra Lives: ' + mercs[i].bonusLives : '+' + Math.round(rarityMulitpliers[mercs[i].rarity] * 10) + '% ' + bonusTypes[mercs[i].statId]) + '</span></td>';
		// current quest, tooltip: reward
		output += '<td class="tsource" style="text-align:right"><a class="current">' + secToString(mercs[i].lastQuestDuration - Math.min(mercs[i].timeToDie, Math.round((data.unixTimestamp - mercs[i].lastQuestStartTime) / 1000)), showDays) + '</a><span style="text-align:center" class="ttip">' + getCurrentRewardStr(mercs[i], QA) + '</span></td>';
		if (showTTD) {
			// TTD
			output += '<td class="TTD" style="text-align:right">' + secToString(mercs[i].timeToDie - Math.min(mercs[i].lastQuestDuration, (mercs[i].lastQuestStartTime ? (Math.round((data.unixTimestamp - mercs[i].lastQuestStartTime) / 1000)) : 0 )), showDays) + '</td>';
			var seed = mercs[i].roller.seed;
			// numbered columns
			var k = numTTDs == "" ? 1 : numTTDs;
			if (mercs[i].questResult > 0) { // dying on current quest
				if (k != 0)
					output += '<td style="text-align:right">' + secToString(getReviveTTD(seed, mercs[i].lastQuestDuration) - mercs[i].questResult, showDays) + '</td>';
				for (var j = 1; j < k; j++)
					output += '<td></td>';
			}
			else { // not going to die on current quest
				for (var j = 0; j < k; j++) { 
					output += '<td style="text-align:right">' + secToString(getReviveTTD(seed), showDays) + '</td>';
					seed = randNum(seed);
				}
			}
		}
		output += '</tr>';
	}
	if (output != "")
		output += '</table><br>';
	document.getElementById("alive").innerHTML = output;
	tooltip = document.querySelectorAll('.ttip');
	// updating current/ttd columns once per second
	if (updateTime) {
		var currentElements = document.querySelectorAll('.current');
		var TTDElements = document.querySelectorAll('.TTD');
		window.timer = setInterval(function() { currentTTDUpdate(mercs, showTTD, showDays, currentElements, TTDElements) }, 1000)
		function currentTTDUpdate(mercs, showTTD, showDays, currentElements, TTDElements) {		
			var j = 0;
			for (var i in mercs) {
				currentElements[j].innerHTML = secToString(mercs[i].lastQuestDuration - Math.min(mercs[i].timeToDie, Math.round((Date.now() - mercs[i].lastQuestStartTime) / 1000)), showDays);
				if (showTTD)
					TTDElements[j].innerHTML = secToString(mercs[i].timeToDie - Math.min(mercs[i].lastQuestDuration, (mercs[i].lastQuestStartTime ? (Math.round((Date.now() - mercs[i].lastQuestStartTime) / 1000)) : 0 )), showDays);
				j++;
			}
		}
	}
}
/*
            case 3:
               _loc8_ = this.getTotalSoulReward(this.lastQuestRewardQty);
               _loc9_ = _loc8_.floor();
               _loc10_ = _loc8_.subtract(_loc9_).numberValue();
               if(this.roller.randFloat() < _loc10_)
               {
                  _loc9_ = _loc9_.add(new BigNumber(1));
               }
               if(_loc9_.gteN(1))
               {
                  _loc1_.primalSouls = _loc1_.primalSouls.add(_loc9_);
               }
               _loc1_.heroSoulQuestsCompleted++;
               _loc4_ = Boolean(_loc9_.gtN(0));
               _loc3_.description = _("+%s %s",BigNumberFormatter.shortenNumber(_loc9_),_loc5_);
               break;


      public function getTotalSoulReward(param1:Number) : BigNumber
      {
         var _loc2_:UserData = CurrentUser.instance as UserData;
         var _loc3_:BigNumber = new BigNumber(param1);
         var _loc4_:BigNumber = _loc2_.getPurchaseAscensionHeroSouls().multiply(_loc3_);
         if(this.statId == BONUS_SOULS)
         {
            _loc4_ = _loc4_.multiply(new BigNumber(this.level * (1 + stats[BONUS_SOULS]["baseValue"] * rarities[this.rarity]["multiplier"])));
         }
         else
         {
            _loc4_ = _loc4_.multiply(new BigNumber(this.level));
         }
         return _loc4_;
      }
*/

function getCurrentRewardStr(merc, QA) {
	var rarityMulitpliers = [, 0.5, 0.75, 1, 2, 5, 20, 50, 200];
	var str = '';
	var seed = merc.questResult ? getSeedAfterRevive(merc.roller.seed) : merc.roller.seed;
	var reward = (merc.lastQuestRewardQty ? merc.lastQuestRewardQty : merc.lastQuestGoldRewardQty) * merc.level;
	switch (merc.lastQuestRewardType) {
		case 0: // not started
			str = 'no quest started';
			break;
		case 1: // recruitment
			str = '1 recruit';
			break;
		case 2: // gold
			if (merc.statId == 1) // bonus gold
				reward *= 1 + 0.1 * rarityMulitpliers[merc.rarity];
			str = (reward / 8).toFixed(2) + ' timelapse' + (reward == 8 ? '' : 's') + ' worth of gold';
			break;
		case 3: // hs
			if (merc.statId == 2) // bonus hs
				reward *= 1 + 0.1 * rarityMulitpliers[merc.rarity];
			str = (reward * 100).toFixed(2) + '% of QA'; // (' 
			/*
			reward *= QA;
			reward = randNum(seed) / 2147483646 < reward - Math.floor(reward) ? Math.floor(reward) + 1 : Math.floor(reward);
			str += reward + ' hero soul' + (reward == 1 ? ')' : 's)');
			*/
			break;
		case 4: // relics (no bonus relic types)
			reward = randNum(seed) / 2147483646 < reward - Math.floor(reward) ? Math.floor(reward) + 1 : Math.floor(reward);
			str = reward + ' relic' + (reward == 1 ? '' : 's');
			break;
		case 5: // skills
			if (merc.statId == 4) // bonus skills
				reward *= 1 + 0.1 * rarityMulitpliers[merc.rarity];
			reward = Math.min(9, reward);
			reward = randNum(seed) / 2147483646 < reward - Math.floor(reward) ? Math.floor(reward) + 1 : Math.floor(reward);
			str = reward + ' skill activation' + (reward == 1 ? '' : 's');
			break;
		case 6: // rubies
			if (merc.statId == 3) // bonus rubies
				reward *= 1 + 0.1 * rarityMulitpliers[merc.rarity];
			reward = randNum(seed) / 2147483646 < reward - Math.floor(reward) ? Math.floor(reward) + 1 : Math.floor(reward);
			str = reward + (reward == 1 ? ' ruby' : ' rubies');
			break;
	}
	if (merc.lastQuestDuration > merc.timeToDie)
		str += '<br>' + merc.phrase2;
	return str;
}

function quest(data, num, sortQuests) {
	var QA = getQA(data);
	var output = "";
	var seed = data.mercenaries.questRoller.seed;
	var durations = [, "5m", "15m", "30m", "1h", "2h", "4h", "8h", "24h", "48h"];
	var rewardTypes = [, "Recruitment", "Gold", "HS", "Relics", "Skills", "Rubies"];
	var markTypes = ["mGold","mHS","mRubies","mSkills","mRelics"];
	var marks = {};
	for (var i in markTypes)
		marks[markTypes[i]] = document.getElementById(markTypes[i]).checked;
	var questOptions = {0:{},1:{},2:{},3:{}};
	var temp = {};
	for (var i = 0; i < num; i++) {
		if (i == 0)
			output += '<table class="striped">';
		output += '<tr><td>' + (i + 1) + '</td>';
		for (var j = 0; j < 4; j++) {
			if (data.mercenaries.questOptions.hasOwnProperty(0) && i == 0) { // read quest options
				questOptions[j].durationId = data.mercenaries.questOptions[j].durationId;
				questOptions[j].rewardType = data.mercenaries.questOptions[j].rewardType;
			}
			else if (i == 0 && j == 0 && getMercenaryCount(data.mercenaries.mercenaries) < 5) {
				questOptions[j].durationId = 7;
				questOptions[j].rewardType = 1;
			}
			else { // get future quest options
				seed = randNum(seed);
				questOptions[j].durationId = seed % 9 + 1; // choosing between 5 mins - 2 days
				seed = randNum(seed);
				questOptions[j].rewardType = seed % 5 + 2; // choosing between gold - rubies
			}
		}
		// sort by durationID
		if (sortQuests) {
			var k = questOptions[0].rewardType == 1 ? 1 : 0;
			for (var j = k; j < 4; j++) {
				for (var h = k; h < 4; h++) {
					if (questOptions[j].durationId < questOptions[h].durationId) {
						temp = questOptions[j];
						questOptions[j] = questOptions[h];
						questOptions[h] = temp;
					}
				}
			}
		}
		for (var j = 0; j < 4; j++) {
				var str = '<table>';
				for (var k in data.mercenaries.mercenaries)
					str += '<tr><td>' + getNextRewardStr(data.mercenaries.mercenaries[k], questOptions[j].durationId, questOptions[j].rewardType, QA) + '</td></tr>';
				str += '</table>'
				var rt = rewardTypes[questOptions[j].rewardType];
				if (marks['m' + rt])
					rt = '<mark' + rt + '>' + rt + '</mark' + rt + '>';
				output += '<td class="tsource">' + (questOptions[j].rewardType == 1 ? ' ' : durations[questOptions[j].durationId] + ' ') + rt + '<span class="ttip">' + str + '</span></td>';
		}
		output += '</tr>';
	}
	if (output != "")
		output += '</table><br>';
	document.getElementById("quest").innerHTML = output;

	function getMercenaryCount(mercs) {
		var count = 0;
		for (var i in mercs) {
			count++;
			if (mercs[i].lastQuestRewardType == 1)
				count++;
		}
		return count;
	}
}
/*
    public function getPurchaseAscensionHeroSouls() : BigNumber
      {
         var _loc1_:Number = this.highestFinishedZonePersist;
         var _loc2_:Number = this.getPrimalChance() * 0.01;
         var _loc3_:BigNumber = new BigNumber(0);
         var _loc4_:* = 100;
         while(_loc4_ <= _loc1_)
         {
            _loc3_ = _loc3_.add(this.getPrimalHeroSoulRewards(_loc4_));
            _loc4_ = _loc4_ + 5;
         }
         _loc3_ = _loc3_.multiply(new BigNumber(_loc2_)).floor();
         return _loc3_.add(new BigNumber(7));
      }
      public function getPrimalHeroSoulRewards(param1:Number) : BigNumber
      {
         var _loc2_:int = 0;
         var _loc3_:BigNumber = null;
         var _loc4_:BigNumber = null;
         var _loc5_:BigNumber = null;
         if(param1 == 100)
         {
            return new BigNumber(1);
         }
         if(param1 > 100 && param1 % 5 == 0)
         {
            if(this.transcendent)
            {
               _loc4_ = this.getTranscendentPrimalHeroSoulRewards(param1);
               _loc5_ = this.getNonTranscendentPrimalHeroSoulRewards(param1);
               return _loc5_.add(_loc4_).floor();
            }
            return new BigNumber(Math.floor(Math.pow(((param1 - 100) / 5 + 4) / 5,1.3) * (1 + this.ancients.primalHeroSoulPercent.numberValue() * 0.01)));
         }
         return new BigNumber(0);
      }
            public function getTranscendentPrimalHeroSoulRewards(param1:Number) : BigNumber
      {
         var _loc2_:int = 0;
         var _loc3_:BigNumber = null;
         var _loc4_:BigNumber = null;
         if(param1 == 100)
         {
            return new BigNumber(0);
         }
         if(param1 > 100 && param1 % 5 == 0)
         {
            _loc2_ = (param1 - 100) / 5;
            _loc3_ = this.ancients.primalHeroSoulPercent.multiplyN(0.01).addN(1);
            _loc4_ = new BigNumber(1 + this.transcendentPower).pow(_loc2_).multiplyN(20).multiply(_loc3_);
            _loc4_ = _loc4_.min(this.heroSoulsSacrificed.divideN(20).multiplyN(1 + this.outsiders.transcendentRewardCapBonus * 0.01));
            return _loc4_.floor();
         }
         return new BigNumber(0);
      }
            public function getNonTranscendentPrimalHeroSoulRewards(param1:Number) : BigNumber
      {
         var _loc2_:int = 0;
         var _loc3_:BigNumber = null;
         var _loc4_:BigNumber = null;
         if(param1 == 100)
         {
            return new BigNumber(1);
         }
         if(param1 > 100 && param1 % 5 == 0)
         {
            _loc2_ = (param1 - 100) / 5;
            _loc3_ = this.ancients.primalHeroSoulPercent.multiplyN(0.01).addN(1);
            _loc4_ = new BigNumber(Math.pow((_loc2_ + 4) / 5,1.3)).multiply(_loc3_);
            return _loc4_.floor();
         }
         return new BigNumber(0);
      }
            public function get baseTranscendentPower() : Number
      {
         return 0.01 + 0.49 * (1 - Math.exp(-0.0001 * this.ancientSoulsTotal));
      }
      
      public function get transcendentPower() : Number
      {
         return this.baseTranscendentPower + 0.01 * this.outsiders.transcendentPowerBonus;
      }

            public function get transcendentPowerBonus() : Number
      {
         return this.getOutsiderBonus(3);
      }
            public function getOutsiderBonus(param1:*) : *
      {
         var _loc2_:Outsider = null;
         var _loc3_:Number = 0;
         if(this.outsiders.hasOwnProperty(param1.toString()))
         {
            _loc2_ = this.outsiders[param1];
            _loc3_ = _loc2_.getBonusAmount();
         }
         else
         {
            _loc2_ = new Outsider();
            _loc2_.id = param1;
            _loc3_ = _loc2_.getBonusAmount();
         }
         return _loc3_;
      }
            public function phandoryssValue(param1:Number) : Number
      {
         var _loc2_:Number = 50;
         var _loc3_:Number = -0.001;
         return _loc2_ * (1 - Math.exp(_loc3_ * param1));
      }
            public function linear10(param1:Number) : Number  this is transcendentRewardCapBonus for borb
      {
         return param1 * 10;
      }
      */
      // todo still, add outsider bonus to getPrimalHeroSoulPercent and check the effects of ancients and relics for atman and solomon

function getQA(data) {
	var primalHeroSoulPercent = getPrimalHeroSoulPercent(data);
	var souls = 0;
	for (var zone = 100; zone <= data.highestFinishedZonePersist; zone += 5)
		souls += getPrimalHeroSoulRewards(zone, primalHeroSoulPercent, data);
	souls = Math.floor(souls * getAtmanMult(data));
	return souls + 7;

	function getPrimalHeroSoulRewards(zone, primalHeroSoulPercent, data) {
		if (zone == 100)
			return 1;
		if (zone > 100) {
			var reward = 0;
			if (data.transcendent) {
				var TP = 0.01 + 0.49 * (1 - Math.exp(-0.0001 * data.ancientSoulsTotal)) + ((data.outsiders.hasOwnProperty("3")) ? (0.01 * 50 * (1 - Math.exp(-0.001 * data.outsiders[3].level))) : 0);
				reward = Math.pow(1 + TP, (zone - 100) / 5)  * 20 * (1 + primalHeroSoulPercent * 0.01);
				reward = Math.floor(Math.min(reward, data.heroSoulsSacrificed / 20 * (1 + ((data.outsiders.hasOwnProperty("4")) ? (10 * data.outsiders[4].level) : 0) * 0.01)));
			}
			return reward + Math.floor(Math.pow(((zone - 100) / 5 + 4) / 5, 1.3) * (1 + primalHeroSoulPercent * 0.01));
		}
		return 0;
	}

	function getAtmanMult(data) {
		var atman = 25;
		for (var i in data.items.slots) {
			var item = data.items.items[data.items.slots[i]];
			for (var j = 1; j <= 4; j++)
				if (item['bonusType' + j] == 17)
					atman += parseInt(item['bonus' + j + 'Level']);
		}
		if (data.ancients.ancients.hasOwnProperty(13))
			atman += data.ancients.ancients[13].level;
		return atman * 0.01;
	}

	function getPrimalHeroSoulPercent(data) {
		var relicSolomonLevel = 0;
		for (var i in data.items.slots) {
			var item = data.items.items[data.items.slots[i]];
			for (var j = 1; j <= 4; j++)
				if (item['bonusType' + j] == 25)
					relicSolomonLevel += parseInt(item['bonus' + j + 'Level']);
		}
		var solomonLevel = 0;
		if (data.ancients.ancients.hasOwnProperty(3))
			solomonLevel += data.ancients.ancients[3].level;
		return solomonValue(solomonLevel) + solomonValue(relicSolomonLevel);

		function solomonValue(lvl) {
			if (lvl <= 20)
				return lvl * 5;
			else if (lvl <= 40)
				return 100 + (lvl - 20) * 4;
			else if (lvl <= 60)
				return 180 + (lvl - 40) * 3;
			else if (lvl <= 80)
				return 240 + (lvl - 60) * 2;
			else
				return 200 + lvl;
		}
	}
}

function getNextRewardStr(merc, durationId, rewardType, QA) {
	var durations = [, 300, 900, 1800, 3600, 7200, 14400, 28800, 86400, 172800];
	var durationBonuses = [, 3.2, 2.75, 2.5, 2, 1.75, 1.5, 1.25, 1, 0.8];
	var rarityMulitpliers = [, 0.5, 0.75, 1, 2, 5, 20, 50, 200];
	var str = '';
	// possible seed changes if dying on current quest
	var seed = merc.questResult ? getSeedAfterRevive(merc.roller.seed) : merc.roller.seed;
	var reward = (merc.lastQuestRewardQty ? merc.lastQuestRewardQty : merc.lastQuestGoldRewardQty) * merc.level;
	// possible seed change(s) on finishing current quest
	if (merc.lastQuestRewardType > 2)
		seed = randNum(seed);
	if (merc.lastQuestRewardType == 5) {
		var skillsReward = Math.min(reward * (1 + .1 * rarityMulitpliers[merc.rarity]), 9);
		var k = seed / 2147483646 < skillsReward - Math.floor(skillsReward) ? Math.floor(skillsReward) + 1 : Math.floor(skillsReward);
		for (var j = 0; j < k; j++)
			seed = randNum(seed);
	}
	// possible seed changes if dying on next quest
	if (merc.timeToDie < merc.lastQuestDuration + durations[durationId])
		seed = getSeedAfterRevive(seed);
	// possible level up
	var experience = merc.experience;
	var level = merc.level;
	experience += merc.lastQuestRewardType == 1 ? 28800 / 86400 : merc.lastQuestDuration / 86400;
	while (experience > 0.99) {
		experience--;
		level++;
	}
	// new reward
	reward = durations[durationId] / 86400 * durationBonuses[durationId] * level;
	switch (rewardType) {
		case 1: // recruitment
			var recruitDuration = durations[durationId];
			if (merc.statId == 6) // bonus recruitment speed
				recruitDuration /= 1 + 0.1 * rarityMulitpliers[merc.rarity];
			str = merc.name + '</td><td>' + secToString(recruitDuration);
			break;
		case 2: // gold
			reward *= 24;
			if (merc.statId == 1) // bonus gold
				reward *= 1 + 0.1 * rarityMulitpliers[merc.rarity];
			str = merc.name + '</td><td>' + (reward / 8).toFixed(2) + ' timelapse' + (reward == 8 ? '' : 's') + ' worth of gold';
			break;
		case 3: // hs
			reward *= 0.1;
			if (merc.statId == 2) // bonus hs
				reward *= 1 + 0.1 * rarityMulitpliers[merc.rarity];
			str = merc.name + '</td><td>' + (reward * 100).toFixed(2) + '% of QA'; // (';
			/*
			reward *= QA;
			reward = randNum(seed) / 2147483646 < reward - Math.floor(reward) ? Math.floor(reward) + 1 : Math.floor(reward);
			str += reward + ' hero soul' + (reward == 1 ? ')' : 's)');
			*/
			break;
		case 4: // relics (no bonus relic types)
			reward = randNum(seed) / 2147483646 < reward - Math.floor(reward) ? Math.floor(reward) + 1 : Math.floor(reward);
			str = merc.name + '</td><td>' + reward + ' relic' + (reward == 1 ? '' : 's');
			break;
		case 5: // skills
			if (merc.statId == 4) // bonus skills
				reward *= 1 + 0.1 * rarityMulitpliers[merc.rarity];
			reward = Math.min(9, reward);
			reward = randNum(seed) / 2147483646 < reward - Math.floor(reward) ? Math.floor(reward) + 1 : Math.floor(reward);
			str = merc.name + '</td><td>' + reward + ' skill activation' + (reward == 1 ? '' : 's');
			break;
		case 6: // rubies
			if (merc.statId == 3) // bonus rubies
				reward *= 1 + 0.1 * rarityMulitpliers[merc.rarity];
			str = merc.name + '</td><td>' + reward.toFixed(2) + ': ';
			reward = randNum(seed) / 2147483646 < reward - Math.floor(reward) ? Math.floor(reward) + 1 : Math.floor(reward);
			str += reward + (reward == 1 ? ' ruby' : ' rubies');
			break;
	}
	return str;
}

function mercs(seed, num, showTTD, showDays, showMercTTDs, numTTDs) {
	var output = "";
	var bonusTypes = ["Gold","HS","Rubies","Skills","Lives","Recruitment"];
	var rarities = ["Common","Uncommon","Rare","Epic","Fabled","Mythical","Legendary","Transcendent"];
	var filters = {};
	for (var i in bonusTypes)
		filters[bonusTypes[i]] = document.getElementById(bonusTypes[i]).checked;
	for (var i in rarities)
		filters[rarities[i]] = document.getElementById(rarities[i]).checked;
	for (var i = 0; i < num; i++) {
		if (i == 0)
			output += '<table class="striped">';
		seed = randNum(seed); // gender
		var gender = seed % 2 + 1;
		seed = randNum(seed); // name
		var leeroy = gender == 2 && seed % 100 + 1 == 100 ? 1 : 0; // leeroy is male and name number 100
		seed = randNum(seed); // death phrase
		seed = randNum(seed); // rarity
		var rarity = getRarity(seed);	
		seed = randNum(seed); // bonus type
		var bonusType = seed % 6;
		while (bonusType == 4 && rarity < 2) { 
			seed = randNum(seed); // if bonus type is Lives and rarity is too low keep trying
			bonusType = seed % 6; 
		}
		seed = randNum(seed); // added with nov 24th patch
		var TTDseed = (seed + 1) % 2147483646;
		if (!filters[rarities[rarity]] && !filters[bonusTypes[bonusType]]) {
			output += '<tr' + (leeroy ? ' class="tsource">': '>') + '<td>' + (i + 1) + (leeroy ? '*<span class="ttip">Leeroy Jenkins</span>' : '') + '</td><td>' + rarities[rarity] + '</td><td>' + bonusTypes[bonusType] + '</td>'
			if (showTTD) {
				output += '<td style="text-align:right">' + secToString(getReviveTTD(TTDseed), showDays) + '</td>';
				TTDseed = getSeedAfterRevive(TTDseed)
				if (showMercTTDs) {
					for (var j = 1; j < numTTDs; j++) { 
						output += '<td style="text-align:right">' + secToString(getReviveTTD(TTDseed), showDays) + '</td>';
						TTDseed = randNum(TTDseed);
					}
				}
			}
			output += '</tr>';
		}
	}
	if (output != "")
		output += '</table>';
	document.getElementById("merc").innerHTML = output;
	tooltip = document.querySelectorAll('.ttip');
}

function getRarity(seed) {
	var chance = [5000, 2000, 800, 300, 100, 25, 8, 1];
	var sum = 0;
	for (var i = 0; i < 8; i++)
		sum += chance[i];
	var rand = seed % sum + 1;
	sum = 0;
	for (i in chance) {
		sum += chance[i];
		if (rand <= sum)
			return i;
	}
}

function getReviveTTD(seed, questDuration) {
	if (questDuration === undefined)
		questDuration = 0;
	var reviveTTD = 0;
	seed = randNum(seed);
	var chance = (seed / 2147483646) > 4 / 5;
	while (!chance) {
		reviveTTD += 86400;
		seed = randNum(seed);
		chance = (seed / 2147483646) > 4 / 5;
	}
	seed = randNum(seed);
	reviveTTD += (seed % 86400) + 1;
	reviveTTD += questDuration;
	return reviveTTD;
}

function getSeedAfterRevive(seed) {
	seed = randNum(seed);
	var chance = (seed / 2147483646) > 4 / 5;
	while (!chance) {
		seed = randNum(seed);
		chance = (seed / 2147483646) > 4 / 5;
	}
	return randNum(seed);
}

function setCookie(name, value, days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		var expires = "; expires=" + date.toGMTString();
	}
	else
		var expires = "";
	document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ')
			c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) == 0)
			return c.substring(nameEQ.length, c.length);
	}
	return null;
}

function getCookies() {
	var values = ["numTTDs","inputQuests","inputMercs"];
	var checks = ["Gold","HS","Rubies","Skills","Lives","Recruitment","Common","Uncommon","Rare","Epic","Fabled","Mythical","Legendary","Transcendent","showDays","showTTD","showMercTTDs","sortQuests","mGold","mHS","mRubies","mSkills","mRelics","updateTime"];
	for (var i in values)
		if (getCookie(values[i]) != null)
			document.getElementById(values[i]).value = getCookie(values[i]);
	for (var i in checks)
		if (getCookie(checks[i]) != null)
			document.getElementById(checks[i]).checked = parseInt(getCookie(checks[i]));
}

function setCookies() {
	var values = ["numTTDs","inputQuests","inputMercs"];
	var checks = ["Gold","HS","Rubies","Skills","Lives","Recruitment","Common","Uncommon","Rare","Epic","Fabled","Mythical","Legendary","Transcendent","showDays","showTTD","showMercTTDs","sortQuests","mGold","mHS","mRubies","mSkills","mRelics","updateTime"];
	for (var i in values)
		setCookie(values[i], document.getElementById(values[i]).value, 15);
	for (var i in checks)
		setCookie(checks[i], (document.getElementById(checks[i]).checked ? "1" : "0"), 15);
}

var sound = new Audio("http://www.freespecialeffects.co.uk/soundfx/sirens/fanfare2.wav");
var alarmSec;
function formatAlarm(el) {
	var h = 0, m = 0;
	var num = parseInt(el.value);
	if (num < 0 || isNaN(num))
		num = 0;
	if (num >= 10000) {
		h = Math.floor(num / 10000);
		num -= h * 10000;
	}
	if (num >= 100) {
		m = Math.floor(num / 100);
		num -= m * 100;
		if (m >= 60) {
			h++;
			m -= 60;
		}
	}
	if (num >= 60) {
		m++;
		num -= 60;
	}
	var nowSec = Math.round(Date.now() / 1000);
	alarmSec = nowSec + num + m * 60 + h * 3600;
	el.value = secToString(alarmSec - nowSec);
	if (alarmSec > nowSec) {
		clearInterval(window.alarm);
		window.alarm = setInterval(function() { alarmCountDown() }, 1000);
	}
	function alarmCountDown() {
		var nowSec = Math.round(Date.now() / 1000);
		if (alarmSec == nowSec)
			sound.play();
		if (alarmSec <= nowSec)
			clearInterval(window.alarm);
		el.value = secToString(alarmSec - nowSec);
	}
}