var mysql = require("mysql");
var _ = require("lodash");

function REST_ROUTER(router, connection, md5) {
    var self = this;
    self.handleRoutes(router, connection, md5);
}

REST_ROUTER.prototype.handleRoutes = function (router, connection, md5) {
    // Troll
    router.get("/", function (req, res) {
        res.json({"Message": "Hello World !"});
    });
    //  Create a group
    router.post("/group", function (req, res) {
        var query = "INSERT INTO ??(??) VALUES (?);";
        var table = ["discussions", "name", req.body.name];

        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({"Error": true, "Message": "Error executing MySQL query"});
            } else {
                var data = JSON.parse(req.body.users);
                _.forEach(data.users, function (value, key) {
                    var queryBis = "INSERT INTO owned (id, id_Discussions) SELECT  u.id, d.id FROM users u, discussions d WHERE u.first_name = ? AND u.last_name = ? AND d.id = (SELECT Max(id) as id FROM discussions);";
                    var tableBis = [value.first_name, value.last_name];

                    query = mysql.format(queryBis, tableBis);
                    connection.query(query, function (err, rows) {
                        if (err) {
                            console.log({"Error": true, "Message": "Error executing MySQL query"});
                        } else if (key === (data.users.length - 1)) {
                            res.json({"Error": false, "Message": "All Users Added to Discussion !"});
                        }
                    });
                });
            }
        });
    });
    // List of groups
    router.get("/group", function (req, res) {
        var query = "SELECT * FROM discussions ;";

        connection.query(query, function (err, rows) {
            if (err) {
                res.json({"Error": true, "Message": "Error executing MySQL query"});
            } else {
                res.json({"Error": false, "Message": "Success", "Groups": rows});
            }
        });
    });
    // Group for a given id
    router.get("/group/:group_id", function (req, res) {
        var query = "SELECT * FROM discussions where id = ?;";
        var table = [req.params.group_id];

        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({"Error": true, "Message": "Error executing MySQL query"});
            } else {
                res.json({"Error": false, "Message": "Success", "Groups": rows});
            }
        });
    });
    // Authentication
    router.post("/auth", function (req, res) {
        var query = "SELECT * FROM users where first_name = ? AND password = SHA2(?, 256) ;";
        var table = [req.body.first_name, req.body.password];

        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({"Error": true, "Message": "Error executing MySQL query"});
            } else {
                res.json({"Error": false, "Message": "Success", "Authentication success": rows});
            }
        });
    });
    // Add a user and add it to the main thread
    router.post("/user", function (req, res) {
        var query = "INSERT INTO users (first_name, last_name, password, is_ad) VALUES (?, ?, SHA2(?, 256), ?);";
        var table = [req.body.first_name, req.body.last_name, req.body.password, parseInt(req.body.is_ad)];

        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({"Error": true, "Message": "Error executing MySQL query"});
            } else {
                var queryBis = "INSERT INTO owned (id, id_Discussions) VALUES ((SELECT Max(id) as id FROM users), 1);";
                connection.query(queryBis, function (err, rows) {
                    if (err) {
                        res.json({"Error": true, "Message": "Error executing MySQL query"});
                    } else {
                        res.json({"Error": false, "Message": "User Added !"});
                    }
                });
            }
        });
    });
    // List of messages for a given group
    router.get("/group/:group_id/messages", function (req, res) {
        var query = "SELECT * FROM messages INNER JOIN discussions ON(messages.id_Discussions = discussions.id) INNER JOIN users ON(messages.id_Users = users.id) WHERE discussions.id = ? ;";
        var table = [req.params.group_id];

        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({"Error": true, "Message": "Error executing MySQL query"});
            } else {
                res.json({"Error": false, "Message": "Success", "Messages": rows});
            }
        });
    });
    // List of messages for a given group and a given limit number of messages to retrieve
    router.get("/group/:group_id/messages/:limit_nb", function (req, res) {
        var query = "SELECT * FROM messages INNER JOIN discussions ON(messages.id_Discussions = discussions.id) INNER JOIN users ON(messages.id_Users = users.id) " +
            "WHERE discussions.id = ? ORDER BY message_date DESC LIMIT ?;";
        var table = [req.params.group_id, parseInt(req.params.limit_nb)];

        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({"Error": true, "Message": "Error executing MySQL query"});
            } else {
                res.json({"Error": false, "Message": "Success", "Messages": rows});
            }
        });
    });
    // List of groups for a given user
    router.get("/user/:user_id/group", function (req, res) {
        var query = "SELECT d.id, d.name FROM owned INNER JOIN discussions d ON (owned.id_discussions = d.id) where owned.id = ? ;";
        var table = [parseInt(req.params.user_id)];

        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({"Error": true, "Message": "Error executing MySQL query"});
            } else {
                res.json({"Error": false, "Message": "Success", "DIscussions": rows});
            }
        });
    });
    // Add a message in a given group
    router.post("/group/:group_id/messages", function (req, res) {
        var query = "INSERT INTO messages (message_date, message, is_media, id_Users, id_Discussions) VALUES (NOW(), ?, ?, ?, ?); ";
        var table = [req.body.message, req.body.is_media, req.body.id_Users, req.params.group_id];

        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({"Error": true, "Message": "Error executing MySQL query"});
            } else {
                res.json({"Error": false, "Message": "Message Added to Discussion !"});
            }
        });
    });
    // Add a user in a given group
    router.post("/group/:group_id/users", function (req, res) {
        var query = "INSERT INTO owned (id, id_Discussions) SELECT  u.id, d.id FROM users u, discussions d " +
            "WHERE u.first_name = ? AND u.last_name = ? AND d.id = ?;";
        var table = [req.body.first_name, req.body.last_name, req.params.group_id];

        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({"Error": true, "Message": "Error executing MySQL query"});
            } else {
                res.json({"Error": false, "Message": "User Added to Discussion !"});
            }
        });
    });
    // List of users for a given group
    router.get("/group/:group_id/users", function (req, res) {
        var query = "SELECT users.id, users.first_name, users.last_name FROM users INNER JOIN owned on (users.id = owned.id) where owned.id_Discussions = ?;";
        var table = [req.params.group_id];

        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({"Error": true, "Message": "Error executing MySQL query"});
            } else {
                res.json({"Error": false, "Message": "Success", "Users": rows});
            }
        });
    });
};

module.exports = REST_ROUTER;