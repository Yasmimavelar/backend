// app.js
var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var data = new Date();
const port = process.env.PORT || 8080;
var http = require('http');
var app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);


require('dotenv/config');


var connection = mysql.createPool({
    host: process.env.HOST, 
    user: process.env.USER, 
    password: process.env.PASSWORD,
    database: process.env.DATABASE, 

});

app.use(cors());
app.use(bodyParser());
// API TAREFAS

// socket.io
io.on('connection', socket => {

  console.log('connected')

  //CHART
  socket.on('initialChart', () => {
    connection.query('SELECT * FROM chart', function(err, row, fields) {
      socket.emit('getChart', row)
    });
  });

  //TAREFAS

  socket.on('initialTarefas', () => {
    connection.query('SELECT * FROM tarefas', function (error, results, fields) {
      if (error) throw error;
      socket.emit('getTarefas', results);
    });
  });

  socket.on('updateTarefas', object => {
    connection.query("update chart set lineMecanica = "+ object.lineMecanica +" where dia = ('"+data.getFullYear()+"-"+ data.getMonth()+ 1 +"-"+data.getDate()+"');", () => {
      socket.broadcast.emit('changeChart')
    });
    connection.query("update tarefas set checkin = ("+ object.value +") where tarefa = '" + object.tarefa + "';", () => {
      socket.broadcast.emit('changeTarefas');
    });
  })

  //COMENTARIOS
  socket.on('initialCom', () => {
    connection.query("SELECT * FROM comentarios", function(err, results) {
      if (err) throw err;
      socket.emit('getCom',results)
    });
  });


  socket.on('markDone', com => {
    connection.query("INSERT INTO comentarios VALUES ('" + com + "')", () => {
        socket.broadcast.emit('changeCom')
    });
  });

  // Eventos

  socket.on('initialEvent', () => {
    connection.query('SELECT * FROM eventos', (err, results) => {
      if (err) throw err;
      socket.emit('getEvento', results)
    })
  })

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });


});

// Iniciando o servidor.
server.listen(port, () => {
  console.log('API subida com sucesso!');
 }); 