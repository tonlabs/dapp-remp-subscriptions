const { spawn } = require("child_process")

const num = parseInt(process.argv[2]) || 1
let procCounter = num
let exitCode = 0

console.log("Starting %d instances", num)

for (let i = 0; i < num; i++) {
    const proc = spawn("npm", ["start"])

    proc.stdout.on("data", data => {
        console.log(`Process ${i}`, data.toString())
    })

    // proc.stderr.on("data", data => {
    //    console.log(`Process ${i}`, data.toString())
    // })

    proc.on("close", code => {
        exitCode += code
        procCounter--
        if (procCounter === 0) process.exit(exitCode)
    })
}
