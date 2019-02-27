import { Component, OnInit } from '@angular/core';

import { AppService } from './services/app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  public workerResponse = this._appService.workerResponse

  constructor(
    private _appService: AppService
  ) {}

  ngOnInit() {
    console.log(this.workerResponse)
  }

  downloadVideoWithWorker(asset_id: number) {
    this._appService.downloadVideoWithWorker(asset_id)
  }

  getDownloadPercentage(asset_id: number) {
    let chunksArr = this.workerResponse[asset_id];
    return ((chunksArr.filter(c => c.result).length) / chunksArr.length) * 100
  }

}
