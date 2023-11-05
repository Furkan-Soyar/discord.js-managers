import https from "https"
import fs from "fs"

const commands = new Map()
const events = new Map()
const options = {}

export default class Handler {
	constructor({ client, commandsFolder, eventsFolder, consoleLogging, checkUpdate = true }) {
		options.commandsFolder = commandsFolder
        options.eventsFolder = eventsFolder
		
		if (checkUpdate) {
            (async () => {
                await console.log("Checking for update...")
                await https.get("https://registry.npmjs.com/discord.js-managers", (res) => {
                    let body = ""
                    res.on("data", data => body += data)
                    res.on("end", () => {
                        if ((JSON.parse(body))["dist-tags"].latest == JSON.parse(fs.readFileSync("node_modules/discord.js-managers/package.json")).version) {
                            console.log("Your module is in the latest version!")
                            console.log("\nYou can cancel the update check by defining the Handler as `new Handler({ ... , checkUpdate: false })`")
                        } else {
                            console.log(`Your module is not the latest version. Latest version of the module is ${(JSON.parse(body))["dist-tags"].latest}\nYou can update your module by writing \`npm install discord.js-managers@latest\``)
                            console.log("\nYou can cancel the update check by defining the Handler as `new Handler({ ... , checkUpdate: false })`")
                        }
                    })
                })
            })()
		}

        this.commands = {
            async create(command={ type: 1, name, description, guild, permissions, options, execute() {}, componentInteraction() {}, autocompleteInteraction() {}, modalInteraction() {} }) {
                await fs.writeFileSync(`${process.cwd().replaceAll("\\", "/")}/${options.commandsFolder}/${command.name}.js`, `export default {${command.type ? `\n\ttype: ${command.type},` : ""}${command.name ? `\n\tname: "${command.name}",` : ""}${command.description ? `\n\tdescription: "${command.description}",` : ""}${command.guild ? `\n\tguild: ${command.guild},` : ""}${command.permissions ? `\n\tpermissions: ${JSON.stringify(command.permissions)},` : ""}${command.options ? `\n\toptions: ${JSON.stringify(command.options)},` : ""}${command.execute.toString() ? `\n\t${command.execute.toString()},` : ""}${command.componentInteraction?.toString() ? `\n\t${command.componentInteraction?.toString()},` : ""}${command.autocompleteInteraction?.toString() ? `\n\t${command.autocompleteInteraction?.toString()},` : ""}${command.modalInteraction?.toString() ? `\n\t${command.modalInteraction?.toString()}` : ""}\n}`)
                await import(`file://${process.cwd().replaceAll("\\", "/")}/${options.commandsFolder}/${command.name}.js`).then(file => commands.set(file.default.name, file.default))
                client.guilds.cache.forEach(async guild => {
                    await guild.commands.fetch().then(() => {
                        if (command.guild == guild.id) {
                            guild.commands.create({
                                type: command.type,
                                name: command.name,
                                description: command.description,
                                defaultMemberPermissions: command.permissions,
                                options: command.options
                            })
                            if (consoleLogging) {
                                console.log(`Command synchronized > ${command.name[0].toUpperCase() + command.name.slice(1)}`)
                            }
                        } else {
                            guild.commands.create({
                                type: command.type,
                                name: command.name,
                                description: command.description,
                                defaultMemberPermissions: command.permissions,
                                options: command.options
                            })
                            if (consoleLogging) {
                                console.log(`Command synchronized > ${command.name[0].toUpperCase() + command.name.slice(1)}`)
                            }
                        }
                    })
                })
            },
        
            async delete(commandName) {
                if (!commands.size) await importCommands()
        
                commands.delete(commandName)
                client.guilds.cache.forEach(async guild => guild.commands.delete(guild.commands.get(commandName)))
                fs.readdirSync(`${process.cwd().replaceAll("\\", "/")}/${options.commandsFolder}`).filter(async commandFile => {
                    const file = await import(`file://${process.cwd().replaceAll("\\", "/")}/${options.commandsFolder}/${commandFile}`)
                    if (file.default.name == commandName) {
                        fs.unlinkSync(`${process.cwd().replaceAll("\\", "/")}/${options.commandsFolder}/${commandFile}`)
                    }
                })
                
            },
        
            async get(commandName, callback=command => {}) {
                if (!commands.size) await importCommands()
                
                return callback(commands.get(commandName))
            },
        
            async has(commandName, callback=command => {}) {
                if (!commands.size) await importCommands()
                
                return callback(commands.has(commandName))
            },
            
            async synchronize() {
                if (!commands.size) await importCommands()
        
                client.once("ready", () => {
                    client.guilds.cache.forEach(async guild => {
                        await guild.commands.fetch().then(() => {
                            commands.forEach(command => {
                                if (command.guild == guild.id) {
                                    guild.commands.create({
                                        type: command.type,
                                        name: command.name,
                                        description: command.description,
                                        defaultMemberPermissions: command.permissions,
                                        options: command.options
                                    })
            
                                    if (consoleLogging) {
                                        console.log(`Command synchronized > ${command.name[0].toUpperCase() + Command.name.slice(1)}`)
                                    }
                                } else {
                                    guild.commands.create({
                                        type: command.type,
                                        name: command.name,
                                        description: command.description,
                                        defaultMemberPermissions: command.permissions,
                                        options: command.options
                                    })
            
                                    if (consoleLogging) {
                                        console.log(`Command synchronized > ${command.name[0].toUpperCase() + command.name.slice(1)}`)
                                    }
                                }
                            })
            
                            guild.commands.cache.forEach(command => {
                                if (!Array.from(commands.keys()).includes(command.name)) {
                                    guild.commands.delete(command.id)
                                }
                            })
                        })
                    })
            
                    client.on('interactionCreate', async (interaction) => {
                        if (interaction.isCommand()) {
                            const command = commands.get(interaction.command.name)
            
                            try {
                                command.execute(client, interaction, interaction.options)
                            } catch (error) {
                                interaction.reply({
                                    embeds: [
                                        {
                                            title: '❌ Error ❌',
                                            description: 'An error occurred while running this command',
                                            color: 0xff0000
                                        }
                                    ]
                                })
                                console.error(error)
                            }
                        } else if (interaction.isMessageComponent()) {
                            const command = commands.get(interaction.customId.split(".")[0])
            
                            try {
                                command.componentInteraction(client, interaction, interaction.customId.split(".")[1])
                            } catch (error) {
                                console.error(error)
                            }
                        } else if (interaction.isAutocomplete()) {
                            const command = commands.get(interaction.command.name)
            
                            try {
                                command.autocompleteInteraction(client, interaction, interaction.options.getFocused())
                            } catch (error) {
                                console.error(error)
                            }
                        } else if (interaction.isModalSubmit()) {
                            const command = commands.get(interaction.customId.split(".")[0])
            
                            try {
                                command.modalInteraction(client, interaction, interaction.customId.split(".")[1])
                            } catch (error) {
                                console.error(error)
                            }
                        }
                    })
            
                    client.on('guildCreate', (guild) => {
                        commands.forEach(command => {
                            if (command.guild == guild.id) {
                                guild.commands.create({
                                    type: command.type,
                                    name: command.name,
                                    description: command.description,
                                    defaultMemberPermissions: command.permissions,
                                    options: command.options,
                                })
                            } else {
                                guild.commands.create({
                                    type: command.type,
                                    name: command.name,
                                    description: command.description,
                                    defaultMemberPermissions: command.permissions,
                                    options: command.options,
                                })
                            }
                        })
                    })
                })
            }
        }

        this.events = {
            async create(event, eventListener) {
                await fs.writeFileSync(`${process.cwd().replaceAll("\\", "/")}/${options.eventsFolder}/${event}.js`, `export default${eventListener.toString().slice(0, eventListener.toString().indexOf("{")).includes("client") ? eventListener.toString() : eventListener.toString().slice(0, eventListener.toString().indexOf("{")).includes("(") ? eventListener.toString().replace("(", eventListener.toString().includes("()") ? "(client" : "(client, ") : eventListener.toString().replace("", " (client, ").replace("=>", ") =>")}`)
                await import(`file://${process.cwd().replaceAll("\\", "/")}/${options.eventsFolder}/${event}.js`).then(file => events.set(event, eventListener))
                console.log(`Event synchronized > ${event}`)
                client.on(event, eventListener)
            },

            async delete(event) {
                if (!events.size) await importEvents()

                fs.unlinkSync(`${process.cwd().replaceAll("\\", "/")}/${options.eventsFolder}/${event}.js`)
                client.off(event, client.listeners(event)[0])
                events.delete(event)
            },

            async get(event, callback = () => {}) {
                if (!events.size) await importEvents()

                return callback(events.get(event))
            },

            async has(event, callback = () => {}) {
                if (!events.size) await importEvents()

                return callback(events.has(event))
            },

            async synchronize() {
                if (!events.size) await importEvents()

                setTimeout(() => {
                    for (const eventFile of fs.readdirSync(`${process.cwd().replaceAll("\\", "/")}/${options.eventsFolder}`)) {
                        import(`file://${process.cwd().replaceAll("\\", "/")}/${options.eventsFolder}/${eventFile}`).then(file => {
                            client.on(eventFile.slice(0, eventFile.indexOf(".")), (...args) => file.default(client, ...args))
                            
                            if (consoleLogging) {
                                console.log(`Event synchronized > ${eventFile.slice(0, eventFile.indexOf("."))}`)              
                            }
                        })
                    }
                }, 1000)
            }
        }
    }
}

function importCommands() {
    for (let commandFile of fs.readdirSync(`${process.cwd().replaceAll("\\", "/")}/${options.commandsFolder}`)) {
        import(`file://${process.cwd().replaceAll("\\", "/")}/${options.commandsFolder}/${commandFile}`).then(file => {
            commands.set(file.default.name, file.default)
        })
    }
}

function importEvents() {
    for (const eventFile of fs.readdirSync(`${process.cwd().replaceAll("\\", "/")}/${options.eventsFolder}`)) {
        import(`file://${process.cwd().replaceAll("\\", "/")}/${options.eventsFolder}/${eventFile}`).then(file => {
            events.set(eventFile.slice(0, eventFile.indexOf(".")), file.default)
        })
    }
}