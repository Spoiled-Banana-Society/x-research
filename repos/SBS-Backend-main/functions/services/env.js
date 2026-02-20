const internals = {}
const fs = require("fs")

//🚀ENSURE YOU ARE POINTED TO THE CORRECT FILE BEFORE DEPLOYMENT!
//let env = require('../configs/dev2_env.json');
// let env = require("../configs/dev-setup.json")
//let env = require("../configs/triggers_dev_env.json");
// let env = require("../configs/prod-caleb.json")
let env = require('../configs/sbs-prod-env.json')

internals.get = (key) => {
    let value
    if (!key) return env
    value = env[key]
    if (!value) throw new Error(`...${key} not found in env`)
    return env[key]
}

internals.set = async (key, value) => {
    env[key] = value
    console.log(env)
    fs.writeFileSync("./configs/env.json", JSON.stringify(env, null, 2))
    console.log(`...Key:${key} set to Value:${value}`)
}

module.exports = internals

/*
    gsutil cp gs://sbs-prod-env-db-backups/2024-09-03T03:00:07_84126 gs://sbs-test-env-db-backups/2024-09-03T03:00:07_84126
    */
    

