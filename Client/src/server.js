const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('../public'));

const paddleHeight = 90;
const paddleWidth = 30;
const ballRadius = 15;
const gameHeight = 600;
const gameLength = 900;

let posX = gameLength / 2;
let posY = gameHeight / 2;
let speedX = 0;
let speedY = 0;
let leftPaddleY = 250;
let rightPaddleY = 250;
let gameIsGoing = false;
let leftIsReady = false;
let rightIsReady = false;
let rightScore = 0;
let leftScore = 0;
let players = [];

function playersIn(socketId)
{
  if(players.length === 0)
  {
    players.push(
      {
        id: socketId,
        side: 'left'
      });
    io.to(socketId).emit('organization', {side: 'left', msg: `You are playing as left`})
  }
  else if(players.length === 1)
  {
    players.push(
      {
        id: socketId,
        side: 'right'
      });
    io.to(socketId).emit('organization', {side: 'right', msg: `You are playing as right`})
  }
  else
  {
    players.push(
      {
        id: socketId,
        side: 'null'
      });
      io.to(socketId).emit('organization', {side: 'null', msg: `You are ${(players.length-2)} in the queue`})
  }
};

function playersOut(socketId)
{
  let phrase;
  let side;
  for(i = players.findIndex(e => e.id === socketId); i < (players.length-1); i++)
  {
    console.log(players[i]);
    players[i].id = players[i+1].id;
    if(i === 0)
      {
        phrase = 'playing as left';
        side = 'left';
      }
    else if(i === 1)
    {
        phrase = 'playing as right';
        side = 'right';
    }
    else
    {
        phrase = ` in the queue`;
        side = 'null';
    }
    console.log(players[i]);
    if(i === 0 || i === 1)
    {
      io.to(players[i].id).emit('organization', {side, msg: `You are ${phrase}`});
    }
    else
    {
      io.to(players[i].id).emit('organization', {side, msg: `You are ${(i-1) + phrase}`});
    }
  }
  players.pop();
}

function playersQueue(side)
{
  if(players.length > 2)
  {
    if(side === 'left')
    {
      io.to(players[0].id).emit('organization', {side: 'null', msg: `You are ${(players.length-2)} in the queue`});
      io.to(players[2].id).emit('organization', {side: 'left', msg: 'You are playing as left'});
      players.push(players[0]);
      players[0] = players[2];
      for(i = 2; i < (players.length - 1); i++)
      {
        players[i] = players[i+1];
      }
      players.pop();
    }
    else if(side === 'right')
    {
      io.to(players[1].id).emit('organization', {side: 'null', msg: `You are ${(players.length-2)} in the queue`});
      io.to(players[2].id).emit('organization', {side: 'right', msg: 'You are playing as right'});
      players.push(players[1]);
      players[1] = players[2];
      for(i = 2; i < (players.length - 1); i++)
      {
        players[i] = players[i+1];
      }
      players.pop();
    }
  }
}

function score(score)
{
  if(score === 'left')
  {
    leftScore = leftScore + 1;
    if(leftScore === 7)
    {
      endGame('left')
      playersQueue('right');
    }
    else
    {
      ballControl();
    }
  }
  if(score === 'right')
  {
    rightScore = rightScore + 1;
    if(rightScore === 7)
    {
      endGame('right');
      playersQueue('left');
    }
    else
    {
      ballControl();
    }
  }
};

function ballControl()
{
  if(gameIsGoing == true)
  {
    posX = gameLength / 2;
    posY = gameHeight / 2;
    speedX = -3;
    speedY = 3;
  }
  if(gameIsGoing == false)
  {
    gameIsGoing = true;
    speedX = 3;
    speedY = -3;
    updateBall();
  }
};

function updateBall() 
{
  if(gameIsGoing)
  {
    posX += speedX;
    posY += speedY;
    checkColision();
    setTimeout(() => 
    {
      updateBall();
    }, 100);
  }
  else if(gameIsGoing)
  {
    waitForDebugger;
  }
};

function checkColision()
{
  if(posY < ballRadius)
  {
    speedY *= -1;
  }
  if(posY > gameHeight - ballRadius)
  {
    speedY *= -1;
  }
  if(posX < ballRadius)
  {
    io.emit('scored', { player: "right" })
    score('right');
  }
  if(posX > (gameLength - ballRadius))
  {
    io.emit('scored', { player: "left" })
    score('left');
  }
  if((posX > ballRadius) && (posX <= (paddleWidth + ballRadius)))
  {
    if(posY > (leftPaddleY) && posY < (leftPaddleY + paddleHeight))
    {
      speedX *= -2;
      posX = paddleWidth + ballRadius;
    }
  }
  if(posX < (gameLength - ballRadius) && posX >= (gameLength - paddleWidth - ballRadius))
  {
    if(posY > (rightPaddleY) && posY < (rightPaddleY + paddleHeight))
    {
      speedX *= -2;
      posX = gameLength - paddleWidth - ballRadius;
    }
  }
};

function endGame(winner)
{
  gameIsGoing = false;
  rightScore, leftScore = 0;
  posX = gameLength / 2;
  posY = gameHeight / 2;
  speedX = 0;
  speedY = 0;
  io.emit('endGame', winner)
}

io.on('connection', (socket) => 
{
  console.log('a user connected');
  playersIn(socket.id);

  socket.on('disconnect', () => 
  {
    console.log('user disconnected');
    let x = players.findIndex(e => e.id === socket.id);
    if(x === 0)
    {
      endGame('right');
    }
    else if(x === 1)
    {
      endGame('left');
    }
    playersOut(socket.id);
  });

  setInterval(() => {
    socket.emit('updateBall', { X: posX, Y: posY, status: gameIsGoing});
  }, 10)

  socket.on('startGame', (data) => 
  {
    if (data.player === 'left')
    {
      leftIsReady = true;
      console.log('Esquerdo pronto');
    } else if (data.player === 'right')
    {
      rightIsReady = true;
      console.log('Direito pronto');
    }
    if(leftIsReady && rightIsReady)
    {
      leftIsReady = false;
      rightIsReady = false;
      ballControl();
      console.log('Jogo começou');
    }
  });

  socket.on('updatePaddle', (data) => 
  {
    if (data.player === 'left')
    {
      leftPaddleY = data.y;
    } else if (data.player === 'right')
    {
      rightPaddleY = data.y;
    }

    //(line below) send to all the clients, including the original sender of the data
    //socket.emit('updatePaddle', data);
    
    //(line below) send to all the clients, excepting the original sender of the data
    socket.broadcast.emit('updatePaddle', { player: data.player, y: data.y });
  });
});

const port = process.env.PORT || 3000;
http.listen(port, () => 
{
  console.log(`Escutando no ip local, na porta:${port}`);
});
