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
const connection = mysql.createPool({
    host: process.env.HOST, 
    user: process.env.USER, 
    password: process.env.PASSWORD,
    database: process.env.DATABASE, 

});

app.use(cors());
app.use(bodyParser());
app.use(bodyParser.urlencoded({ extended: false }));

// socket.io
app.get('/event', (req, res) => {
  connection.query('SELECT * FROM eventos', (err, results) => {
    res.send(results)
  });
})

// cadastramento

require('./app/index')(app);


//TAREFAS
io.of('tarefas').on('connection', socket => {

  socket.on('updateTarefas', object => {
    connection.query(`update tarefas set checkin = (${object.value}) where tarefa = '${object.tarefa}';`, () => {
      socket.broadcast.emit('changeTarefas');
      socket.broadcast.emit('changeAll');
      socket.broadcast.emit('changeCheckin');
    });
  });
  socket.on('initialTarefas', () => {
    connection.query('SELECT * FROM tarefas', function (error, results, fields) {
      if (error) throw error;
      socket.emit('getAll', results);
    });
  });
    //mecanica
  socket.on('initialCheckinMecanica', () => {
    connection.query('select categoria, count(checkin) as checkin from tarefas where checkin = true and categoria = "Mecanica" group by categoria', function (error, results, fields) {
      if (error) throw error;
      socket.emit('getCheckin', results);
    });
  });
  socket.on('initialTarefasMecanica', () => {
    connection.query('SELECT * FROM tarefas where categoria = "Mecanica" ORDER BY prazo', function (error, results, fields) {
      if (error) throw error;
      socket.emit('getTarefas', results);
    });
  });
    //programacao
  socket.on('initialTarefasProgramacao', () => {
    connection.query('SELECT * FROM tarefas where categoria = "Programacao" ORDER BY prazo', function (error, results, fields) {
      if (error) throw error;
      socket.emit('getTarefas', results);
    });
  });
  socket.on('initialCheckinProgramacao', () => {
    connection.query('select categoria, count(checkin) as checkin from tarefas where checkin = true and categoria = "Programacao" group by categoria', function (error, results, fields) {
      if (error) throw error;
      socket.emit('getCheckin', results);
    });
  });
    //controle
  socket.on('initialTarefasControle', () => {
    connection.query('SELECT * FROM tarefas where categoria = "Controle" ORDER BY prazo', function (error, results, fields) {
      if (error) throw error;
      socket.emit('getTarefas', results);
    });
  });
  socket.on('initialCheckinControle', () => {
    connection.query('select categoria, count(checkin) as checkin from tarefas where checkin = true and categoria = "Controle" group by categoria', function (error, results, fields) {
      if (error) throw error;
      socket.emit('getCheckin', results);
    });
  });

  socket.on('updateChart', lineMecanica => {
    connection.query(`update chart set lineMecanica = ${lineMecanica} where dia = date(now());`, () => {
      socket.broadcast.emit('changeChart')
    });
  });

  socket.on('initialChart', () => {
    connection.query("insert into chart (dia) values (date(now()))");
    connection.query('SELECT * FROM chart WHERE WEEK(dia, 1) = WEEK(now(), 1);', function(err, row, fields) {
      socket.emit('getChart', row)
    });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

//COMENTARIOS
io.of('/comentarios').on('connection', socket => {
  socket.on('initialCom', () => {
    connection.query("SELECT * FROM comentarios", function(err, results) {
      if (err) throw err;
      socket.emit('getCom',results)
    });
  });
  socket.on('markDone', (com, user, id) => {
    connection.query(`INSERT INTO comentarios (comentario, user, id_user) VALUES ('${com}','${user}', ${parseInt(id)})`, () => {
        socket.broadcast.emit('changeCom')
    });
  });
})
server.listen(port, () => {
  console.log('API subida com sucesso!');
});