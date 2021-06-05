const express = require('express');
const axios = require('axios');
const fs = require('fs')
const cors = require('cors');
const morgan = require('morgan');
const lineReader = require('line-reader');
const bodyParser = require('body-parser');
const socketio = require('socket.io')
const http = require('http')
var path = require('path')
var dateFormat = require('dateformat');
const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(express.json({limit: '5mb'}));
app.use(express.static('public'))
app.use(cors())
const PORT = process.env.PORT;
//const PORT = process.argv[2];

//let isLeader;
//PARA INSTANCIAS EN GENERAL
//Obra de arte
//[{pixel: {x:5, y:10}, color: 'red'}]
let artWork = []
//copia de la obra. Pixel con su id
//[{pixel:{x:5, y:10}, id:'50-40-43'}]
let keyArtWork = []
//JSON de tareas pendientes (quien la hace, cual es la tarea, pixel a modificar, color)
//[{server:'172.17.0.1:3001', work:'No sé :v', pixel: {x:5, y:10}, color: ffffff}]
let pendingTasks = []
//Lista de palabras random
let wordList = ['word1', 'word2', 'word3']

//lista de instancias en general
let serverList = [{path: "http://172.17.0.1:3000/", isLeader:true}, {path: "http://172.17.0.1:3001/", isLeader:false}, {path: "http://172.17.0.1:3002/", isLeader:false}, {path: "http://172.17.0.1:3003/", isLeader:false}, {path: "http://172.17.0.1:3004/", isLeader:false}];
//let serverList = [{path: "http://172.17.0.1:3000/", isLeader:true}, {path: "http://172.17.0.1:3001/", isLeader:false}, {path: "http://172.17.0.1:3002/", isLeader:false}]
let logger = []
//Datos lider
let wordListCurrent;
let keyCurrent;
let countVotes;

morgan.token('host', function(req, res) {
    return req.hostname;
});

function base64_decode(base64str, file) {
    var bitmap = new Buffer(base64str, 'base64');
    fs.writeFileSync(file, bitmap);
}

function base64_encode(file) {
    var bitmap = fs.readFileSync(file);
    return new Buffer(bitmap).toString('base64');
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function sortWordRepeated(){
    let wordListRepeat = []
    wordListCurrent.forEach(function(word){
        let enter = false
        if(wordListRepeat.length == 0){
            wordListRepeat.push({name:word, count : 1});
        }else {
            wordListRepeat.forEach(function(wordRepeat){
                if(word == wordRepeat.name){
                    wordRepeat.count++;
                    enter = true;
                }
            })
            if(!enter){
                wordListRepeat.push({name:word, count : 1});
            }    
        }   
    })
    return findMostVotedWord(wordListRepeat)
}

function findMostVotedWord(wordListRepeat) {
    let arrayNumbers = []
    wordListRepeat.forEach(function(element){
        arrayNumbers.push(element.count)
    })
    return wordListRepeat.filter(element => element.count == Math.max.apply( Math, arrayNumbers ));
}

async function getData(afterURL){
    for (const server in serverList) {
        try {
            console.log(`${serverList[server].path}${afterURL}`)
            let response = await axios(`${serverList[server].path}${afterURL}`)
            console.log(response.data)
            if(afterURL == 'new_word'){
                logger.push({service:`Palabra es: ${response.data}`, date:dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT"), host: serverList[server].path})
                wordListCurrent.push(response.data)
            }
            if(afterURL == 'randomNumber'){
                console.log('holaaaa???')
                keyCurrent += response.data
            }
        } catch(err) {
            console.log('err.Error')
        }
    }
}

async function sendData(dataToSend, afterURL) {
    for (const server in serverList) {
        console.log('send', serverList[server].path)
        await axios({
            method: 'post',
            url : `${serverList[server].path}${afterURL}`,
            data: {
              data: dataToSend
            }
        }).then(response => {
            console.log('Resultado:', response.data)
            if(afterURL == 'file_word_repeat'){
                logger.push({service:'Crear el archivo de POW', date:dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT"), host: serverList[server].path})
                //Solo llega al que le tocó
                console.log('cuando se crea el archivo nomás')
                countVotes = 0;
                sendData(response.data, 'document_pow')
            }
            if(afterURL == 'document_pow'){
                logger.push({service:`Voto: ${response.data}`, date:dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT"), host: serverList[server].path})
                //Aqui debe llegar un true o false
                console.log('Respuesta booleana: ', response.data)
                if(response.data){
                    countVotes++;
                    console.log('Correcto')
                }
            }
        }).catch(err => {
            console.log("No elegido para hacer la tarea...")
        });
    }
    if(afterURL == 'document_pow'){
        logger.push({service:`Los votos confirmando son ${countVotes} de ${serverList.length} posibles.`, date:dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT"), host: `http://172.17.0.1:${PORT}/`})
        console.log(`Los votos confirmando son ${countVotes} de ${serverList.length} posibles.`)
        //Si hay más de la mitad crear el pixel
        countVotesF();
    }   
}

async function countVotesF() {
    if(countVotes > (serverList.length / 2)){
        console.log('Se ha confirmado el pixel')
        keyCurrent = '';
        await getData('randomNumber')
        console.log('keyCurrent', keyCurrent)
        await sendData(keyCurrent, 'updateData')
        //enviar data aqui creo o con webSockets mejor
        return;
    }
}
//hola1 repite 4
async function generateNewPixel(x, y, color){
    wordListCurrent = []
    await getData('new_word')
    //contar la palabra más repetida.
    let result = sortWordRepeated()
    if(result.length != 1){
        //console.log('toca hacerlo de nuevo D:') va para el log!!!
        logger.push({service:'Hay más de una palabra más repetida', date:dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT"), host: `http://172.17.0.1:${PORT}/`})
        generateNewPixel(x, y, color);
        return;
    }
    logger.push({service:`La palabra escogida es: ${result[0].name}`, date:dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT"), host: `http://172.17.0.1:${PORT}/`})
    //registrar en tareas pendientes.
    let numberRandomWrite = getRandomInt(90000, 100000)
    let currentTask = {server:serverList[getRandomInt(0, serverList.length)].path, 
        work: `Escribir la palabra ${result[0].name} ${numberRandomWrite} veces`, 
        word: result[0].name, number: numberRandomWrite, pixel: {x:x, y:y}, color: color}
    console.log(currentTask)
    //Escribir archivo con n lineas con esa palabra pero en host que designa aleatoriamente.
    await sendData(currentTask, 'file_word_repeat')
}

//PARA EL LIDER
//Solicitar palabra de cada instancia.
app.get('/new_pixel', async (req, res) => {
    //logger += `\n*******${new Date()}--Nuevo pixel en la posicion ${req.query.x}, ${req.query.y} de color ${req.query.color} \n`
    logger.push({service:`Nuevo pixel en la posicion ${req.query.x}, ${req.query.y} de color ${req.query.color}`, date:dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT"), host: `http://172.17.0.1:${PORT}/`})
    console.log(`${req.query.x}---${req.query.y}`)
    if(PORT == 3000){
        await generateNewPixel(req.query.x, req.query.y, req.query.color)
        res.sendStatus(200)
    }else{
        //Va para el lider
        logger.push({service:'Enviando pixel al lider', date:dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT"), host: `http://172.17.0.1:${PORT}/`})
        console.log('Va para el lideerrrr')
        axios.get('http://172.17.0.1:3000/new_pixel', {
            params: {
              x: req.query.x,
              y: req.query.y,
              color: req.query.color
            }
          }).then(response => {
            res.sendStatus(200)
          }).catch(e => {
            console.log(e);
          })
    }
})

app.post('/file_word_repeat', async (req, res) => {
    console.log('*********************')
    console.log(req.body.data)
    //guarda la tarea pendiente en todos los servidores
    pendingTasks.push({server:req.body.data.server, work: req.body.data.work, word: req.body.data.word,
        number: req.body.data.number, pixel: req.body.data.pixel, color: req.body.data.color})
    if(req.body.data.server == `http://172.17.0.1:${PORT}/`){
        console.log('Este fue')
        createFile(req.body.data.number, req.body.data.word)
        setTimeout(function(){
            res.status(200).send(base64_encode('PoW.txt'))
        }, 10000)
    }else{
        res.status(500).send('aqui paila')
    }
})

app.post('/document_pow', async (req, res) => {
    //LLega el documento así que se convierte a documento
    base64_decode(req.body.data, 'validation.txt')
    let pow = await validateProofOfWork(pendingTasks[pendingTasks.length-1].word)
    console.log('pow', pow)
    if(await pow == pendingTasks[pendingTasks.length-1].number){ //3pendingTasks[pendingTasks.length-1].number
        console.log('Siiuuuu')
        res.send(true)
    }else{
        res.send(false)
    }
})

function createFile(number, word){
    let poW = fs.createWriteStream('PoW.txt')
    for (let i = 0; i < number; i++) {
        poW.write(`${word} \n`)
    }
}

function validateProofOfWork(word){
    let count = 0;
    return new Promise((resolve, reject) => {
        lineReader.eachLine('validation.txt', async function(line) {
        if(line == `${word} `){
            count++;
        }
        }, function finished (err) {
            if (err) return reject(err);
            resolve(count);
        });
    });
}

app.get('/new_word', (req, res) => {
    console.log('newWord', wordList[getRandomInt(0, wordList.length)])
    res.send(wordList[getRandomInt(0, wordList.length)])
})

app.get('/artWork', (req, res) => {
    res.send(artWork)
})

app.get('/keyArtWork', (req, res) => {
    res.send(keyArtWork)
})

app.post('/keyArtWorkset', (req, res) => {
    keyArtWork = req.body.keyArtWork;
    res.send(keyArtWork)
})

app.get('/pendingTasks', (req, res) => {
    res.send(pendingTasks)
})

app.get('/randomNumber', (req, res) => {
    res.send(`${getRandomInt(0,100)}-`)
})

app.get('/logger', (req, res) => {
   res.send(logger)
})

app.get('/validation_keys', async (req, res) => {
    let response = await axios(`http://172.17.0.1:3000/keyArtWork`)
    console.log('Que esss: ',response.data)
    if(response.data == keyArtWork){
        res.send(true)
    }else{
        res.send(false)
    }
})

app.post('/updateData', (req, res) => {
    //crea la copia de seguridad
    //[{pixel:{x:5, y:10}, id:'50-40-43'}]
    logger.push({service:'Pixel registrado en todos los servidores', date:dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT"), host: `http://172.17.0.1:${PORT}/`})
    keyArtWork.push({pixel:{x:pendingTasks[pendingTasks.length-1].pixel.x, y:pendingTasks[pendingTasks.length-1].pixel.y},
         id: req.body.data})

    //Obra de arte
    //[{pixel: {x:5, y:10}, color: 'red'}]
    artWork.push({pixel:{x:pendingTasks[pendingTasks.length-1].pixel.x, y:pendingTasks[pendingTasks.length-1].pixel.y}, 
        color: pendingTasks[pendingTasks.length-1].color})
    res.send('ok ;)')
})

io.on('connection', function (socket) {
    console.log(`client: ${socket.id}`)
    //enviando al cliente
    setInterval(() => {
        //socket.emit('server/random', getDateTime())
        socket.emit('server/list_art_work', artWork)
        socket.emit('server/list_keys', keyArtWork)
    }, 4000)
})

server.listen(PORT, () => {
    console.log(`Example app listening at http://172.17.0.1:${PORT}`)
})