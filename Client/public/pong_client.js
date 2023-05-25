let side = null;
const socket = io();

/*function chooseSide() 
{
  const input = prompt('Choose your side (l or r):');
  if (input === 'l' )
  {
    side = "left";
    socket.emit('enterRoom', { player: left})
  }
  else if(input === 'r') 
  {
    side = "right";
  } 
  else 
  {
    alert('Invalid choice. Please choose "l" or "r".');
    chooseSide();
  }
}*/

socket.on('organization', (data) =>
{
  side = data.side;
  if(side === 'null')
  {
    document.getElementById("startButton").style.visibility = 'hidden';
  }
  else if(side === 'left' || side === 'right')
  {
    document.getElementById("startButton").style.visibility = 'visible';
  }
  document.getElementById('msg').textContent = data.msg;
})

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let scoreText = document.getElementById("scoreText");
let startButton = document.getElementById("startButton");
const paddleHeight = 90;
const paddleWidth = 30;

let leftPaddleY = (canvas.height - paddleHeight) / 2;
let rightPaddleY = (canvas.height - paddleHeight) / 2;
let ballX = 450;
let ballY = 300;
let leftScore = 0;
let rightScore = 0;

socket.on('updateBall', (data) => 
{
    ballX = data.X;
    ballY = data.Y;
});

socket.on('updatePaddle', (data) => 
{
  if (data.player === 'left') 
  {
    leftPaddleY = data.y;
  }
  else
  {
    rightPaddleY = data.y;
  }
});

socket.on('scored', (data) =>
{
  if(data.player === 'left')
  {
    leftScore = leftScore + 1;
  }
  if(data.player === 'right')
  {
    rightScore = rightScore + 1;
  }
  document.getElementById("scoreText").textContent = `${leftScore} : ${rightScore}`;
});

socket.on('endGame', (data) =>
{
  leftScore, rightScore = 0;
  if(side != 'null')
  {
    document.getElementById("startButton").style.visibility = 'visible';
  }
  document.getElementById('win').textContent = `${data} won!`;
  setTimeout(() => 
  {
    document.getElementById('win').textContent = ' ';
  }, 2500);
})
/*canvas.addEventListener("keydown", (event) => 
{
  if (event.code === 'Space')
  {
    console.log('cliquei espaço');
  }
});*/

function startGame()
{
  socket.emit('startGame', { player: side });
  document.getElementById("startButton").style.visibility = 'hidden';
  document.getElementById("scoreText").textContent = "0 : 0";
}


canvas.addEventListener('mousemove', (event) => 
{
  const mouseY = event.clientY - canvas.getBoundingClientRect().top;
  if (side === 'left')
  {
    //(line below) change the positiion of the paddles 
    leftPaddleY = mouseY - paddleHeight / 2;
  } 
  else if (side === 'right')
  {
    rightPaddleY = mouseY - paddleHeight / 2;
  }
  if(side === 'left' || side === 'right')
  {
    socket.emit('updatePaddle', { player: side, y: mouseY - paddleHeight / 2 });
  }
});



function draw() {
  
  ctx.fillStyle = "#228B22";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //desenhar bola 
  ctx.fillStyle = 'orange';
  ctx.beginPath();
  ctx.arc(ballX, ballY, 15, 2, 360);
  ctx.fill();

  //desenhar paddles
  ctx.fillStyle = 'white';
  ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);
  ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);

  requestAnimationFrame(draw);
}

draw();
