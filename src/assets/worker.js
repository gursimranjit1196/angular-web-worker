window=this;

onmessage = async function(e) {
    let chunkInfoObj = e.data
    let urlResponse = await getDataFromURL(chunkInfoObj)
    chunkInfoObj.response = urlResponse
    chunkInfoObj.name = window.document === undefined ? "true" : "false"

    postMessage(chunkInfoObj)
}
  
async function getDataFromURL(obj) {
    let response = await fetch(obj.url)
    return "RESPONSE DATA: " + obj.id
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