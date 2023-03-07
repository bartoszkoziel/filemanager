let dialog1 = document.getElementById("dialMkdir")
let dialog2 = document.getElementById("dialTouch")
let dialog3 = document.getElementById("dialMv")

document.getElementById("btnMkdir").onclick = () => {
    dialog1.showModal()
}

document.getElementById("btnClose1").onclick = () => {
    dialog1.close()
}

document.getElementById("btnTouch").onclick = () => {
    dialog2.showModal()
}

document.getElementById("btnClose2").onclick = () => {
    dialog2.close()
}

document.getElementById("btnMv").onclick = () => {
    dialog3.showModal()
}

document.getElementById("btnClose3").onclick = () => {
    dialog3.close()
}