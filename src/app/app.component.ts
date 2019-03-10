import { Component, OnInit, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';

import { AppService } from './services/app.service';

// import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  public appBaseUrl
  public assetDetails: object = this._appService.assetDetails
  public assetListObj = this._appService.assetListObj
  public assetList = Object.keys(this.assetListObj)

  @ViewChildren("videoTag") videoTags: QueryList<any>

  constructor(
    private _appService: AppService
  ) {}

  async ngOnInit() {
    await this.setAppBaseUrl()
    this._appService.setAssetDetails()
  }

  async setAppBaseUrl() {
    this.appBaseUrl = await this._appService.getExtBaseUrl()
  }

  downloadCompleteVideoWithWorker(asset_id: number) {
    this._appService.downloadCompleteVideoWithWorker(asset_id)
  }

  onPlayClick(asset_id) {
    let assetUrl = `${this.appBaseUrl}${asset_id}.mp4#t=0`
    let tag = "<video class='video-fit' controls> <source src=" + assetUrl + " type='video/mp4'></video>"
    this.videoTags.forEach((videoTag) => {
      if (videoTag.nativeElement.id == asset_id) {
        videoTag.nativeElement.insertAdjacentHTML('beforeend', tag)
      }
    })
  }

}
