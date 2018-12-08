/* Usable Sysbols ◎●←↑→↓↖↗↘↙ */

const mapID = [9720, 9920];						// MAP ID to input [ Normal Mode , Hard Mode ]

const ThirdBossActions = {						// Third Boss Attack Actions
	113: {msg: 'Front, Back stun ↓', msg_ru: 'Передний, Задний ↓'},
	111: {msg: 'Right Safe → , OUT safe', msg_ru: 'Право СЕЙФ → , Наружу СЕЙФ', sign_degrees: 90, sign_distance: 190},
	109: {msg: '← Left Safe , IN safe', msg_ru: '← Лево СЕЙФ , Внутрь СЕЙФ', sign_degrees: 270, sign_distance: 110}
};

const ThirdBossTwoUp = {
	104: {msg: 'Back stun ↓', msg_ru: 'Задний ↓'}
};

module.exports = function antaroth_guide(dispatch) {
	const command = dispatch.command || dispatch.require.command;
	let hooks = [],
		bossCurLocation,
		bossCurAngle,
		uid = 999999999,
		uid2 = 899999999,
		sendToParty = false,
		enabled = true,
		itemhelper = true,
		insidemap = false,
	   	streamenabled = false;
		
	if(dispatch.region == "ru")
	{
		for (let prop in ThirdBossActions)
		{
			ThirdBossActions[prop].msg = ThirdBossActions[prop].msg_ru;
		}
		for (let prop in ThirdBossTwoUp)
		{
			ThirdBossTwoUp[prop].msg = ThirdBossTwoUp[prop].msg_ru;
		}
	}
	
	dispatch.hook('S_LOAD_TOPO', 3, (event) => {
		if (event.zone === mapID[0]) 
		{								
			insidemap = true;
			command.message('Welcome to Antaroth - Normal Mode');
			load();
		} 
		else if (event.zone === mapID[1]) {
			insidemap = true;
			command.message('Welcome to Antaroth - Hard Mode');
			load();
		} 
		else
		{
			insidemap = false;
			unload();
		}
    });
	
	command.add('aaguide', () => {
		if(!insidemap) { command.message('You must be inside Antaroth'); return; }
		enabled = !enabled;
		command.message('Antaroth Guide '+(enabled ? 'Enabled' : 'Disabled') + '.');
	});
	
	command.add('itemhelp', () => {
		if(!insidemap) { command.message('You must be inside Antaroth'); return; }
		itemhelper = !itemhelper;
		command.message('Signs on safe spots '+(itemhelper ? 'Enabled' : 'Disabled') + '.');
	});
	
	command.add('toparty', (arg) => {
		if(!insidemap) { command.message('You must be inside Antaroth'); return; }
		if(arg === "stream")
		{
			streamenabled = !streamenabled;
			sendToParty = false;
			itemhelper = false;
			command.message((streamenabled ? 'Stream mode Enabled' : 'Stream mode Disabled'));
		}
		else
		{
			streamenabled = false;
			sendToParty = !sendToParty;
			command.message((sendToParty ? 'Antaroth Guide - Messages will be sent to the party' : 'Antaroth Guide - Only you will see messages in chat'));
		}
	});
	
	function sendMessage(msg)
	{
		if (sendToParty) 
		{
			dispatch.toServer('C_CHAT', 1, {
			channel: 21, //21 = p-notice, 1 = party, 2 = guild
			message: msg
			});
		}
		else if(streamenabled) 
		{
			command.message(msg);
		}
		else 
		{
			dispatch.toClient('S_CHAT', 1, {
			channel: 21, //21 = p-notice, 1 = party
			authorName: 'DG-Guide',
			message: msg
			});
		}
	}
	
	function SpawnThing(degrees, radius)
	{
		let r = null, rads = null, finalrad = null, pos = null;
		r = bossCurAngle - Math.PI;
		rads = (degrees * Math.PI/180);
		finalrad = r - rads;
		bossCurLocation.x = bossCurLocation.x + radius * Math.cos(finalrad);
		bossCurLocation.y = bossCurLocation.y + radius * Math.sin(finalrad);
		
		dispatch.toClient('S_SPAWN_BUILD_OBJECT', 2, {
			gameId : uid,
			itemId : 1,
			loc : bossCurLocation,
			w : r,
			unk : 0,
			ownerName : 'SAFE SPOT',
			message : 'SAFE'
		});
		
		setTimeout(DespawnThing, 5000, uid, uid2);
		uid--;
		bossCurLocation.z = bossCurLocation.z - 100;
		dispatch.toClient('S_SPAWN_DROPITEM', 6, {
			gameId: uid2,
			loc: bossCurLocation,
			item: 98260,
			amount: 1,
			expiry: 6000,
			owners: [{playerId: uid2}]
		});
		uid2++;
	}
	
	function DespawnThing(uid_arg, uid_arg2)
	{
		dispatch.toClient('S_DESPAWN_BUILD_OBJECT', 2, {
				gameId : uid_arg,
				unk : 0
			});
		dispatch.toClient('S_DESPAWN_DROPITEM', 4, {
				gameId: uid_arg2
			});
	}
	
	let lasttwoup = 0, rotationdelaylast = 0, rotationdelay = 0, bossid = 0;
	function load()
	{
		if(!hooks.length)
		{
			hook('S_CREATURE_ROTATE', 2, (event) => {
				if(!lasttwoup || bossid !== event.gameId) return;
				rotationdelaylast = Date.now();
				rotationdelay = event.time;
			});
			
			hook('S_ACTION_STAGE', 8, (event) => {
				if(!enabled || event.templateId !== 3000) return;
				
				if (ThirdBossTwoUp[event.skill.id % 1000])
				{
					let now = Date.now();
					if(now - rotationdelaylast > 1200) // ~890
					{
						rotationdelay = 0;
					}
					if(now - lasttwoup - rotationdelay < 2900) // ~2100-2600, fake calls are at 2900+ (followed by a 3rd two-up and a stun)
					{
						sendMessage(ThirdBossTwoUp[event.skill.id % 1000].msg /*+ " : " + String(now - lasttwoup) + " - " + String(rotationdelay) + " = " + String(now - lasttwoup - rotationdelay)*/ );
					}
					lasttwoup = now;
					bossid = event.gameId;
				}
				else
				{
					lasttwoup = 0;
					rotationdelaylast = 0;
					if (ThirdBossActions[event.skill.id % 1000])
					{
						sendMessage(ThirdBossActions[event.skill.id % 1000].msg);
						if(itemhelper && typeof ThirdBossActions[event.skill.id % 1000].sign_degrees !== "undefined")
						{
							bossCurLocation = event.loc;
							bossCurAngle = event.w;
							SpawnThing(ThirdBossActions[event.skill.id % 1000].sign_degrees, ThirdBossActions[event.skill.id % 1000].sign_distance)
						}
					}
				}
			});
		}
	}
	
	function unload() {
		if(hooks.length) {
			for(let h of hooks) dispatch.unhook(h)

			hooks = []
		}
	}

	function hook() {
		hooks.push(dispatch.hook(...arguments))
	}
}
