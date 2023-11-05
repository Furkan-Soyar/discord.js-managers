# discord.js-managers
<p align="center">
  <span>Simple yet powerful handler for discord.js.</span>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/discord.js-managers">
    <img src="https://img.shields.io/npm/dt/discord.js-managers?color=dc143c&style=flat-square" alt="downloads">
  </a>
  <a href="https://www.npmjs.com/package/discord.js-managers">
    <img src="https://img.shields.io/npm/v/discord.js-managers?style=flat-square&color=9400d3" alt="npm version">
  </a>
  <a href="https://www.npmjs.com/package/discord.js-managers">
    <img src="https://img.shields.io/bundlephobia/min/discord.js-managers?style=flat-square&color=ff6347" alt="minified size">
  </a>
    <img src="https://img.shields.io/npm/l/discord.js-managers?style=flat-square&color=4169e1" alt="license">
</p>

## About 
A package to synchronize your bot's commands and events and managing interactions

- Quickly registers new Commands
- Auto deletes deleted Commands
- Managing Interactions
- Managing events

## Instaling discord.js-managers

```sh-session
npm i discord.js-managers
```

## Example Usage
- Create a main file

index.js (example)
```js
import { Client, GatewayIntentBits } from 'discord.js'
import Handler from "discord.js-managers"

const client = new Client({ intents: [GatewayIntentBits.Guilds] })
const handler = new Handler({ 
    client: client,
    commandsFolder: "commandsFolder",
    eventsFolder: "eventsFolder",
    consoleLogging: true, 
    checkUpdate: true 
})

handler.commands.synchronize()
handler.events.synchronize()

client.login(TOKEN);
```
- Create a command folder with the name you entered in the `commandsFolder` property
- Create a event folder with the name you entered in the `eventsFolder` property

eventsFolder/ready.js (example)
```js
export default (client) => {
    console.log(`Logged in as ${client.user.tag}!`)
}
```

## Add Command
- Create a javascript file in the your `commandsFolder`
- Fill in `name`, `description [Only chatInput]` and `execute [function]` as forced in
```js
export default {
	name: "test",
	description: "Test Command",
	execute(client, interaction, options) {
		interaction.reply("Test successful")
	}
}
```
- Optionally, [`type [default: 1]`](https://discord-api-types.dev/api/discord-api-types-v10/enum/ApplicationCommandType), [`guild`](https://old.discordjs.dev/#/docs/discord.js/main/class/Guild?scrollTo=id), [`permission`](https://discord-api-types.dev/api/discord-api-types-payloads/common#PermissionFlagsBits), [`options`](https://discord.js.org/#/docs/discord.js/main/typedef/ApplicationCommandOptionData), [`componentInteraction [function]`](https://old.discordjs.dev/#/docs/discord.js/main/class/MessageComponentInteraction), [`autocompleteInteraction [function]`](https://old.discordjs.dev/#/docs/discord.js/main/class/AutocompleteInteraction), [`modalInteraction [function]`](https://old.discordjs.dev/#/docs/discord.js/main/class/AutocompleteInteraction)
```js
export default {
	type: 1,
	name: "test",
	description: "Test Command",
	guild: 895139517651258664,
	options: [
		{
			type: 3,
			name: "test_option",
			description: "Test",
			autocomplete: true
		}
	],
	permissions: [
		"BanMembers",
		"KickMembers"
	],
	execute(client, interaction, options) {
		const component = {
			type: 1, // ActionRow
			components: [
				{
					type: 2, // Button
					customId: "test.button",
					label: "Pong!",
					style: 1
				}
			]
		}
		
		interaction.reply({ components: [component] }).then(() => {
			interaction.followUp(`option: ${options.getString("test_option")}`)
		})
	},
	componentInteraction(client, interaction, customId) {
		if (customId == "button") {
			const modal = {
			title: "Test Modal",
			customId: "test.modal",
			components: [
				{
					type: 1,
					components: [
						{
							type: 4,
							customId: "test",
							label: "Test Modal",
							style: 1,
							placeholder: "Test"
						}
					]
				}
			]
		}
		interaction.showModal(modal)
		}
	},
	autocompleteInteraction(client, interaction, focused) {
		interaction.respond(
			[
				{
					name: "test",
					value: "test"
				}
			]
		)
	},
	modalInteraction(client, interaction, customId) {
		interaction.reply("Modal triggered!")
	}
}
```

## Add Event
- Make the name of the javascript file the name of the event you want to add
![img1](https://i.imgur.com/0B6OxSO.png)
- First export the client and then the objects to be rendered with the default 
```js
export default (client, role) => { ··· }
```

## Handling Components
- First, let's create a sample component.
- To handle interactions, prefix the `customId` property with the name of the command as in the example.
```js
const component = {
	type: 1,
	components: [
		{
			type: 2,
			customId: "ping.button",
			label: "Pong!",
			style: 1
		}
	]
}
```

- Then create a function called `componentInteraction` inside the command file and send `client`, `interaction` and `customId` arguments from the function.
- Enter the codes you want to run when the component inside the function is triggered
```js
export default {
	name: 'ping',
	description: 'Replies with Pong',
	execute(client, interaction, options) {
		const component = {
			type: 1, // ActionRow
			components: [
				{
					type: 2, // Button
					customId: "ping.button",
					label: "Pong!",
					style: 1
				}
			]
		}
		
		interaction.reply({ components: [component] })
	},
	componentInteraction(client, interaction, customId) {
		interaction.reply("Component triggered!")
	}
}
```
- If you have more than one component, you can check it `customId` (Do not write the command name where it starts).
```js
export default {
	name: 'ping',
	description: 'Replies with Pong',
	execute(client, interaction, options) {
		const component = {
			type: 1, // ActionRow
			components: [
				{
					type: 2, // Button
					customId: "ping.button",
					label: "Pong!",
					style: 1
				}
			]
		}
		
		interaction.reply({ components: [component] })
	},
	componentInteraction(client, interaction, customId) {
		if (customId == "button") {
			interaction.reply("Component triggered!")
		}
	}
}
```
## Handling Autocomplete
- First, let's create a sample autocomplete.
```js
export default {
	name: 'ping',
	description: 'Replies with Pong',
	options: [
		{
			name: "test",
			description: "Test autocomplate option",
			type: 3,
			autocomplete: true,
			required: true
		}
	],
	execute(client, interaction, options) {
		interaction.reply("Pong!")
	}
}
```
- Then create a function called `autocompleteInteraction` inside the command file and send `client`, `interaction` and `focused` arguments from the function.
```js
export default {
	name: 'ping',
	description: 'Replies with Pong',
	options: [
		{
			name: "test",
			description: "Test autocomplate option",
			type: 3,
			autocomplete: true,
			required: true
		}
	],
	execute(client, interaction, options) {
		interaction.reply("Pong!")
	},
	autocompleteInteraction(client, interaction, focused) {
		interaction.respond(
			[
				{
					name: "test",
					value: "test"
				}
			]
		)
	}
}
```
- Each time autocomplete is called the function will run and the focused value will be returned.
```js
export default {
	name: 'ping',
	description: 'Replies with Pong',
	options: [
		{
			name: "test",
			description: "Test autocomplate option",
			type: 3,
			autocomplete: true,
			required: true
		}
	],
	execute(client, interaction, options) {
		interaction.reply("Pong!")
	},
	autocompleteInteraction(client, interaction, focused) {
		console.log(focused)
	}
}
```

## Handling Modals
- First, let's create a sample modal.
- To handle interactions, prefix the `customId` property with the name of the command as in the example.
```js
export default {
	name: 'ping',
	description: 'Replies with Pong',
	execute(client, interaction, options) {
		const modal = {
			title: "Test Modal",
			customId: "ping.modal",
			components: [
				{
					type: 1,
					components: [
						{
							type: 4,
							customId: "test",
							label: "Test Modal",
							style: 1,
							placeholder: "Test"
						}
					]
				}
			]
		}
		interaction.showModal(modal)
	}
}
```
- Then create a function called `modalInteraction` inside the command file and send `client`, `interaction` and `customId` arguments from the function.
- Enter the codes you want to run when the modal inside the function is triggered
```js
export default {
	name: 'ping',
	description: 'Replies with Pong',
	execute(client, interaction, options) {
		const modal = {
			title: "Test Modal",
			customId: "ping.modal",
			components: [
				{
					type: 1,
					components: [
						{
							type: 4,
							customId: "test",
							label: "Test Modal",
							style: 1,
							placeholder: "Test"
						}
					]
				}
			]
		}
		interaction.showModal(modal)
	},
	modalInteraction(client, interaction, customId) {
		interaction.reply("Modal triggered!")
	}
}
```
- If you have more than one modal, you can check it `customId` (Do not write the command name where it starts).
```js
export default {
	name: 'ping',
	description: 'Replies with Pong',
	execute(client, interaction, options) {
		const modal = {
			title: "Test Modal",
			customId: "ping.modal",
			components: [
				{
					type: 1,
					components: [
						{
							type: 4,
							customId: "test",
							label: "Test Modal",
							style: 1,
							placeholder: "Test"
						}
					]
				}
			]
		}
		interaction.showModal(modal)
	},
	modalInteraction(client, interaction, customId) {
		if (customId == "modal") {
			interaction.reply("Modal triggered!")
		}
	}
}
```

## Command Functions
### \<handler>.commands.set({ type, name, ... })
- You can create new commands from within the file you want
- Forced parameters; `name`, `description [only for chatInput commands]`, `execute [function]`
- Optionally parameters; `type`, `guild`, `permissions`, `options`, `componentInteraction [function]`,
`autocompleteInteraction [function]`, `modalInteraction [function]`
```js
<handler>.commands.set({
  //type: 1,
	name: "test",
	description: "Test Command",
  //guild: 895···42,
  //options: [ ··· ],
  //permissions: [ ··· ],
	execute(client, interaction, options) {
		interaction.reply("Test!")
	},
  //componentInteraction(client, interaction, customId) { ··· },
  //autocompleteInteraction(client, interaction, focused) { ··· },
  //modalInteraction(client, interaction, customId) { ··· }
})
```

### \<handler>.commands.get(commandName, callback() => {})
- Get information of the command with the name of your command
- Returns the information of the [promise] command or you can use the callback
```js
<handler>.commands.get("test", command => {
	console.log(command)
})

// or
<handler>.commands.get("test").then(command => {
	console.log(command)
})

// Console Output:
{
	name: "test",
	description: "Test Command",
	execute: [Function: execute]
}
```

### \<handler>.commands.has(commandName, callback() => {})
- Checks whether your command exists with the name you entered.
- returns [promise] boolean or you can use the callback
```js
<handler>.commands.has("test", command => {
	console.log(command)
})

// or
<handler>.commands.has("test").then(command => {
	console.log(command)
})

// Console Output:
true
```

### \<handler>.commands.delete(commandName, callback() => {})
- Deletes of the command with the name of your command
- Returns the information of the [promise] command or you can use the callback
```js
<handler>.commands.delete("test", command => {
	console.log(command)
})

// or
<handler>.commands.delete("test").then(command => {
	console.log(command)
})

// Console Output:
{
	name: "test",
	description: "Test Command",
	execute: [Function: execute]
}
```

## Event Functions
### \<handler>.events.set({ type, name, ... })
- You can create new events from within the file you want
- Forced parameters; `event`, `eventListener [function]`
```js
<handler>.events.set("roleCreate", (role) => { ··· })
```

### \<handler>.events.get(event, callback() => {})
- Get event's function with the name of your event
- Returns the function of the [promise] event function or you can use the callback
```js
<handler>.events.get("ready", eventFunc => {
	console.log(eventFunc.toString())
})

// or
<handler>.events.get("ready").then(eventFunc => {
	console.log(eventFunc.toString())
})

// Console Output:
(client) => { ··· }
```

### \<handler>.events.has(event, callback() => {})
- Checks whether your event exists with the name you entered.
- returns [promise] boolean or you can use the callback
```js
<handler>.events.has("ready", isEvent => {
	console.log(isEvent)
})

// or
<handler>.events.has("ready").then(isEvent => {
	console.log(isEvent)
})

// Console Output:
true
```

### \<handler>.events.delete(event)
- Deletes of the event with the name of your event
```js
<handler>.events.delete("roleCreate")

// or
<handler>.events.delete("roleCreate")
```

# License
All information about the license is in the `LICENSE` file.