// app.js
var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
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
    connection.query("insert into chart (dia) values (date(now()))");
    connection.query('SELECT * FROM chart WHERE WEEK(dia,1) = WEEK(now(),1);', function(err, row, fields) {
      socket.emit('getChart', row)
    });
  });
  socket.on('updateChart', lineMecanica => {
    connection.query("update chart set lineMecanica = "+ lineMecanica +" where dia = date(now());", () => {
      socket.broadcast.emit('changeChart')
    });

    
  });

  //TAREFAS
  socket.on('initialTarefas', () => {
    connection.query('SELECT HIGH_PRIORITY * FROM tarefas where categoria = "Mecanica" ORDER BY prazo', function (error, results, fields) {
      if (error) throw error;
      socket.emit('getTarefas', results);
    });
  });

  socket.on('initialCheckin', () => {
    connection.query('select categoria, count(checkin) as checkin from tarefas where checkin = true group by categoria', function (error, results, fields) {
      if (error) throw error;
      socket.emit('getCheckin', results);
    });
  });

  socket.on('updateTarefas', object => {
    connection.query("update tarefas set checkin = ("+ object.value +") where tarefa = '" + object.tarefa + "';", () => {
      socket.broadcast.emit('changeTarefas');
      socket.broadcast.emit('changeCheckin');
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