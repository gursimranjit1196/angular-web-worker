import { Component, OnInit } from '@angular/core';

import { AppService } from './services/app.service';
import { environment } from 'src/environments/environment';

import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  public workerResponse = this._appService.workerResponse
  public appBaseUrl

  constructor(
    private _appService: AppService,
    private _sanitizer:DomSanitizer
  ) {}

  ngOnInit() {
    console.log(this.workerResponse)
    this.setAppBaseUrl()
  }

  async setAppBaseUrl() {
    this.appBaseUrl = await this._appService.getExtBaseUrl()
    this.appBaseUrl = this.appBaseUrl.replace("filesystem:", "")
  }

  downloadVideoWithWorker(asset_id: number) {
    this._appService.downloadVideoWithWorker(asset_id)
  }

  getDownloadPercentage(asset_id: number) {
    let chunksArr = this.workerResponse[asset_id];
    return ((chunksArr.filter(c => c.result).length) / chunksArr.length) * 100
  }

  getVideoSrc(asset_id: number) {
    let dirPath = `${ environment.production ? "PROD" : "DEV" }/${ asset_id }` 
    let filePath = `${dirPath}/chunks_index.m3u8`
    let extBaseUrl = this.appBaseUrl
    if (extBaseUrl && extBaseUrl.length) {
      let res = this._sanitizer.bypassSecurityTrustUrl(`${extBaseUrl}${filePath}`)
      console.log("Video URL: ", res)
      return res
    } else {
      return ""
    }
  }

}
