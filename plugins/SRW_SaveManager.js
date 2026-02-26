function SRWSaveManager(){
	
}

SRWSaveManager.prototype.getActorData = function(actorId){
	if(!$gameSystem.actorData){
		$gameSystem.actorData = {};
	}
	if(!$gameSystem.actorData[actorId]){
		$gameSystem.actorData[actorId] = {
			pilotUpgrades: {
				melee: 0,
				ranged: 0,
				skill: 0,
				defense: 0,
				evade: 0,
				hit: 0,
				terrain: {
					air: 0,
					land: 0,
					water: 0,
					space: 0
				},
			},
			PP: 0,
			exp: 500,
			kills: 0,
			abilities: null,
			relationships: null,
			favPoints: null,
			customSpirits: {}
		};
	}
	return JSON.parse(JSON.stringify($gameSystem.actorData[actorId]));
}

SRWSaveManager.prototype.getMechData = function(mechId){
	if(!$gameSystem.mechData){
		$gameSystem.mechData = {};
	}
	if(!$gameSystem.mechData[mechId]){
		$gameSystem.mechData[mechId] = {
			mechUpgrades: {
				maxHP: 0,
				maxEN: 0,
				armor: 0,
				mobility: 0,
				terrain: {						
					air: 0,
					land: 0,
					water: 0,
					space: 0
				},
				accuracy: 0,
				weapons: 0,
				move: 0
			},
			genericFUBAbilityIdx: -1,
			unlockedWeapons: [],
            allowedPilots: [],
            disallowedPilots: [],
            allowedSubPilots: {},
            disallowedSubPilots: {}
		};
	}
	if(!$gameSystem.mechData[mechId].unlockedWeapons){//late addition to the mech data
		$gameSystem.mechData[mechId].unlockedWeapons = [];
	}
    if(!$gameSystem.mechData[mechId].allowedPilots){//late addition to the mech data
		$gameSystem.mechData[mechId].allowedPilots = [];
	}
    if(!$gameSystem.mechData[mechId].disallowedPilots){//late addition to the mech data
		$gameSystem.mechData[mechId].disallowedPilots = [];
	}
    if(!$gameSystem.mechData[mechId].allowedSubPilots){//late addition to the mech data
		$gameSystem.mechData[mechId].allowedSubPilots = {};
	}
    if(!$gameSystem.mechData[mechId].disallowedSubPilots){//late addition to the mech data
		$gameSystem.mechData[mechId].disallowedSubPilots = {};
	}
	return JSON.parse(JSON.stringify($gameSystem.mechData[mechId]));
}

SRWSaveManager.prototype.refundMechUpgrades = function(mechId){
	var mechData = this.getMechData(mechId);
	var refundAmount = 0;
	var upgrades = mechData.mechUpgrades;
	var refUnit = {SRWStats: {actor: {}, mech: $statCalc.getMechData($dataClasses[mechId], true)}};
	for(upgrade of Object.keys(upgrades)){
		let levels = [];
		var unlockedLevel = upgrades[upgrade];
		for(var i = 0; i < unlockedLevel; i++){
			levels.push(i);
		}
		refundAmount+=$statCalc.getMechStatIncreaseCost(refUnit, upgrade, levels);
		if(upgrade != "terrain"){
			upgrades[upgrade] = 0;
		}		
	}
	if(!isNaN(refundAmount)){
		$gameParty.gainGold(refundAmount);	
		this.storeMechData(mechId, mechData);
	}
	
	//$gameSystem.updateAvailableUnits();
}

SRWSaveManager.prototype.refundPilotPP = function(pilotId){
	var storedData = this.getActorData(pilotId);
	var upgrades = storedData.pilotUpgrades;
	var abilities = storedData.abilities;
	var refundAmount = 0;
	
	function addRefundAmount(amount){
		amount = amount * 1;
		if(!isNaN(amount)){
			refundAmount+=amount;
		}
	}
	
	for(let type in upgrades){
		if(type == "terrain"){
			let terrainUpgrades = upgrades[type];
			var baseTerrain = $statCalc.parseTerrainString($dataActors[15].meta.pilotTerrain);
			for(let terrain in terrainUpgrades){
				let currentLevel = $statCalc.terrainToNumeric(baseTerrain[terrain]);
				let levels = [];
				for(let i = 0; i < terrainUpgrades[terrain]; i++){
					levels.push(currentLevel + i)
				}
				addRefundAmount($statCalc.getPilotTerrainIncreaseCost(levels));
			}			
			upgrades[type] = {air: 0, land: 0, water: 0, space: 0};
		} else {
			if(type != "melee" || !ENGINE_SETTINGS.MERGE_ATTACK_UPGRADES){
				addRefundAmount((upgrades[type] || 0) * 10);
			}
			upgrades[type] = 0;
		}		
	}
	
	for(let id in abilities){
		try {
			let abiInfo = abilities[id];
			let costInfo = $pilotAbilityManager.getAbilityDef(id).cost;
			if(costInfo){
				for(let i = 0; i < abiInfo.level; i++){
					if(costInfo[i]){
						addRefundAmount(costInfo[i]);
					}				
				}
			}			
		} catch(e){
			
		}				
	}
	
	if(!isNaN(refundAmount)){
		storedData.PP = storedData.PP * 1 + refundAmount;
		storedData.abilities = {};
	}
	
	
	this.storeActorData(pilotId, storedData);
	//$gameSystem.updateAvailableUnits();
}

SRWSaveManager.prototype.getInventoryData = function(){
	if(!$gameSystem.inventoryData){
		$gameSystem.inventoryData = [];
	}	
	return JSON.parse(JSON.stringify($gameSystem.inventoryData));
}

SRWSaveManager.prototype.setInventoryData = function(data){	
	$gameSystem.inventoryData = data;	
}

SRWSaveManager.prototype.getEquipablesData = function(){
	if(!$gameSystem.equipablesData){
		$gameSystem.equipablesData = {};
	}	
	return JSON.parse(JSON.stringify($gameSystem.equipablesData));
}

SRWSaveManager.prototype.setEquipablesData = function(data){	
	$gameSystem.equipablesData = data;	
}

SRWSaveManager.prototype.storeActorData = function(actorId, data){
	if(!$gameSystem.actorData){
		$gameSystem.actorData = {};
	}	
	$gameSystem.actorData[actorId] = JSON.parse(JSON.stringify(data));
}

SRWSaveManager.prototype.storeMechData = function(mechId, data){
	if(!$gameSystem.mechData){
		$gameSystem.mechData = {};
	}
	var newData = JSON.parse(JSON.stringify(data));
	for(let key in newData){
		$gameSystem.mechData[mechId][key] = newData[key];
	}	
}

SRWSaveManager.prototype.registerEvolvedMech = function(mechId, targetMechId){
	if(!$gameSystem.evolvedMechLookup){
		$gameSystem.evolvedMechLookup = {};
	}
	$gameSystem.evolvedMechLookup[mechId] = targetMechId;
}

SRWSaveManager.prototype.getEvolutionTarget = function(mechId){
	if(!$gameSystem.evolvedMechLookup){
		$gameSystem.evolvedMechLookup = {};
	}
	return $gameSystem.evolvedMechLookup[mechId];
}

SRWSaveManager.prototype.isEvolvedMech = function(mechId){
	if(!$gameSystem.evolvedMechLookup){
		$gameSystem.evolvedMechLookup = {};
	}
	return $gameSystem.evolvedMechLookup[mechId] != null;
}

SRWSaveManager.prototype.getUnlockedUnits = function(){
	if(!$gameSystem.unlockedUnits){
		$gameSystem.unlockedUnits = {};
	}
	return $gameSystem.unlockedUnits;
}

SRWSaveManager.prototype.setUnitUnlocked = function(unitClassId){
	if(!$gameSystem.unlockedUnits){
		$gameSystem.unlockedUnits = {};
	}
	$gameSystem.unlockedUnits[unitClassId] = true;
}

SRWSaveManager.prototype.setUnitLocked = function(unitClassId){
	if(!$gameSystem.unlockedUnits){
		$gameSystem.unlockedUnits = {};
	}
	delete $gameSystem.unlockedUnits[unitClassId];
}

SRWSaveManager.prototype.setPilotLevel = function(pilotId, level){
	var actorData = this.getActorData(pilotId);
	actorData.exp = level * 500;
	this.storeActorData(pilotId, actorData);
}

SRWSaveManager.prototype.addKills = function(pilotId, amount){
	var actorData = this.getActorData(pilotId);
	actorData.kills+=amount*1;
	this.storeActorData(pilotId, actorData);
}

SRWSaveManager.prototype.addPP = function(pilotId, amount){
	var actorData = this.getActorData(pilotId);
	actorData.PP+=amount*1;
	this.storeActorData(pilotId, actorData);
}

SRWSaveManager.prototype.addExp = function(pilotId, amount){
	var actorData = this.getActorData(pilotId);
	actorData.exp+=amount*1;
	this.storeActorData(pilotId, actorData);
}

SRWSaveManager.prototype.allowPilot = function(pilotId, mechId, subpilotSlot){
    var mechData = this.getMechData(mechId);
    var refUnit = $statCalc.getMechData($dataClasses[mechId], true);
    var allowedPilots = [];
    if(subpilotSlot !== undefined){
        if(refUnit.allowedSubPilots[subpilotSlot] !== undefined){
            if(mechData.allowedSubPilots[subpilotSlot] === undefined){
                mechData.allowedSubPilots[subpilotSlot] = [];
            }
            if(mechData.allowedSubPilots[subpilotSlot].length === 0) {
                allowedPilots = refUnit.allowedSubPilots[subpilotSlot];
            } else {
                allowedPilots = mechData.allowedSubPilots[subpilotSlot];
            }
            if(!allowedPilots.includes(pilotId)){
                if(mechData.disallowedSubPilots[subpilotSlot] !== undefined){
                    if(mechData.disallowedSubPilots[subpilotSlot].contains(pilotId)){
                        mechData.disallowedSubPilots[subpilotSlot] = mechData.disallowedSubPilots[subpilotSlot].filter((value) => value !== pilotId);
                    }
                }
                
                allowedPilots.push(pilotId);
                mechData.allowedSubPilots[subpilotSlot] = allowedPilots;
                this.storeMechData(mechId, mechData);
                //mechData = this.getMechData(mechId); //Temporary for debugging
            }
            
        } else {
            console.log("Error: allowPilot. No subpilot slot " + subpilotSlot + " on " + mechId + ".");
        }          
    } else {
        if(mechData.allowedPilots.length === 0){
            allowedPilots = refUnit.allowedPilots;
        } else {
            allowedPilots = mechData.allowedPilots;
        }
        if(!allowedPilots.includes(pilotId)){
            if(mechData.disallowedPilots.contains(pilotId)){
                mechData.disallowedPilots = mechData.disallowedPilots.filter((value) => value !== pilotId);
            }
            allowedPilots.push(pilotId);
            mechData.allowedPilots = allowedPilots;
            this.storeMechData(mechId, mechData);
            //mechData = this.getMechData(mechId); //Temporary for debugging
        }
    }
    //console.log(["ALLOW PILOT", mechData, refUnit]); //Temporary for debugging
}

SRWSaveManager.prototype.disallowPilot = function(pilotId, mechId, subpilotSlot){
    var mechData = this.getMechData(mechId);
    var disallowedPilots = [];
    if (subpilotSlot !== undefined){
        if(mechData.disallowedSubPilots[subpilotSlot] === undefined){
            mechData.disallowedSubPilots[subpilotSlot] = [];
        }
        disallowedPilots = mechData.disallowedSubPilots[subpilotSlot];
        if(!disallowedPilots.includes(pilotId)){
           if(mechData.allowedSubPilots[subpilotSlot] !== undefined){
               if(mechData.allowedSubPilots[subpilotSlot].contains(pilotId)){
                   mechData.allowedSubPilots[subpilotSlot] = mechData.allowedSubPilots[subpilotSlot].filter((value) => value !== pilotId);
               }
           }
           disallowedPilots.push(pilotId);
           mechData.disallowedSubPilots[subpilotSlot] = disallowedPilots;
           this.storeMechData(mechId, mechData);
           //mechData = this.getMechData(mechId); //Temporary for debugging
        }
    } else {
        disallowedPilots = mechData.disallowedPilots;
        if(!disallowedPilots.includes(pilotId)){
            if(mechData.allowedPilots.contains(pilotId)){
                mechData.allowedPilots = mechData.allowedPilots.filter((value) => value !== pilotId);
            }
            disallowedPilots.push(pilotId);
            mechData.disallowedPilots = disallowedPilots;
            this.storeMechData(mechId, mechData);
            //mechData = this.getMechData(mechId); //Temporary for debugging
        }
    }
    //console.log(["DISALLOW PILOT", mechData]); //Temporary for debugging
}

SRWSaveManager.prototype.getSRCount = function(mapId){
	if(!$gameSystem.awardedSRPoints){
		$gameSystem.awardedSRPoints = {};
	}
	return  Object.keys($gameSystem.awardedSRPoints).filter((x) => $gameSystem.awardedSRPoints[x]).length;
}

SRWSaveManager.prototype.hasMapSRPoint = function(mapId){
	if(!$gameSystem.awardedSRPoints){
		$gameSystem.awardedSRPoints = {};
	}
	return $gameSystem.awardedSRPoints[mapId];
}

SRWSaveManager.prototype.initMapSRPoint = function(mapId){
	if(!$gameSystem.awardedSRPoints){
		$gameSystem.awardedSRPoints = {};
	}
	if($gameSystem.awardedSRPoints[mapId] == null){
		$gameSystem.awardedSRPoints[mapId] = false;
	}	
}

SRWSaveManager.prototype.awardMapSRPoint = function(mapId){	
	if(!$gameSystem.lockedSRPoints){
		$gameSystem.lockedSRPoints = {};
	}
	if(!$gameSystem.awardedSRPoints){
		$gameSystem.awardedSRPoints = {};
	}
	var alreadyHadPoint = $gameSystem.awardedSRPoints[mapId] == true;
	if(!$gameSystem.lockedSRPoints[mapId]){
		$gameSystem.awardedSRPoints[mapId] = true;
	}	
	return !alreadyHadPoint && $gameSystem.awardedSRPoints[mapId] == true;
}

SRWSaveManager.prototype.lockMapSRPoint = function(mapId){
	if(!$gameSystem.lockedSRPoints){
		$gameSystem.lockedSRPoints = {};
	}
	if(!$gameSystem.awardedSRPoints){
		$gameSystem.awardedSRPoints = {};
	}
	$gameSystem.lockedSRPoints[mapId] = true;
	delete $gameSystem.awardedSRPoints[mapId];
}

SRWSaveManager.prototype.isMapSRPointLocked = function(mapId){
	if(!$gameSystem.lockedSRPoints){
		$gameSystem.lockedSRPoints = {};
	}
	return $gameSystem.lockedSRPoints[mapId];
}