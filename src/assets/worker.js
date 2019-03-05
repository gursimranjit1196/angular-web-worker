window=this;

onmessage = async function(e) {
    let obj = e.data

    if (obj.task = "DownloadChunk") {
        let urlResponse = await getDataFromURL(obj, "blob")
        obj.response = urlResponse
        obj.isWorkder = window.document === undefined
        postMessage(obj)
    } else if (obj.task = "DownloadEncKey") {
        let urlResponse = await getDataFromURL(obj, "blob")
        console.log(urlResponse)
        obj.response = urlResponse
        postMessage(obj)
    }
    
}
  
async function getDataFromURL(obj, type) {
    return new Promise((res, rej) => {

        var xhr = new XMLHttpRequest()
        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4 && xhr.status == 200) {
                res(xhr.response)
            }
        }
        xhr.open("get", obj.url, true)
        xhr.responseType = type
        xhr.send()

    })
}

// async function getDataFromURL(obj) {
//     let response = await xyz()
//     return "RESPONSE DATA: " + response + " " + obj.id
// }

async function xyz () {
    return new Promise((res, rej) => {
        setTimeout(function() {
            res("RESOLVED PROMISE WITH TIMEOUT")
        }, getRandonNumber(1, 20) * 1000)
    })
}

function getRandonNumber(min, max) {
    return Math.random() * (+max - +min) + +min
}