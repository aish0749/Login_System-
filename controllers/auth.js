const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const promisify = require('util').promisify;
const db=mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.login = async (req, res) => {
    try{
        const {email, password} = req.body;
        if(!email || !password){
            //forbidden status code
            return res.status(400).render('login', {
                message: 'Please provide an email and password'
            }); 
        }
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, result) => {
            if(!result || !(await bcrypt.compare(password, result[0].password))){
                //forbidden status code
                console.log(result[0]);
                res.status(401).render('login', {
                    message: 'Email or password is incorrect'
                });
            }
            else{
                const id = result[0].id;
                const token = jwt.sign({id}, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                });
                console.log("The token is: " + token);
                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 //convert days to seconds
                    ),
                    httpOnly: true
                }
                res.cookie('jwt', token, cookieOptions);  //setup cookie in browser
                res.status(200).redirect("/");
            }
        });
    }
    catch(err){
        console.log(err);
    }
}

exports.register = (req, res) => {
    console.log(req.body);
    // const name = req.body.name;
    // const email = req.body.email;
    // const password = req.body.password;
    // const passwordConfirm = req.body.passwordConfirm;

    //destructuring
    const {name, email, password, passwordConfirm} = req.body;

    db.query('SELECT email FROM users WHERE email = ?', [email], async (err, result) => {
        if(err){
            console.log(err);
            }
        if(result.length > 0){
            return res.render('register', {
                message: 'That email is already in use'
            })}
        else if(password !== passwordConfirm){
            return res.render('register', {
                message: 'Passwords do not match'
            });
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);
        db.query('INSERT INTO users SET ?', {name: name, email: email, password: hashedPassword}, (err, result) => {
            if(err){
                console.log(err);
            } else {
                return res.render('register', {
                    message: 'User registered'
                });
            }
        });
    });
}

exports.isLoggedIn = async (req, res, next) => {
    console.log(req.cookies);  //if we have cookie or not
    if(req.cookies.jwt){
         try{
            //verify the token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            console.log(decoded); 
            //check if the user still exists
            db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (err, result) => {
                console.log(result); 
                if(!result){
                    return next();
                }
                req.user = result[0];
                return next();
            });
         }
            catch(err){
                console.log(err);
                return next();
            }
    }
    else{
        next();
    }
}

exports.logout = async (req, res) => {
    //overwritte currecnt cookie
    res.cookie('jwt', 'logout', {
        expires: new Date(Date.now() + 2*1000),
        httpOnly: true
    });
    res.status(200).redirect("/");
}