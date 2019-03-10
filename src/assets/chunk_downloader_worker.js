window = this

onmessage = async function(e) {

    postMessage(await downloadChunk(e.data.url, e.data.fromRange, e.data.toRange))

}

async function downloadChunk(videoURL, fromRange, toRange) {
    return new Promise((res, rej) => {

        let xhr = new XMLHttpRequest()

        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 206) {
                res(xhr.response)
            }
        }

        xhr.open("get", videoURL, true)
        xhr.responseType = "blob"
        xhr.setRequestHeader("Range", "bytes=" + fromRange + "-" + toRange)
        xhr.setRequestHeader("Pragma", "no-cache");
        xhr.setRequestHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        xhr.send()

    })
}