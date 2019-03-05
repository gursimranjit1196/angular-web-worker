import { Subject } from 'rxjs';

import { VIDEO_URLS, ENC_KEY_URL } from "../constants/videoURL";

import { ChunkInfo } from '../models/chunkInfo.model';
import { environment } from 'src/environments/environment';

export class AppService {

    private _workerResponse = {}

    get workerResponse() {
        return this._workerResponse
    }

    downloadVideoWithWorker(asset_id) {
        
        if (VIDEO_URLS[asset_id] && VIDEO_URLS[asset_id].length) {
            let chunkInfoArr:ChunkInfo[] = []
            this._workerResponse[asset_id] = chunkInfoArr
            VIDEO_URLS[asset_id].forEach((url, i) => {

                let chunkInfoObj = new ChunkInfo()
                chunkInfoObj.id = i + 1
                chunkInfoObj.asset_id = asset_id
                chunkInfoObj.url = url
                chunkInfoObj.name = url.substring(url.lastIndexOf("/") + 1)
                chunkInfoArr.push(chunkInfoObj)

                this.getDataFromWorker(asset_id, chunkInfoObj)

            });
        }
    }

    getDataFromWorker(asset_id, chunkInfoObj) {
        let worker = new Worker("assets/worker.js")

        worker.postMessage({ ...chunkInfoObj, task: "DownloadChunk" });

        worker.onmessage = (response) => {
            let res: ChunkInfo = response.data
            chunkInfoObj.response = res.response
            chunkInfoObj.result = true
            chunkInfoObj.isWorkder = res.isWorkder
            worker.terminate()
            this.saveDataToExt(chunkInfoObj)
        }
    }


    async saveDataToExt(chunkInfoObj: ChunkInfo) {
        
        let rfs = window["requestFileSystem"] || window["webkitRequestFileSystem"]
        rfs["directoryEntry"] = window["directoryEntry"] || window["directoryEntry"]

        rfs(window["PERSISTENT"], 1024*1024, async (fs) => {

            let dirPath = `${ environment.production ? "PROD" : "DEV" }/${ chunkInfoObj.asset_id }`            

            let dirPathRes = await this.createDirPath(fs.root, dirPath.split('/'), false)

            let filePath = `${dirPath}/${chunkInfoObj.name}`

            fs.root.getFile(filePath, { create: true }, 
                async (fileEntry) => {
                    let fileResponse = await this.writeInFile(fileEntry, chunkInfoObj)

                    fs.root.getFile(filePath, { create: false }, function() {
                        console.log("FILE FOUND", filePath) 
                        fileEntry.getMetadata(function(metadata) { console.log("METADETA", metadata) })
                    }, function() { console.log("FILE NOT FOUND AFTER WRITE", filePath) })

                }, 
                function () {
                    console.log("ERROR IN CREATING CHUNK FILE")
                }
            )

        }, function () {});
    }


    async createDirPath(rootDirEntry, folders, create) {
        return new Promise((res, rej) => {

            if (folders[0] == '.' || folders[0] == '') folders = folders.slice(1) // Throw out './' or '/' and move on to prevent something like '/foo/.//bar'.

            if (!folders || !folders.length) res(true)

            rootDirEntry.getDirectory(folders[0], { create }, 
                async (dirEntry) => {
                    if (folders && folders.length) res(await this.createDirPath(dirEntry, folders.slice(1), false))
                },
                async (err) => {
                    if (folders && folders.length) res(await this.createDirPath(rootDirEntry, folders, true))
                }
            )

        })
    }

    async writeInFile(fileEntry, chunkInfoObj, type = "video\/mp4") {
        return new Promise((res, rej) => {

            fileEntry.createWriter(
                (fileWriter) => {

                    fileWriter.onwriteend = function(e) { res(true) }
          
                    fileWriter.onerror = function(e) {
                        console.log('Write failed: ' + e.toString())
                        rej(false)
                    }
          
                    // Create a new Blob and write it to log.txt.
                    var blob = new Blob([chunkInfoObj.response], { type });
                    fileWriter.write(blob)

                },
                (err) => {
                    console.log("ERROR WHILE WRITING DATA IN FILE")
                    rej(false)
                }
            )

        })
    }

    async getExtBaseUrl() {
        return new Promise((res, rej) => {
            let rfs = window["requestFileSystem"] || window["webkitRequestFileSystem"]
            rfs["directoryEntry"] = window["directoryEntry"] || window["directoryEntry"]
            rfs(window["PERSISTENT"], 1024*1024, 
                (fs) => {
                    res(fs.root.toURL())
                },
                () => {
                    res("")
                })
        })
    }

    async setEncFile() {

        let encFile = await this.getEncFileFromWorker()

        this.setEncFileInFS(encFile)

    }

    setEncFileInFS(encFile) {

        let rfs = window["requestFileSystem"] || window["webkitRequestFileSystem"]
        rfs["directoryEntry"] = window["directoryEntry"] || window["directoryEntry"]

        rfs(window["PERSISTENT"], 1024*1024, async (fs) => {

            let dirPath = `${ environment.production ? "PROD" : "DEV" }`          

            let dirPathRes = await this.createDirPath(fs.root, dirPath.split('/'), false)

            let filePath = `${dirPath}/hello.txt`

            console.log(filePath)

            fs.root.getFile(filePath, { create: true }, 
                async (fileEntry) => {
                    let fileResponse = await this.writeInFile(fileEntry, { response: encFile }, "text/plain")

                    fs.root.getFile(filePath, { create: false }, function() { 
                        console.log("FILE FOUND", filePath) 
                        fileEntry.getMetadata(function(metadata) { console.log("METADETA", metadata) })
                    }, function() { console.log("FILE NOT FOUND AFTER WRITE", filePath) })

                }, 
                function () {
                    console.log("ERROR IN CREATING CHUNK FILE")
                }
            )

        }, function () {});
    }

    getEncFileFromWorker() {
        return new Promise((res, rej) => {

            let worker = new Worker("assets/worker.js")

            worker.postMessage({ url: ENC_KEY_URL, task: "DownloadEncKey" });

            worker.onmessage = (response) => {
                res(response["response"])
            }

        })
    }
    

}