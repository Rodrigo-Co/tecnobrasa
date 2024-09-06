const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const mime = require('mime-types');
const session = require('express-session');

const app = express();
const port = 3300;

// Configuração do body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configuração do banco de dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Substitua pelo seu usuário do MySQL
    password: 'cimatec', // Substitua pela sua senha do MySQL
    database: 'bancotb', // Nome do seu banco de dados
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Conectado ao banco de dados MySQL com Sucesso!');
});

// Servir arquivos estáticos (CSS, imagens, etc.)
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    const mimeType = mime.lookup(path);
    res.setHeader('Content-Type', mimeType);
  }
}));
console.log('Servindo arquivos estáticos a partir da pasta public');

// Armazenar informações do usuario
app.use(session({
  secret: 'segredo',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Servir o arquivo HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/indexInicio.html'));
});

app.get('/pagaluno', (req, res) => {
    if (!req.session.usuario) {
      res.redirect('/login');
      return;
    }
    res.sendFile(path.join(__dirname, '/public/html/pagaluno.html'));
  });

  app.use('/pagaluno', (req, res, next) => {
    if (!req.session.usuario) {
      return res.status(401).send({ message: 'Você precisa se registrar ou logar para acessar esta página.' });
    }
    next();
  });



// Rota para login de dados
app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    const queryVerificar = 'SELECT * FROM usuario WHERE email = ? AND senha = ?';
    db.query(queryVerificar, [email, senha], (err, results) => {
        if (err) {
            throw err;
        }
        if (results.length > 0) {
            req.session.usuario = results[0];
            res.json({ success: true });
        } else {
            const queryVerificarEmail = 'SELECT * FROM usuario WHERE email = ?';
        db.query(queryVerificarEmail, [email], (err, results) => {
        if (err) {
          throw err;
        }
        if (results.length > 0) {
            res.json({ success: false, message: 'Senha incorreta!' }); // Senha incorreta
        } else {
            res.json({ success: false, message: 'Dados não encontrados!' }); // Email e senha incorretos
        }
      });
        }
    });
});

// Rota para cadastrar dados
app.post('/cadastrar', (req, res) => {
    const { nome, email, senha } = req.body;
    const queryVerificar = 'SELECT * FROM usuario WHERE email = ?';
    db.query(queryVerificar, [email], (err, results) => {
        if (err) {
            throw err;
        }
        if (results.length > 0) {
            res.json({ message: 'Usuário já cadastrado!' });
        } else {
            const query = 'INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)';
            db.query(query, [nome, email, senha], (err, results) => {
                if (err) {
                    throw err;
                }
                res.json({ message: 'Dados cadastrados com sucesso!' });
            });
        }
    });
});

//verificar cadastros
app.post('/verificarCadastro', (req, res) => {
    const { email } = req.body;
    const query = 'SELECT * FROM usuario WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            throw err;
        }
        if (results.length > 0) {
            res.json({ message: 'Usuário já cadastrado!' });
        } else {
            res.json({ message: 'Usuário não cadastrado!' });
        }
    });
});

// verificar login
app.get('/verificarLogin', (req, res) => {
    if (req.session.usuario) {
      res.json({ logado: true });
    } else {
      res.json({ logado: false });
    }
  });

// Rota para buscar dados
app.get('/getData', (req, res) => {
    const query = 'SELECT * FROM usuario';
    db.query(query, (err, results) => {
        if (err) {
            throw err;
        }
        res.json(results);
    });
});

// Rota para atualizar dados
app.put('/update/:idusuario', (req, res) => {
    const { idusuario } = req.params;
    const { nome, email, senha } = req.body;
    const query = 'UPDATE usuario SET nome = ?, email = ?, senha = ? WHERE idusuario = ?';
    db.query(query, [nome, email, senha,idusuario], (err, result) => {
        if (err) {
            throw err;
        }
        res.json({ message: 'Dados atualizados com sucesso!' });
    });
});

// Rota para deletar dados
app.delete('/delete/:idusuario', (req, res) => {
    const { idusuario } = req.params;
    const query = 'DELETE FROM usuario WHERE idusuario = ?';
    db.query(query, [idusuario], (err, result) => {
        if (err) {
            throw err;
        }
        res.json({ message: 'Dados deletados com sucesso!' });
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});