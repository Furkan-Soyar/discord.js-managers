import fs from "fs"
import path from "path"
import { pathToFileURL } from "url"

const commands = new Map()

function applyLocalizations(command, localeData, locale) {
    if (!localeData?.[command.name]) return

    command.name_localizations = command.name_localizations || {}
    command.description_localizations = command.description_localizations || {}
    if (localeData[command.name].name) command.name_localizations[locale] = localeData[command.name].name
    if (localeData[command.name].description) command.description_localizations[locale] = localeData[command.name].description

    function processOptions(options, dataOptions) {
        if (!options || !dataOptions) return
        for (const opt of options) {
            const optData = dataOptions[opt.name]
            if (!optData) continue

            opt.name_localizations = opt.name_localizations || {}
            opt.description_localizations = opt.description_localizations || {}
            if (optData.name) opt.name_localizations[locale] = optData.name
            if (optData.description) opt.description_localizations[locale] = optData.description

            if (opt.options && optData.options) {
                processOptions(opt.options, optData.options)
            }
            if (opt.choices && optData.choices) {
                for (const choice of opt.choices) {
                    const choiceData = optData.choices[choice.name]
                    if (choiceData) {
                        choice.name_localizations = choice.name_localizations || {}
                        if (choiceData.name) choice.name_localizations[locale] = choiceData.name
                    }
                }
            }
        }
    }

    if (command.options && localeData[command.name].options) {
        processOptions(command.options, localeData[command.name].options)
    }
}

export function commandManager({ client, commandsFolder = "commands", localesFolder = "locales", consoleLogging = true }) {
    const basePath = process.cwd()
    const targetCommandsFolder = path.join(basePath, commandsFolder)
    const targetLocalesFolder = path.join(basePath, localesFolder)

    const loadedCommands = []

    const readCommandsRecursively = async (dirPath, relativeCategory = "") => {
        if (!fs.existsSync(dirPath)) return

        for (const item of fs.readdirSync(dirPath)) {
            const itemPath = path.join(dirPath, item)
            const stat = fs.statSync(itemPath)

            if (stat.isDirectory()) {
                const subCategory = relativeCategory ? `${relativeCategory}/${item}` : item
                await readCommandsRecursively(itemPath, subCategory)
            } else if (item.endsWith(".js")) {
                const fileUrl = pathToFileURL(itemPath).href
                try {
                    const { default: command } = await import(fileUrl)
                    if (!command || !command.name) continue

                    if (relativeCategory && !command.category) {
                        command.category = relativeCategory
                    }

                    if (fs.existsSync(targetLocalesFolder)) {
                        for (const locale of fs.readdirSync(targetLocalesFolder)) {
                            const dataPath = path.join(targetLocalesFolder, locale, "commandData.json")
                            if (fs.existsSync(dataPath)) {
                                try {
                                    const dataUrl = pathToFileURL(dataPath).href
                                    const { default: data } = await import(dataUrl)
                                    applyLocalizations(command, data, locale)
                                } catch (e) {
                                    console.error(`Error loading commandData.json for ${locale}:`, e)
                                }
                            }
                        }
                    }

                    commands.set(command.name, command)
                    loadedCommands.push(command)
                } catch (e) {
                    console.error(`Error loading command ${itemPath}:`, e)
                }
            }
        }
    }

    const importCommands = async () => {
        loadedCommands.length = 0
        await readCommandsRecursively(targetCommandsFolder)

        if (consoleLogging && loadedCommands.length > 0) {
            for (const command of loadedCommands) {
                const categoryPrefix = command.category ? `${command.category} command` : "Command"
                console.log(`${categoryPrefix} synchronized > ${command.name[0].toUpperCase() + command.name.slice(1)}`)
            }
            console.log()
        }
    }

    return {
        async create(command = { category, type: 1, name, description, cooldown, guild, permissions, options, execute() { }, componentInteraction() { }, autocompleteInteraction() { }, modalInteraction() { } }) {
            commands.set(command.name, command)
            const targetPath = path.join(targetCommandsFolder, `${command.category ? command.category : ""}${command.name}.js`)
            
            await fs.promises.writeFile(targetPath, `export default {${command.type ? `\n\ttype: ${command.type},` : ""}${command.name ? `\n\tname: "${command.name}",` : ""}${command.description ? `\n\tdescription: "${command.description}",` : ""}${command.cooldown ? `\n\tcooldown: "${command.cooldown}",` : ""}${command.guild ? `\n\tguild: ${command.guild},` : ""}${command.permissions ? `\n\tpermissions: ${JSON.stringify(command.permissions)},` : ""}${command.options ? `\n\toptions: ${JSON.stringify(command.options)},` : ""}${command.execute.toString() ? `\n\t${command.execute.toString()},` : ""}${command.componentInteraction?.toString() ? `\n\t${command.componentInteraction?.toString()},` : ""}${command.autocompleteInteraction?.toString() ? `\n\t${command.autocompleteInteraction?.toString()},` : ""}${command.modalInteraction?.toString() ? `\n\t${command.modalInteraction?.toString()}` : ""}\n}`)

            const buildPayload = (cmd) => ({
                type: cmd.type,
                name: cmd.name,
                description: cmd.description,
                name_localizations: cmd.name_localizations,
                description_localizations: cmd.description_localizations,
                defaultMemberPermissions: cmd.permissions || "UseApplicationCommands",
                options: cmd.options
            })

            client.guilds.cache.forEach(guild => {
                if (!command.guild || command.guild === guild.id) {
                    guild.commands.create(buildPayload(command))
                }
                if (consoleLogging) {
                    console.log(`Command synchronized > ${command.name[0].toUpperCase() + command.name.slice(1)}`)
                }
            })
        },

        async delete(commandName) {
            if (!commands.size) await importCommands()

            commands.delete(commandName)
            client.guilds.cache.forEach(async guild => {
                const existing = guild.commands.cache.find(c => c.name === commandName)
                if (existing) guild.commands.delete(existing.id)
            })

            if (fs.existsSync(targetCommandsFolder)) {
                for (const commandFile of fs.readdirSync(targetCommandsFolder)) {
                    const filePath = path.join(targetCommandsFolder, commandFile)
                    try {
                        const fileUrl = pathToFileURL(filePath).href
                        const { default: command } = await import(fileUrl)
                        if (command?.name === commandName) {
                            fs.unlinkSync(filePath)
                        }
                    } catch (e) { }
                }
            }
        },

        async get(commandName, callback = command => { }) {
            if (!commands.size) await importCommands()
            return callback(commands.get(commandName))
        },

        async has(commandName, callback = isCommand => { }) {
            if (!commands.size) await importCommands()
            return callback(commands.has(commandName))
        },

        async synchronize() {
            if (!commands.size) await importCommands()

            const registerCommands = () => {
                const buildPayload = (cmd) => ({
                    type: cmd.type,
                    name: cmd.name,
                    description: cmd.description,
                    name_localizations: cmd.name_localizations,
                    description_localizations: cmd.description_localizations,
                    defaultMemberPermissions: cmd.permissions || "UseApplicationCommands",
                    options: cmd.options
                })

                client.guilds.cache.forEach(guild => {
                    const guildPayloads = []
                    commands.forEach(command => {
                        if (!command.guild || command.guild === guild.id) {
                            guildPayloads.push(buildPayload(command))
                        }
                    })
                    guild.commands.set(guildPayloads).catch(err => console.error(`Error setting commands for guild ${guild.id}:`, err))
                })
            }

            if (client.isReady()) {
                registerCommands()
            } else {
                client.once("clientReady", registerCommands)
            }

            if (!client.listenerCount('interactionCreate')) client.on('interactionCreate', async (interaction) => {
                try {
                    if (interaction.isCommand()) {
                        const command = commands.get(interaction.commandName)
                        if (!command) return

                        if (command.cooldown) {
                            if (interaction.user.cooldowns) {
                                if (interaction.user.cooldowns.get(command.name) - Date.now() > 0) {
                                    await interaction.reply({
                                        embeds: [
                                            {
                                                title: '❌ Error ❌',
                                                description: `You can use this command again in **\`${Math.round((interaction.user.cooldowns.get(command.name) - Date.now()) / 100) / 10}\`** seconds`,
                                                color: 0xff0000
                                            }
                                        ]
                                    })
                                } else {
                                    await command.execute(client, interaction, interaction.options)
                                    interaction.user.cooldowns.set(command.name, Date.now() + command.cooldown * 1000)
                                }
                            } else {
                                await command.execute(client, interaction, interaction.options)
                                interaction.user.cooldowns = new Map()
                                interaction.user.cooldowns.set(command.name, Date.now() + command.cooldown * 1000)
                            }
                        } else {
                            await command.execute(client, interaction, interaction.options)
                        }
                    } else if (interaction.isMessageComponent()) {
                        const cmdName = interaction.customId.split(".")[0]
                        await commands.get(cmdName)?.componentInteraction?.(client, interaction, interaction.customId.split(".")[1])
                    } else if (interaction.isAutocomplete()) {
                        await commands.get(interaction.commandName)?.autocompleteInteraction?.(client, interaction, interaction.options.getFocused())
                    } else if (interaction.isModalSubmit()) {
                        const cmdName = interaction.customId.split(".")[0]
                        await commands.get(cmdName)?.modalInteraction?.(client, interaction, interaction.customId.split(".")[1])
                    }
                } catch (error) {
                    console.error(error)
                    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
                        interaction.reply({
                            flags: 64,
                            embeds: [
                                {
                                    title: '❌ Error ❌',
                                    description: 'An error occurred while running this command',
                                    color: 0xff0000
                                }
                            ]
                        }).catch(() => {})
                    }
                }
            })

            client.on('guildCreate', (guild) => {
                const buildPayload = (cmd) => ({
                    type: cmd.type,
                    name: cmd.name,
                    description: cmd.description,
                    name_localizations: cmd.name_localizations,
                    description_localizations: cmd.description_localizations,
                    defaultMemberPermissions: cmd.permissions || "UseApplicationCommands",
                    options: cmd.options
                })
                const guildPayloads = []
                commands.forEach(command => {
                    if (!command.guild || command.guild === guild.id) {
                        guildPayloads.push(buildPayload(command))
                    }
                })
                guild.commands.set(guildPayloads).catch(err => console.error(`Error setting commands for new guild ${guild.id}:`, err))
            })
        }
    }
}
