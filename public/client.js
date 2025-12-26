const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let players = {}, myId, materials = [];
const mapSize = 2000;
let camera = {x:0, y:0};
const speed = 5;
const keys = {};

document.addEventListener('keydown', e => keys[e.key]=true);
document.addEventListener('keyup', e => keys[e.key]=false);
canvas.addEventListener('click', e => {
    socket.emit('castSpell', {x:camera.x+e.offsetX, y:camera.y+e.offsetY});
});

socket.on('init', data => { myId = data.id; materials = data.materials; });
socket.on('state', serverPlayers => { players = serverPlayers; });

function gameLoop(){
    if(myId && players[myId]){
        const p = players[myId]; let dx=0, dy=0;
        if(keys['w']) dy-=speed; if(keys['s']) dy+=speed; if(keys['a']) dx-=speed; if(keys['d']) dx+=speed;
        if(dx!==0||dy!==0) socket.emit('move',{x:dx,y:dy});

        camera.x = p.x - canvas.width/2; camera.y = p.y - canvas.height/2;
        camera.x = Math.max(0, Math.min(camera.x,mapSize-canvas.width));
        camera.y = Math.max(0, Math.min(camera.y,mapSize-canvas.height));

        document.getElementById('healthText').innerText='Health: '+p.health;
        document.getElementById('materialsText').innerText='Materials: '+p.materials;
    }
    draw(); requestAnimationFrame(gameLoop);
}

function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='orange'; materials.forEach(m=>ctx.fillRect(m.x-camera.x,m.y-camera.y,15,15));
    for(const id in players){
        const p=players[id], x=p.x-camera.x, y=p.y-camera.y;
        ctx.fillStyle=id===myId?'lime':'red';
        ctx.fillRect(x,y,20,20);
        if(p.spells) p.spells.forEach(s=>{
            ctx.fillStyle='yellow';
            ctx.beginPath(); ctx.arc(s.x-camera.x,s.y-camera.y,5,0,Math.PI*2); ctx.fill();
        });
    }
}

gameLoop();
