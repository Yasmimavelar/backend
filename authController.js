const express = require('express');
const mysql = require('mysql');
const router = express.Router();
const bcrypt = require('bcryptjs');

const connection = mysql.createPool({
  host: process.env.HOST, 
  user: process.env.USER, 
  password: process.env.PASSWORD,
  database: process.env.DATABASE,

});

router.post('/register', async (req, res) => {
  
  const hash = await bcrypt.hash(req.body.password, 10);
  try {
    if (await connection.query(`select username from user where username = ${req.body.username}`))

    connection.query(
        `insert into user (username, email, password) values ('${req.body.username}', '${req.body.email}', '${hash}')`, error => {
          return res.status(400).send({ error: "Usuario já existente"})
        });
  } catch (err) {
    return res.status(400).send({ error: "Registration failed"})
  }
});

router.post('/authenticate', async (req, res) => {
    const {email, password} = req.body;
  
    const user = await user.findOne({ email }).select('+password');
  
    if (!user)
      return res.status(400).send({error: 'Registro falhado!'});
  
    if (password != user.password)
      return res.status(400).send({ error: 'Senha inválida'});
  
    user.password = undefined;
  
    const token = jwt.sign({ id: user.id }, authConfig.secret, {
      expiresIn: 86400,
    });
  
    res.send({ user });
  })

module.exports = app => app.use('/auth', router);

