const path = require("path");
var express = require("express");
var app = express();
var server = require("http").Server(app);
const socketio = require("socket.io");
const io = socketio(server);
// require("./socket")(io);
var players = {};
var star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50,
};
var scores = {
  blue: 0,
  red: 0,
};

app.use(express.static(path.join(__dirname, "..", "public")));

// sends index.html
app.use("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public/index.html"));
});

io.on("connection", function (socket) {
  console.log("a user connected");
  // create a new player and add it to our players object
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    team: Math.floor(Math.random() * 2) == 0 ? "red" : "blue",
  };
  // send the players object to the new player
  socket.emit("currentPlayers", players);
  // send the star object to the new player
  socket.emit("starLocation", star);
  // send the current scores
  socket.emit("scoreUpdate", scores);
  // update all other players of the new player
  socket.broadcast.emit("newPlayer", players[socket.id]);
  // when a player disconnects, remove them from our players object
  socket.on("disconnect", function () {
    console.log("user disconnected");
    // remove this player from our players object
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit("disconnected", socket.id);
  });
  // when a player moves, update the player data
  socket.on("playerMovement", function (movementData) {
    // console.log("inside playermovement, socket object ---> ", socket);
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    socket.broadcast.emit("playerMoved", players[socket.id]);
  });
  socket.on("starCollected", function () {
    if (players[socket.id].team === "red") {
      scores.red += 10;
    } else {
      scores.blue += 10;
    }
    star.x = Math.floor(Math.random() * 700) + 50;
    star.y = Math.floor(Math.random() * 500) + 50;
    io.emit("starLocation", star);
    io.emit("scoreUpdate", scores);
  });
});

server.listen(8081, function () {
  console.log(`Listening on 8081`);
});
