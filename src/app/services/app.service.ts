import { ASSET_LIST_OBJ } from "../constants/videoURL";
import { environment } from 'src/environments/environment';

declare var _CHROME: any;

export class AppService {

    public assetDetails = {}
    private _assetListObj = ASSET_LIST_OBJ

    get assetListObj() {
        return this._assetListObj
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


    async downloadCompleteVideoWithWorker(asset_id) {

        let worker = new Worker("assets/completeVideoWorker.js")
        
        let localStorageData = null

        if (environment.production && false) {
            localStorageData = await this.getDataFromChromeStorage(asset_id.toString())
        } else {
            try { localStorageData = JSON.parse(localStorage.getItem(asset_id)) } catch (e) { localStorageData = null }
        }

        worker.postMessage({ ...this._assetListObj[asset_id], isNew: !localStorageData, lastChunkWritten: localStorageData ? localStorageData.lastChunkWritten : 0 })

        worker.onmessage = async (response) => {
            if (response.data && response.data.res === "IN_PROGRESS") {
                this.assetDetails[asset_id] = response.data
            } else if (response.data && response.data.res === "SUCCESS") {

                this.assetDetails[asset_id] = response.data
                localStorage.setItem(asset_id, JSON.stringify(response.data))
                worker.terminate()

            } else if (response.data && response.data.res === "FAILURE") {

                console.log("IN FAILURE........")
                this.assetDetails[asset_id] = response.data
                localStorage.setItem(asset_id, JSON.stringify(response.data))
                worker.terminate()

            }
        }
    }




    // STORAGE SERVICES

    async getDataFromChromeStorage(k = "ASSET_DETAILS") {
        return new Promise((res, rej) => {
            _CHROME.storage.local.get([k], function(result) {
                res(result.key)
            })
        })
    }

    async setDataInChromeStorage(k, v) {
        return new Promise((res, rej) => {
            _CHROME.storage.local.set({ k: v }, function() { 
                res(true)
            })
        })
    }

    setAssetDetails() {
        for(let i = 1; i <= Object.keys(this._assetListObj).length; i++) {
            try { this.assetDetails[i] = localStorage.getItem(i.toString()) } catch (error) { }
        }
    }

    setDataInStorage(k, v) {
        localStorage.setItem(k, JSON.stringify(v))
    }
    

}