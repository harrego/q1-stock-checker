// File system imports
const fs = require("fs/promises")
const path = require("path")

// Parser imports
const parse = require("csv-parse")
const stringify = require("csv-stringify")

const cacheCsv = path.join(__dirname, "cache.csv")

// Main functions
function readCache() {
    return new Promise(async (resolve, reject) => {
        try {
            // Variables
            var data
            
            // Read the CSV file data
            const fileData = await fs.readFile(cacheCsv)

            parse(fileData, {
                delimiter: ",",
                columns: true
            }, (err, records) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(records)
                }
            })
        } catch (err) {
            reject(err)
        }
    })
}
exports.readCache = readCache

function stringifyPromise(data) {
    return new Promise((resolve, reject) => {
        stringify(data, { columns: ["available", "id", "name", "sku", "date"], header: true }, (err, str) => {
            if (err) {
                reject(err)
            } else {
                resolve(str)
            }
        })
    })
}

function writeCache(data) {
    return new Promise(async (resolve, reject) => {
        try {
            const fileData = await stringifyPromise(data)
            await fs.writeFile(cacheCsv, fileData)
        } catch (err) {
            reject(err)
        }
    })
}
exports.writeCache = writeCache
