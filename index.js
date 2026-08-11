import { commandManager } from "./src/commandManager.js"
import { eventManager } from "./src/eventManager.js"
import { setupTranslate } from "./src/translateManager.js"
import { checkModuleUpdate } from "./src/checkUpdate.js"

export default class Handler {
    constructor({ client, commandsFolder = "commands", eventsFolder = "events", localesFolder = "locales", defaultLanguage = "en-US", consoleLogging = true, checkUpdate = true }) {
        this.commands = commandManager({ client, commandsFolder, localesFolder, consoleLogging })
        this.events = eventManager({ client, eventsFolder, consoleLogging })

        setupTranslate({ client, localesFolder, defaultLanguage })
        checkModuleUpdate({ checkUpdate })

        process.on("unhandledRejection", (error) => console.error("[Unhandled Rejection]", error))
        process.on("uncaughtException", (error) => console.error("[Uncaught Exception]", error))
    }
}