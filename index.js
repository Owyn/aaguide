/* Usable Sysbols ◎●←↑→↓↖↗↘↙ */

const Command = require('command');
const mapID = [9720, 9920];						// MAP ID to input [ Normal Mode , Hard Mode ]

const ThirdBossActions = {						// Third Boss Attack Actions
	1188037721: {msg: 'Front, Back stun ↓'},
	1188038721: {msg: 'Front, Back stun ↓'}, // rage
	1188037719: {msg: 'Right Safe →'},
	1188038719: {msg: 'Right Safe →'}, // rage
	1188037717: {msg: '← Left Safe'},
	1188038717: {msg: '← Left Safe'} // rage
};

const ThirdBossActionsHM = {					// Third Boss Attack Actions Hard Mode
	1201144921: {msg: 'Front, back stun ↓'},
	1201145921: {msg: 'Front, back stun ↓'}, // rage
	1201144919: {msg: 'Right Safe → , OUT safe'},
	1201145919: {msg: 'Right Safe → , OUT safe'}, // rage
	1201144917: {msg: '← Left Safe , IN safe'},
	1201145917: {msg: '← Left Safe , IN safe'} // rage
};

const ThirdBossTwoUp = {
	1188037712: {msg: 'Back stun ↓'},
	1188038712: {msg: 'Back stun ↓'}, // rage
	1201144912: {msg: 'Back stun ↓'}, // HM
	1201145912: {msg: 'Back stun ↓'} // HM Rage
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
		sendToParty = false,
		enabled = true,
		insidemap = false,
	   	streamenabled = false;
		
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
	
	command.add('toparty', (arg) => {
		if(!insidemap) { command.message('You must be inside Antaroth'); return; }
		if(arg === "stream")
		{
			streamenabled = !streamenabled;
			sendToParty = false;
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
				}
				else if (ThirdBossActionsHM[event.skill])
				{
					sendMessage(ThirdBossActionsHM[event.skill].msg);
				}
				else if (ThirdBossTwoUp[event.skill])
				{
					let now = Date.now();
					if((now - lasttwoup) < 3000) // usually <2350
					{
						sendMessage(ThirdBossTwoUp[event.skill].msg /* + " : " + String(now - lasttwoup)*/ );
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
