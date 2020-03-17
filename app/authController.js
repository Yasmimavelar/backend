const express = require('express');
const mysql = require('mysql');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

const authConfig = require('../config/auth.json');

const connection = mysql.createPool({
  host: process.env.HOST, 
  user: process.env.USER, 
  password: process.env.PASSWORD,
  database: process.env.DATABASE,

});

function generateToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400,
  });
}

router.post('/register', async (req, res) => {
  
  const hash = await bcrypt.hash(req.body.password, 10);
  try {
    if (await connection.query(`select username from user where username = ${req.body.username}`))

    connection.query(
        `insert into user (username, email, password) values ('${req.body.username}', '${req.body.email}', '${hash}')`, function(error, user) {
          if (error) 
            return res.status(400).send({ error: "Usuario já existente"})

          user.password = undefined;

          connection.query(`select * from user where email = '${req.body.email}'`, (error, user) => {

            return res.send({ id: user[0].id, token: generateToken({ id: user.id }), name: user[0].username });
          })

        });
  } catch (err) {
    return res.status(400).send({ error: "Falha no Registro!"})
  }
});

router.post('/authenticate', async (req, res) => {
  await connection.query(`select * from user where email = '${req.body.email}'`, (error, user) => {
    if (user.length == 0)
      return res.status(400).send({error: 'Usuário não encontrado!'});

    bcrypt.compare(req.body.password, user[0].password, function(err, result) {
      user[0].password = undefined
      
      if(result) {
        return res.send({ id: user[0].id, token: generateToken({ id: user[0].id }), name: user[0].username });
      }
      else {
        return res.status(400).send({ message: "Senha inválida" });
      }
      });
  });
    
    
});

module.exports = app => app.use('/auth', router);

