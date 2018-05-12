var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var app = express();
const LoginWithTwitter = require('login-with-twitter');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express.static(__dirname + '/static'));

// database creation
var con = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: 'e07757157711994'
});
con.connect(function(err) {
    if (err) throw err;
    else {
        con.query("CREATE DATABASE IF NOT EXISTS fcc_voting_app", function(err) {
            if (err) throw err;
            console.log("DB created");
            createTables();
        });
    }
});

// tables creation
function createTables() {
    var connection = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        password: 'e07757157711994',
        database: "fcc_voting_app"
    });
    connection.connect(function(err) {
        if (err) {
            throw err;
        } else {
            connection.query("CREATE TABLE IF NOT EXISTS authenticated_user(\
            fName varchar(20) NOT NULL, \
            mName varchar(20) NULL, \
            lName varchar(20) NOT NULL, \
            uName varchar(20) NOT NULL, \
            password varchar(20) NOT NULL, \
            user_ID int(5) zerofill primary key NOT NULL auto_increment)",
                function(err) {
                    if (err) throw err;
                    console.log("First Table created");
                });
            connection.query("CREATE TABLE IF NOT EXISTS all_polls(\
            poll_id int(10) primary key NOT NULL auto_increment, \
            poll_title varchar(50) NOT NULL, \
            discription varchar(250) NOT NULL, \
            date_and_time_created DATETIME, \
            poll_owner_ID int(5) zerofill NOT NULL)",
                function(err) {
                    if (err) throw err;
                    console.log("Second Table created");
                });
            connection.query("CREATE TABLE IF NOT EXISTS all_options(\
            option_id int(10) primary key NOT NULL auto_increment, \
            poll_options varchar(50) NOT NULL, \
            votes int(5) NOT NULL, \
            poll_ID int(10) NOT NULL)",
                function(err) {
                    if (err) throw err;
                    console.log("Third Table created");
                });
        }
    });
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.get("/", function(req, res) {
        res.sendFile(__dirname + "/static/views/index.html");
    });
    app.get("/views/index.html", function(req, res) {
        res.sendFile(__dirname + "/views/index.html");
    });
    app.get("/views/signIn.html", function(req, res) {
        res.sendFile(__dirname + "/views/signIn.html");
    });
    app.get("/views/create.html", function(req, res) {
        res.sendFile(__dirname + "/views/create.html");
    });
    app.get("/views/myAccount.html", function(req, res) {
        res.sendFile(__dirname + "/views/myAccount.html");
    });
    app.get("/views/index_signin.html", function(req, res) {
        res.sendFile(__dirname + "/views/index_signin.html");
    });
    app.get("/views/newPoll.html", function(req, res) {
        res.sendFile(__dirname + "/views/newPoll.html");
    });
    app.get("/views/myPolls.html", function(req, res) {
        res.sendFile(__dirname + "/views/myPolls.html");
    });
    app.get("/views/err.html", function(req, res) {
        res.sendFile(__dirname + "/views/err.html");
    });

    // app.get("/twitter", function(req, res) {


    //     const tw = new LoginWithTwitter({
    //         consumerKey: 'Lr6sLrhIqLcvpxJ4IQL4Wjc7d',
    //         consumerSecret: 'aUU5I0ubc8Yj8sbpGF9Oupau971SBan6jDAN9vff9qpMuVKgpR',
    //         callbackUrl: 'http://127.0.0.1:3000/twitter/callback'
    //     });
    //     // res.sendFile(__dirname + "/views/myPolls.html");
    // });

    app.get("/twit", function(req, res) {
        var user_info = { "fName": "John", "mName": "P", "lName": "Flomo" };
        connection.query("INSERT INTO authenticated_user set ?", [user_info], function(err, result) {
            if (err) {
                throw err;
            } else {
                console.log("inseted");
                // res.sendFile(__dirname + "/static/views/newPoll.html");
            }
        });

    });
    var last_inserted_id;
    var clicked_poll, option_poll_clicked, option_names, option_votes, poll_option_data; // variable to store the "id" of the item that was clicked in the front-end
    // "post method" to receive "poll_title" that was clicked on the front-end
    app.post("/views/table_for_polls", function(req, res) {
        clicked_poll = req.body.id;
    });
    // "post method" to receive "poll_option" that was clicked on the front-end
    app.post("/views/table_for_options", function(req, res) {
        option_poll_clicked = req.body.id;
        console.log("option id : " + option_poll_clicked);
        console.log(req.body);

        connection.query("SELECT votes FROM all_options where option_id = ?", option_poll_clicked, function(err, result) {
            if (err) throw err;
            else {
                var count = result[0].votes;
                var sum = count + 1;
                // console.log(count + " " + sum);
                connection.query("UPDATE all_options SET votes = ? where option_id = ?", [sum, option_poll_clicked], function(err, result) {
                    if (err) throw err;
                    else {
                        console.log("Vote Updated");
                    }
                });
            }
        });

    });

    // update votes in the polls_option table
    app.get("/update_vote", function() {
        connection.query("UPDATE all_options SET votes = ? where poll_ID = ?", option_poll_clicked, function(err, result) {
            if (err) throw err;
            else {
                res.send(result);
            }
        });
    })

    app.get("/list_of_options", function(req, res) {
        connection.query("SELECT option_id, poll_options, votes FROM all_options where poll_ID = ?", clicked_poll, function(err, result) {
            if (err) throw err;
            else {
                // option_names = result[0].poll_options;
                // option_votes = result[0].votes;
                // // opll_option_data = [result];

                // console.log(poll_option_data);
                // console.log(result);

                res.send(result);
            }
        });
    });

    // uploading poll data to database
    app.post('/views/formData', function(req, res) {
        // select the user id from the "authenticated_user" table and
        // insert it into the all_polls table in the column "poll_owner_id"
        connection.query("SELECT user_ID FROM authenticated_user where user_ID = ?", last_inserted_id, function(err, result) {
            if (err) throw err;
            else {
                var arr = [
                    [req.body.poll_title, req.body.discription, new Date(), result[0].user_ID]
                ];
                // In the "all_polls" table, insert the data into the column in the parentensis
                connection.query("INSERT INTO all_polls (poll_title, discription, date_and_time_created, poll_owner_ID) values ?", [arr], function(err, result) {
                    if (err) {
                        throw err;
                    } else {
                        // select the last inserted poll(id) from the "all_polls" table
                        connection.query("select poll_id from all_polls where poll_id in (last_insert_id())", function(err, result) {
                            if (err) throw err;
                            else {

                                var cur_id = result[0].poll_id;
                                // get the form data from the user
                                var str = req.body.options;
                                // convert "str" to array
                                var arr = str.split(",");
                                var i;

                                // loop through the array and insert each item into a separate row in the "all_option" table
                                for (i = 0; i < arr.length; i++) {
                                    var values = [
                                        [arr[i], cur_id]
                                    ];
                                    // in the "all_options" table, insert the data into the "poll_options" column
                                    // insert the last inserted poll id into the "options" table to all the options for that poll
                                    connection.query("INSERT INTO all_options (poll_options, poll_ID) VALUES ?", [values], function(err, result) {
                                        if (err) throw err;
                                        else
                                            console.log("Data Inserted");
                                    });
                                }
                            }
                        });
                        res.sendFile(__dirname + "/static/views/newPoll.html");
                    }
                });
            }
        })
    });
    // user create new account
    app.post("/views/createAcc", function(req, res) {
            connection.query("INSERT INTO authenticated_user set ?", req.body, function(err, result) {
                if (err) throw err;
                else {
                    connection.query("select user_ID from authenticated_user where user_ID in (last_insert_id())", function(err, result) {
                        if (err) throw err;
                        else {
                            last_inserted_id = result[0].user_ID;
                            console.log(last_inserted_id);
                            res.sendFile(__dirname + "/static/views/signIn.html");
                        }
                    });
                }
            });
        })
        // user create new account
    app.post("/views/myAccount", function(req, res) {
        var userName = [req.body];
        connection.query("SELECT user_ID FROM authenticated_user WHERE uName = ?", userName[0].uName, function(err, result) {
            if (err) {
                res.sendFile(__dirname + "/static/views/err.html");
                // res.send("Sorry");
            } else {
                last_inserted_id = result[0].user_ID;
                console.log(last_inserted_id);
                res.sendFile(__dirname + "/static/views/signIn.html");
            }
        });
    })
    console.log(last_inserted_id);
    // select all the poll_titles from the "all_polls" table and display it on the website
    app.get("/list_of_polls", function(req, res) {
        connection.query("SELECT poll_title, poll_id FROM all_polls ORDER BY date_and_time_created DESC", function(err, result) {
            if (err) throw err;
            else
                res.send(result);
        });
    });

    app.get("/your_list_of_polls", function(req, res) {
        connection.query("SELECT poll_title FROM all_polls WHERE poll_owner_ID = ?", last_inserted_id, function(err, result) {
            if (err) throw err;
            else {
                console.log(result);
                res.send(result);
            }
        });
    });

    // // Twitter Login
    // var express = require('express');
    // var passport = require('passport');
    // var Strategy = require('passport-twitter').Strategy;

    // passport.use(new Strategy({
    //         consumerKey: 'Lr6sLrhIqLcvpxJ4IQL4Wjc7d',
    //         consumerSecret: 'aUU5I0ubc8Yj8sbpGF9Oupau971SBan6jDAN9vff9qpMuVKgpR',
    //         callbackURL: 'http://127.0.0.1:3000/login/twitter/return'
    //     },
    //     function(token, tokenSecret, profile, cb) {
    //         return cb(null, profile);
    //     }));

    // passport.serializeUser(function(user, cb) {
    //     cb(null, user);
    // });

    // passport.deserializeUser(function(obj, cb) {
    //     cb(null, obj);
    // });

    // app.use(require('cookie-parser')());
    // app.use(require('body-parser').urlencoded({ extended: true }));
    // app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

    // // Initialize Passport and restore authentication state, if any, from the
    // // session.
    // app.use(passport.initialize());
    // app.use(passport.session());


    // // Define routes.
    // app.get('/Mytwits',
    //     function(req, res) {
    //         res.send({ user: req.user });
    //     });

    // // app.get('/login',
    // //     function(req, res) {
    // //         res.render('login');
    // //     });

    // app.get('/login/twitter',
    //     passport.authenticate('twitter'));

    // app.get('/login/twitter/return', passport.authenticate('twitter', { failureRedirect: '/login' }),
    //     function(req, res) {
    //         res.redirect('/');
    //     });

    // app.get('/profile', require('connect-ensure-login').ensureLoggedIn(),
    //     function(req, res) {
    //         res.render({ user: req.user });
    //     });



    app.get("/err", function(req, res) {
        res.sendFile(__dirname + "/static/views/err.html");
        // res.sendFile(__dirname + "/static/views/signIn.html");
    });








} // function close. Every route should be in this function

app.listen(3000, function() {
    console.log("Node is listening on PORT 3000");
})