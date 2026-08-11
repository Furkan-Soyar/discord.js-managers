import fs from "fs"
import path from "path"
import { pathToFileURL } from "url"

const events = new Map()

export function eventManager({ client, eventsFolder = "events", consoleLogging = true }) {
    const basePath = process.cwd()
    const targetEventsFolder = path.join(basePath, eventsFolder)

    const importEvents = async () => {
        if (!fs.existsSync(targetEventsFolder)) return

        const loadedEvents = []
        for (const eventFile of fs.readdirSync(targetEventsFolder)) {
            if (!eventFile.endsWith(".js")) continue
            const filePath = path.join(targetEventsFolder, eventFile)
            const fileUrl = pathToFileURL(filePath).href

            try {
                const { default: event } = await import(fileUrl)
                const eventName = eventFile.replace(".js", "")
                events.set(eventName, event)
                loadedEvents.push(eventName)
            } catch (e) {
                console.error(`Error loading event file ${eventFile}:`, e)
            }
        }

        if (consoleLogging && loadedEvents.length > 0) {
            await new Promise(r => setTimeout(r, 20))
            for (const eventName of loadedEvents) {
                console.log(`Event synchronized > ${eventName}`)
            }
            console.log()
        }
    }

    return {
        async create(event, eventListener) {
            const filePath = path.join(targetEventsFolder, `${event}.js`)
            await fs.promises.writeFile(filePath, `export default ${eventListener.toString()}`)
            events.set(event, eventListener)
            if (consoleLogging) {
                console.log(`Event synchronized > ${event}`)
            }
            client.on(event, (...args) => eventListener(client, ...args))
        },

        async delete(event) {
            if (!events.size) await importEvents()

            const filePath = path.join(targetEventsFolder, `${event}.js`)
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
            }
            events.delete(event)
        },

        async get(event, callback = () => { }) {
            if (!events.size) await importEvents()
            return callback(events.get(event))
        },

        async has(event, callback = () => { }) {
            if (!events.size) await importEvents()
            return callback(events.has(event))
        },

        async synchronize() {
            if (!events.size) await importEvents()

            events.forEach((eventFunc, event) => {
                client.on(event, (...args) => eventFunc(client, ...args))
            })
        }
    }
}
