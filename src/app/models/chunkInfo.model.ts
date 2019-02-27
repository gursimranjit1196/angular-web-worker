export class ChunkInfo {
    id: number;
    asset_id: number;
    name: string;
    downloadAttempts: number;
    url: string;
    response: any;
    result: boolean = false;
}