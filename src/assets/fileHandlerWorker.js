window = this

onmessage = async function(e) {

    await writeChunkToFS(e.data.assetId, e.data.chunkIndex, e.data.urlResponse)

    postMessage({
        isSuccessfullyWritten: true
    })
    
}

async function writeChunkToFS(assetId, chunkIndex, blob) {
    return new Promise((res, rej) => {

        let rfs = window["requestFileSystem"] || window["webkitRequestFileSystem"]
        rfs["directoryEntry"] = window["directoryEntry"] || window["directoryEntry"]

        rfs(window["PERSISTENT"], 1024*1024, async (fs) => {

            let filePath = `${assetId}.mp4`

            fs.root.getFile(filePath, { create: chunkIndex === 1 }, 
                async (fileEntry) => {
                    await this.writeChunkInFile(fileEntry, blob, chunkIndex)
                    res(true)
                }, 
                function () {
                    console.log("ERROR IN CREATING CHUNK FILE")
                }
            )

        }, function () {})

    })
}



async function writeChunkInFile(fileEntry, blob, chunkIndex) {
    return new Promise((res, rej) => {
        fileEntry.createWriter(
            (fileWriter) => {

                if (chunkIndex != 1) fileWriter.seek(fileWriter.length) // Start write position at EOF.
    
                fileWriter.onwriteend = function(e) { 
                    console.log(chunkIndex, "WRITTEN.")
                    res(true) 
                }
      
                fileWriter.onerror = function(e) {
                    console.log('Write failed: ' + e.toString())
                    rej(false)
                }
      
                fileWriter.write(blob)
    
            },
            (err) => {
                console.log("ERROR WHILE WRITING DATA IN FILE")
                rej(false)
            }
        )
    })
}