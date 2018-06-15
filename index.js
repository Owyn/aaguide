/* Usable Sysbols ◎●←↑→↓↖↗↘↙ */

const Command = require('command');
const mapID = [9720, 9920];						// MAP ID to input [ Normal Mode , Hard Mode ]

const ThirdBossActions = {						// Third Boss Attack Actions
	1188037721: {msg: 'Front, Back stun ↓', msg_ru: 'Передний, Задний ↓'},
	1188038721: {msg: 'Front, Back stun ↓', msg_ru: 'Передний, Задний ↓'}, // rage
	1188037719: {msg: 'Right Safe →', msg_ru: 'Право СЕЙФ →', sign_degrees: 90, sign_distance: 90},
	1188038719: {msg: 'Right Safe →', msg_ru: 'Право СЕЙФ →', sign_degrees: 90, sign_distance: 90}, // rage
	1188037717: {msg: '← Left Safe', msg_ru: '← Лево СЕЙФ', sign_degrees: 270, sign_distance: 90},
	1188038717: {msg: '← Left Safe', msg_ru: '← Лево СЕЙФ', sign_degrees: 270, sign_distance: 90} // rage
};

const ThirdBossActionsHM = {					// Third Boss Attack Actions Hard Mode
	1201144921: {msg: 'Front, back stun ↓', msg_ru: 'Передний, Задний ↓'},
	1201145921: {msg: 'Front, back stun ↓', msg_ru: 'Передний, Задний ↓'}, // rage
	1201144919: {msg: 'Right Safe → , OUT safe', msg_ru: 'Право СЕЙФ → , Наружу СЕЙФ', sign_degrees: 90, sign_distance: 190},
	1201145919: {msg: 'Right Safe → , OUT safe', msg_ru: 'Право СЕЙФ → , Наружу СЕЙФ', sign_degrees: 90, sign_distance: 190}, // rage
	1201144917: {msg: '← Left Safe , IN safe', msg_ru: '← Лево СЕЙФ , Внутрь СЕЙФ', sign_degrees: 270, sign_distance: 90},
	1201145917: {msg: '← Left Safe , IN safe', msg_ru: '← Лево СЕЙФ , Внутрь СЕЙФ', sign_degrees: 270, sign_distance: 90} // rage
};

const ThirdBossTwoUp = {
	1188037712: {msg: 'Back stun ↓', msg_ru: 'Задний ↓'},
	1188038712: {msg: 'Back stun ↓', msg_ru: 'Задний ↓'}, // rage
	1201144912: {msg: 'Back stun ↓', msg_ru: 'Задний ↓'}, // HM
	1201145912: {msg: 'Back stun ↓', msg_ru: 'Задний ↓'} // HM Rage
};

/*const ToTest = {						// Third Boss Attack Actions
	1188037809: {msg: 'Red Aura ↓'},
	1188038716: {msg: 'Red Thrust ↓'},
	1201145009: {msg: 'Red Aura ↓'}, // HM
	1201144916: {msg: 'Red Thrust ↓'} // HM
};*/

module.exports = function antaroth_guide(dispatch) {
	const command = Command(dispatch);
	let hooks = [],
		bossCurLocation,
		bossCurAngle,
		uid = 999999999,
		sendToParty = false,
		enabled = true,
		itemhelper = true,
		insidemap = false,
	   	streamenabled = false;
		
	if(dispatch.base.region == "ru")
	{
		for (let prop in ThirdBossActions)
		{
			ThirdBossActions[prop].msg = ThirdBossActions[prop].msg_ru;
		}
		for (let prop in ThirdBossActionsHM)
		{
			ThirdBossActionsHM[prop].msg = ThirdBossActionsHM[prop].msg_ru;
		}
		for (let prop in ThirdBossTwoUp)
		{
			ThirdBossTwoUp[prop].msg = ThirdBossTwoUp[prop].msg_ru;
		}
	}
	
	dispatch.hook('S_LOAD_TOPO', 1, (event) => {
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
		
		setTimeout(DespawnThing, 5000, uid);
		uid--;
	}
	
	function DespawnThing(uid_arg)
	{
		dispatch.toClient('S_DESPAWN_BUILD_OBJECT', 2, {
				gameId : uid_arg,
				unk : 0
			});
	}
	
	let lasttwoup = 0;
	function load()
	{
		if(!hooks.length)
		{
			hook('S_ACTION_STAGE', 5, (event) => {
				if(!enabled || event.templateId !== 3000) return;
				
				if (ThirdBossActions[event.skill])
				{
					sendMessage(ThirdBossActions[event.skill].msg);
					if(itemhelper && typeof ThirdBossActions[event.skill].sign_degrees !== "undefined")
					{
						bossCurLocation = event.loc;
						bossCurAngle = event.w;
						SpawnThing(ThirdBossActions[event.skill].sign_degrees, ThirdBossActions[event.skill].sign_distance)
					}
				}
				else if (ThirdBossActionsHM[event.skill])
				{
					sendMessage(ThirdBossActionsHM[event.skill].msg);
					if(itemhelper && typeof ThirdBossActionsHM[event.skill].sign_degrees !== "undefined")
					{
						bossCurLocation = event.loc;
						bossCurAngle = event.w;
						SpawnThing(ThirdBossActionsHM[event.skill].sign_degrees, ThirdBossActionsHM[event.skill].sign_distance)
					}
				}
				else if (ThirdBossTwoUp[event.skill])
				{
					let now = Date.now();
					if((now - lasttwoup) < 3500) // either ~2100 or ~2500, fake calls are at 2980 (always followed up by 3rd two-up and a stun), but ~3200 gives stuns, especially if you rotate him
					{
						sendMessage(ThirdBossTwoUp[event.skill].msg  + " : " + String(now - lasttwoup) );
					}
					lasttwoup = now;
				}
				/*else if (ToTest[event.skill])
				{
					sendMessage(ToTest[event.skill].msg);
					var today = new Date();
					var h = today.getHours();
					var m = today.getMinutes();
					var s = today.getSeconds();
					command.message(h + ":" + m + ":" + s + " - " + String(event.skill));
					console.log(h + ":" + m + ":" + s + " - " + JSON.stringify(event, null, 4));
					console.log(ToTest[event.skill].msg);
				}*/
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
