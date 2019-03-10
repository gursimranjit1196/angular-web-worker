window = this
CHUNK_SIZE = 1024 * 1024 * 5
assetObj = { 
    totalChunks: 0,
    lastChunkDownloaded: 0,
    lastChunkWritten: 0
}

importScripts('chunk_downloader_worker.js', 'fileHandlerWorker.js')

onmessage = function(e) {
    if (!e.data.isNew && e.data.lastChunkWritten) {
        assetObj.lastChunkWritten = e.data.lastChunkWritten
        assetObj.lastChunkDownloaded = e.data.lastChunkDownloaded
    }
    downloadVideo(e.data)
}

function downloadVideo(obj) {
    assetObj.totalChunks = Math.ceil(obj.size / CHUNK_SIZE)
    processVideoDownloadInRec(obj.assetId, obj.url)
}



function processVideoDownloadInRec(assetId, url) {
    console.log("IN processVideoDownloadInRec", assetObj.lastChunkDownloaded + 1)
    if (assetObj.lastChunkDownloaded < assetObj.totalChunks) {

        let fromRange = assetObj.lastChunkDownloaded ? ((CHUNK_SIZE * assetObj.lastChunkDownloaded) + 1) : 0
        let toRange = ((assetObj.lastChunkDownloaded + 1) * CHUNK_SIZE)

        let xhr = new XMLHttpRequest()

        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4) {
                if (xhr.status == 206) {
                    console.log("In response")
                    assetObj.lastChunkDownloaded++

                    // writeChunkToFileSys(assetId, assetObj.lastChunkDownloaded, xhr.response, url)
                    

                    assetObj.lastChunkWritten++
                    postMessage({
                        res: "IN_PROGRESS",
                        lastChunkDownloaded: assetObj.lastChunkDownloaded,
                        lastChunkWritten: assetObj.lastChunkWritten,
                        totalChunks: assetObj.totalChunks
                    })
                    processVideoDownloadInRec(assetId, url)
                } else {

                    console.log("In failure")

                    postMessage({
                        res: "FAILED",
                        lastChunkDownloaded: assetObj.lastChunkDownloaded,
                        lastChunkWritten: assetObj.lastChunkWritten,
                        totalChunks: assetObj.totalChunks
                    })

                }
            }
        }

        xhr.open("get", url, true)
        xhr.responseType = "blob"
        xhr.setRequestHeader("Range", "bytes=" + fromRange + "-" + toRange)
        xhr.setRequestHeader("Pragma", "no-cache");
        xhr.setRequestHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        xhr.send()

    } else {
        console.log("COMPLETE DOWNLOAD")
        console.log(JSON.parse(JSON.stringify(assetObj)))
        postMessage({
            res: "SUCCESS",
            lastChunkDownloaded: assetObj.lastChunkDownloaded,
            lastChunkWritten: assetObj.lastChunkWritten,
            totalChunks: assetObj.totalChunks
        })
    }
}

function writeChunkToFileSys(assetId, chunkIndex, blob, url) {
    console.log("In writeChunkToFileSys")
    let rfs = window["requestFileSystem"] || window["webkitRequestFileSystem"]
    rfs["directoryEntry"] = window["directoryEntry"] || window["directoryEntry"]

    rfs(window["PERSISTENT"], 1024*1024, (fs) => {

        let filePath = `${assetId}.mp4`

        fs.root.getFile(filePath, { create: chunkIndex === 1 }, 
            (fileEntry) => {

                fileEntry.createWriter(
                    (fileWriter) => {
        
                        if (chunkIndex != 1) fileWriter.seek(fileWriter.length) // Start write position at EOF.
            
                        fileWriter.onwriteend = (e) => { 
                            console.log(chunkIndex, "WRITTEN.")
                            assetObj.lastChunkWritten++
                            postMessage({
                                res: "IN_PROGRESS",
                                lastChunkDownloaded: assetObj.lastChunkDownloaded,
                                lastChunkWritten: assetObj.lastChunkWritten,
                                totalChunks: assetObj.totalChunks
                            })
                            processVideoDownloadInRec(assetId, url)
                        }
              
                        fileWriter.onerror = function(e) {
                            console.log('Write failed: ' + e.toString())
                        }

                        fileWriter.write(blob)
            
                    },
                    (err) => {
                        console.log("ERROR WHILE WRITING DATA IN FILE")
                        rej(false)
                    }
                )

            }, 
            function () {
                console.log("ERROR IN CREATING CHUNK FILE")
            }
        )

    }, function () {})
}





// PROCESS DOWNLOAD PROCESS WITH SEPERATE WORKERS


// assetObj = { 
//     totalChunks: 0,
//     lastChunkDownloaded: 0,
//     lastChunkWritten: 0,
//     chunkDetails: {}
// }

// chunkWorker = {
//     isAllChunksDownloaded: false
// }

// fileHandlerWorker = {
//     isWorkerFree: true,
//     lastChunkWritten: 0
// }


// function processVideoDownload(asset_id, url) {

//     if (assetObj.lastChunkDownloaded < assetObj.totalChunks) {

//         let fromRange = assetObj.lastChunkDownloaded ? ((CHUNK_SIZE * assetObj.lastChunkDownloaded) + 1) : 0
//         let toRange = ((assetObj.lastChunkDownloaded + 1) * CHUNK_SIZE)

//         createSubWorkers(asset_id, assetObj.lastChunkDownloaded + 1, url, fromRange, toRange)
//     } else {
//         console.log("COMPLETE DOWNLOAD")
//         chunkWorker.isAllChunksDownloaded = true
//     }

// }


// function createSubWorkers(assetId, chunkIndex, url, fromRange, toRange) {
//     let worker = new Worker("chunk_downloader_worker.js")

//     worker.postMessage({
//         url,
//         fromRange,
//         toRange
//     })

//     worker.onmessage = (response) => {
//         assetObj.chunkDetails[chunkIndex] = response.data
//         console.log("RESPONSE OF CHUNK DOWNLOADER:  ", chunkIndex)
//         worker.terminate()
//         assetObj.lastChunkDownloaded++
//         processVideoDownload(assetId, url)
//         if (fileHandlerWorker.isWorkerFree) processChunkInFileSystem(assetId)
//     }
// }


// function processChunkInFileSystem(assetId) {
//     let nextChunk = fileHandlerWorker.lastChunkWritten + 1

//     if (nextChunk > assetObj.totalChunks && chunkWorker.isAllChunksDownloaded) {
//         console.log("ALL CHHUNKS WRITTEN SUCCESSFULLY")
//         postMessage(true)
//         return
//     }

//     if (assetObj.chunkDetails[nextChunk]) {
//         writeChunkInFileSystem(assetId, nextChunk)
//     }
// }


// function writeChunkInFileSystem(assetId, chunkIndex) {
//     let worker = new Worker("fileHandlerWorker.js")

//     fileHandlerWorker.isWorkerFree = false

//     worker.postMessage({
//         assetId,
//         chunkIndex,
//         urlResponse: assetObj.chunkDetails[chunkIndex]
//     })

//     worker.onmessage = (response) => {
//         console.log("RESPONSE OF FILE WRITTER:   ", chunkIndex)
//         if (response.data.isSuccessfullyWritten) {
//             fileHandlerWorker.isWorkerFree = true
//             delete assetObj.chunkDetails[chunkIndex]
//             fileHandlerWorker.lastChunkWritten++
//             processChunkInFileSystem(assetId)
//         }
//         worker.terminate()
//     }
// }