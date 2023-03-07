const express = require("express")
const app = express()
const path = require("path")
const formidable = require('formidable')

const bodyParser = require("body-parser")
app.use(bodyParser.urlencoded({ extended: true }));

const hbs = require('express-handlebars')
const fs = require("fs")
app.set('views', path.join(__dirname, 'views'))         // ustalamy katalog views
app.engine('hbs', hbs({
    defaultLayout: 'main.hbs',
    helpers: {
        prevFolder: function () {
            return '<div class="box folder"><form action="/handleCd" method="post"><input type="text" class="hidden" name="name" value=".."><input type="image" class="icon" src="img/folder.png"></form><p>..</p></div>'
        }
    }
}))   // domyślny layout, potem można go zmienić
app.set('view engine', 'hbs')

var homepath = path.join(__dirname, "static", "upload")
var currentPath = path.join(__dirname, "static", "upload")
let context = {
    userpath: "upload" + path.relative(homepath, currentPath),
    contextFiles: [],
    contextFolders: []
}

app.use(express.urlencoded({ extended: true }))

app.get("/", function (req, res) {
    res.redirect("/filemanager")
})

app.get("/filemanager", function (req, res) {
    getContext(context, req, res)
})

app.post('/handleUpload', function (req, res) {
    let form = formidable({})
    form.keepExtensions = true
    form.multiples = true
    console.log("CURRENT PATH: ", currentPath);
    form.uploadDir = currentPath + "/"

    form.parse(req, function (err, fields, files) {

        console.log("----- przesłane pola z formularza ------")
        console.log(fields)

        console.log("----- przesłane formularzem pliki ------")
        console.log(files)

        if (!files.imagetoupload.length) {
            // single file
            let oldpath = files.imagetoupload.path
            let newpath = form.uploadDir + files.imagetoupload.name;

            if (!fs.existsSync(newpath)) {
                fs.rename(oldpath, newpath, function (err) {
                    if (err) throw err;
                })
            } else {
                console.log("file is alredy in the folder")
                fs.unlink(oldpath, (err) => {
                    if (err) throw err
                    console.log(oldpath + ' was deleted')
                })
            }

        } else {
            // multiple files
            for (let i = 0; i < files.imagetoupload.length; i++) {
                let oldpath = files.imagetoupload[i].path
                let newpath = form.uploadDir + files.imagetoupload[i].name;

                if (!fs.existsSync(newpath)) {
                    fs.rename(oldpath, newpath, function (err) {
                        if (err) throw err;
                    })
                } else {
                    console.log("file is alredy in the folder")
                    fs.unlink(oldpath, (err) => {
                        if (err) throw err
                        console.log(oldpath + ' was deleted')
                    })
                }
            }
        }

        res.redirect("/filemanager")
    });
});

app.post('/handleMkdir', function (req, res) {
    console.log(req.body)
    let folderPath = path.join(currentPath, req.body.tbNewFolder)

    if (!fs.existsSync(folderPath)) {
        fs.mkdir(folderPath, (err) => {
            if (err) throw err
            console.log("jest");
        })
    } else {
        console.log("Folder alredy exists!")
    }

    res.redirect("/filemanager")
})

app.post('/handleTouch', function (req, res) {
    console.log(req.body)
    let filePath = path.join(currentPath, req.body.tbNewTextFile + "." + req.body.extention)

    if (!fs.existsSync(filePath)) {
        fs.writeFile(filePath, getDefaultContent(req.body.extention), (err) => {
            if (err) throw err
            console.log("jest");
        })
    } else {
        console.log("File alredy exists!")
    }

    res.redirect("/filemanager")
})

app.post("/handleDelete", function (req, res) {
    console.log(req.body)
    let clickpath = path.join(currentPath, req.body.name)

    if (req.body.type == "folder" && fs.existsSync(clickpath)) {

        fs.readdir(clickpath, (err, files) => {
            if (err) {
                console.log("blad przy usuwaniu katalogu")
            } else {
                if (files.length == 0) {
                    fs.rmdir(clickpath, (err) => {
                        if (err) throw err
                        console.log("Usunieto folder: ", req.body.name)
                    })
                } if (files.length != 0) {
                    const fsExtra = require('fs-extra')
                    fsExtra.remove(clickpath, (err) => {
                        if (err) console.log("cos poszlo nie tak przy usuwaniu folderu z zawartoscia")
                        else {
                            console.log("usunieto folder z zawartoscia: ", clickpath);
                        }
                    })
                }
            }
        })
    }

    if (req.body.type == "file" && fs.existsSync(clickpath)) {
        console.log("PLIKKK");
        fs.unlink(clickpath, (err) => {
            if (err) throw err
            console.log("Usunieto plik: ", req.body.name)
        })
    }

    res.redirect("/")
})

app.post("/handleCd", function (req, res) {
    if (req.body.name != ".." || (req.body.name == ".." && currentPath != homepath)) {
        console.log(req.body)
        currentPath = path.join(currentPath, req.body.name)
        context.userpath = "upload\\" + path.relative(homepath, currentPath)
        res.redirect("/")
    }
    res.redirect("/")
})

app.post("/handleMv", function (req, res) {
    if (currentPath != homepath) {
        console.log(req.body)
        let oldpath = currentPath
        let newpath = path.join(path.dirname(currentPath), req.body.tbRename)

        console.log("currentpath", currentPath)
        console.log("newpath", newpath)

        try {
            fs.renameSync(oldpath, newpath)
            console.log("Successfully renamed the directory to: ", req.body.tbRename)
            currentPath = newpath
            context.userpath = "upload\\" + path.relative(homepath, currentPath)
        } catch (err) {
            console.log("ERROR")
        }
        res.redirect("/")
    } else {
        console.log("nie mozna zmienic nazwy root katalogu");
        res.redirect("/")
    }
})

app.get("/showfile/:file", function (req, res) {
    let file = req.params.file
    let type = file.split('.').pop()

    if (type != 'jpg' && type != 'jpeg' && type != 'png') {
        let tempTab = []
        console.log(file)

        for (let i = 0; i < fs.readFileSync(path.join(currentPath, file), 'utf-8').split("\n").length; i++) {
            tempTab.push(i + 1)
        }

        let editContext = {
            fileName: req.params.file,
            fileContent: fs.readFileSync(path.join(currentPath, file), 'utf-8'),
            fileLines: tempTab
        }

        console.log("EDITCONTEXT: ", editContext.fileLines)
        res.render("textedit.hbs", editContext)

    } else if (type == 'jpg' || type == 'jpeg' || type == 'png') {
        let editContext = {
            fileName: req.params.file,
            fileContent: fs.readFileSync(path.join(currentPath, file), 'utf-8'),
            fileUrl: "/handleGetImg/" + req.params.file,
            filters: ["grayscale", "invert", "sepia", "none"]
        }

        res.render('imgedit.hbs', editContext)
    }
})

app.get("/handleGetImg/:file", function (req, res) {
    res.sendFile(path.join(currentPath, req.params.file))
})

app.post("/handleSaveFile", function (req, res) {
    console.log(req.body)
    let writepath = path.join(currentPath, req.body.fileName)

    fs.writeFile(writepath, req.body.taFile, (err) => {
        if (err) throw err
        else {
            console.log("Zapisano tekst do pliku")
        }
    })
    res.redirect("/")
})

app.use(express.json());
app.post("/handleFontChange", function (req, res) {
    console.log("Font ", req.body)

    // wybranie zmiany czcionki
    if (req.body.pom == -1 || req.body.pom == 1) {
        fs.readFile('static/themes/data.json', 'utf-8', (err, data) => {
            if (err) throw err
            const obj = JSON.parse(data)

            let oldfont = parseInt(obj.fontsize.slice(0, -2))
            console.log("OLDFONT : ", oldfont)

            obj.fontsize = (oldfont + req.body.pom) + "px"
            console.log(obj.fontsize)

            fs.writeFile('static/themes/data.json', JSON.stringify(obj), (err) => {
                if (err) throw err
                console.log("_!!! UPDATED FONT !!!_");
                res.setHeader('content-type', 'application/json')
                res.end(JSON.stringify(obj))
            })
        })
    }
    // wybranie zmiany tla
    else if (req.body.pom == 2) {
        fs.readFile('static/themes/data.json', 'utf-8', (err, data) => {
            if (err) throw err
            const obj = JSON.parse(data)

            let oldtheme = obj.theme
            console.log("OLDTHEME : ", oldtheme)

            if (oldtheme == "light") {
                obj.theme = "dark"
            } else if (oldtheme == "dark") {
                obj.theme = "light"
            }

            fs.writeFile('static/themes/data.json', JSON.stringify(obj), (err) => {
                if (err) throw err
                console.log("_!!! UPDATED THEME !!!_");
                res.setHeader('content-type', 'application/json')
                res.end(JSON.stringify(obj))
            })
        })
    }
    // zapytanie o data.json
    else if (req.body.pom == 0) {
        fs.readFile('static/themes/data.json', 'utf-8', (err, data) => {
            if (err) throw err
            const obj = JSON.parse(data)

            console.log("_!!! SENT DATA.JSON FILE !!!_");
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify(obj))
        })
    }
})

app.post("/handleMvFile", function (req, res) {
    console.log(req.body)

    console.log(req.body)
    let oldpath = path.join(currentPath, req.body.tbOldName)
    let newpath = path.join(currentPath, req.body.tbNewName)

    console.log("oldpath", oldpath)
    console.log("newpath", newpath)

    try {
        fs.renameSync(oldpath, newpath)
        console.log("Successfully renamed the file to: ", req.body.tbNewName)
        res.redirect("/showfile/" + req.body.tbNewName)
    } catch (err) {
        console.log("ERROR")
    }
})

app.use(express.static('static'))
app.listen(3000, function () {
    console.log("running on port 3000");
})

// funkcje pomocnicze
function getContext(context, req, res) {
    fs.readdir(currentPath, (err, files) => {
        if (err) throw err
        let tempFiles = []
        let tempFolders = []

        if (files.length == 0) {
            context.contextFiles = []
            context.contextFolders = []
            res.render("index.hbs", context)
        }

        for (let i = 0; i < files.length; i++) {
            fs.lstat(path.join(currentPath, files[i]), (err, status) => {
                if (status.isDirectory() == true) {
                    tempFolders.push(files[i])
                } else if (status.isDirectory() == false) {
                    tempFiles.push(files[i])
                }

                if (i == files.length - 1) {
                    context.contextFiles = tempFiles
                    context.contextFolders = tempFolders

                    console.log("context ", context)
                    res.render("index.hbs", context)
                }
            })
        }
    })
}

function getDefaultContent(extention) {
    let tempPath = path.join(__dirname, "static", "themes", ("default." + extention))
    console.log("red file is : ", tempPath)

    return fs.readFileSync(tempPath, 'utf-8')
}