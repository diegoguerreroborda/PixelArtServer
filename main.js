const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const PORT = 3000;

const app = express()
app.use(bodyParser.json())

let isLeader;
//PARA INSTANCIAS EN GENERAL
//copia de la obra. Pixel con su id
//[{pixel:{x:5, y:10}, id:'50-40-43'}]
let keyArtWork = []
//JSON de tareas pendientes (quien la hace, cual es la tarea, pixel a modificar, color)
//[{server:'localhost:3001', work:'No sé :v', pixel: {x:5, y:10}, color: ffffff}]
let pendingTasks = []
//Lista de palabras random
let wordList = ['word1', 'word2', 'word3']

//lista de instancias en general
let serverList = [{path: "http://localhost:3000/", isLeader:true}, {path: "http://localhost:3001/", isLeader:false}, {path: "http://localhost:3002/", isLeader:false}];
//PARA EL LIDER

//métodos
//editar obra 
    //Consenso de la palabra.
    //Escribir palabra en un archivo 100000 veces.
    //Se va a la lista de tareas pendientes.
    //Validación de obra de arte.
    //Registrar pixel en la GUI.

//consultar copia de la obra de arte.
    //Validar si los dos archivos de texto son los mismos?

app.get('/artWork', (req, res) => {
    res.send(keyArtWork)
})

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`)
})