import https from "https"
import fs from "fs"
import path from "path"

export function checkModuleUpdate({ checkUpdate = true }) {
    if (checkUpdate) {
        setTimeout(() => {
            console.log("\nChecking for update...")
            https.get("https://registry.npmjs.com/discord.js-managers", (res) => {
                let body = ""
                res.on("data", data => body += data)
                res.on("end", () => {
                    try {
                        const packagePath = path.join(process.cwd(), "node_modules", "discord.js-managers", "package.json")
                        const localVersion = fs.existsSync(packagePath) ? JSON.parse(fs.readFileSync(packagePath, "utf-8")).version : null
                        const latestVersion = JSON.parse(body)["dist-tags"]?.latest

                        if (localVersion && latestVersion === localVersion) {
                            console.log("Your module is in the latest version!")
                            console.log("\nYou can cancel the update check by defining the Handler as `new Handler({ ... , checkUpdate: false })`\n")
                        } else if (latestVersion) {
                            console.log(`Your module is not the latest version. Latest version of the module is ${latestVersion}\nYou can update your module by writing \`npm install discord.js-managers@latest\``)
                            console.log("\nYou can cancel the update check by defining the Handler as `new Handler({ ... , checkUpdate: false })`\n")
                        }
                    } catch (e) {
                        console.error("Error checking for updates:", e)
                    }
                })
            }).on("error", () => {})
        }, 5000)
    }
}
