const express = require('express');
const path = require('path');
const mysql = require('mysql');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');


dotenv.config({path: './.env'});


const app = express(); 

const db=mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

//parse url-encoded bodies(as sent by html forms)
app.use(express.urlencoded({ extended: false }));
//parse json bodies(as sent by API clients)
app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'hbs');

db.connect((err) => {
    if(err){
        throw err;
    }
    console.log("Mysql Connected");
})

//define routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

app.listen(5001, () => {
    console.log("Server is running on port 5001");
});