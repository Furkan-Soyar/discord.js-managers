import fs from "fs"
import path from "path"

export function setupTranslate({ client, localesFolder = "locales", defaultLanguage = "en-US" }) {
    const basePath = process.cwd()
    const targetLocalesFolder = path.join(basePath, localesFolder)

    if (fs.existsSync(targetLocalesFolder)) {
        const locales = new Map()

        for (const localeFolder of fs.readdirSync(targetLocalesFolder)) {
            const folderPath = path.join(targetLocalesFolder, localeFolder)
            if (!fs.statSync(folderPath).isDirectory()) continue

            locales.set(localeFolder, new Map())

            for (const localeFile of fs.readdirSync(folderPath)) {
                if (!localeFile.endsWith(".json")) continue
                const filePath = path.join(folderPath, localeFile)
                try {
                    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"))
                    locales.get(localeFolder).set(localeFile.replace(".json", ""), content)
                } catch (e) {
                    console.error(`Error loading locale file ${filePath}:`, e)
                }
            }
        }

        client.translate = (key, interaction, variables = {}, file = "command") => {
            const userLocale = typeof interaction === "object" && interaction?.locale
                ? interaction.locale
                : (typeof interaction === "string" ? interaction : defaultLanguage)
            
            const targetLocale = locales.has(userLocale) ? userLocale : defaultLanguage
            const fileMap = locales.get(targetLocale)

            if (!fileMap) return key

            const processVariables = (str) => {
                if (typeof str !== "string") return str
                return str.replaceAll(/\{.*?\}/g, match => {
                    const varPath = match.replace("{", "").replace("}", "")
                    const val = varPath.split(".").reduce((acc, current) => acc?.[current], variables)
                    return val !== undefined && val !== null ? val : match
                })
            }

            if (file === "command") {
                const commandName = typeof interaction === "object"
                    ? (interaction.commandName || (interaction.customId ? interaction.customId.split(".")[0] : ""))
                    : ""
                
                const localeFileData = fileMap.get(file)?.[commandName]
                if (!localeFileData) return key

                const result = key.split(".").reduce((acc, current) => acc?.[current], localeFileData)

                if (typeof result === "object" && result !== null) {
                    return result
                }

                return processVariables(result ?? key)
            } else {
                const localeFileData = fileMap.get(file)
                if (!localeFileData) return key

                const result = key.split(".").reduce((acc, current) => acc?.[current], localeFileData)

                if (typeof result === "object" && result !== null) {
                    return result
                }

                return processVariables(result ?? key)
            }
        }
    }
}
