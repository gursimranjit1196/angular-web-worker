import { Subject } from 'rxjs';

import { VIDEO_URLS } from "../constants/videoURL";

import { ChunkInfo } from '../models/chunkInfo.model';

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
                chunkInfoArr.push(chunkInfoObj)

                this.getDataFromWorker(asset_id, chunkInfoObj)

            });
        }
    }

    getDataFromWorker(asset_id, chunkInfoObj) {
        let worker = new Worker("assets/worker.js")

        worker.postMessage(chunkInfoObj);

        worker.onmessage = (response) => {
            let res: ChunkInfo = response.data
            chunkInfoObj.response = res.response
            chunkInfoObj.result = true
            chunkInfoObj.name = res.name
            worker.terminate()
        }
    }

}