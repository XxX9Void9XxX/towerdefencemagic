const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let players = {};
let materials = [];

// Create some random materials
for(let i=0; i<50; i++){
    materials.push({ id: i, x: Math.random() * 2000, y: Math.random() * 2000 });
}

io.on('connection', socket => {
    console.log('Player connected:', socket.id);

    players[socket.id] = { x: Math.random()*800, y: Math.random()*600, health:100, spells:[], materials:0, respawnTimer:0 };
    
    socket.emit('init', { id: socket.id, materials });

    io.emit('state', players);

    socket.on('move', data => {
        const p = players[socket.id];
        if(!p || p.health <= 0) return;
        p.x += data.x; p.y += data.y;
        p.x = Math.max(0, Math.min(p.x, 2000));
        p.y = Math.max(0, Math.min(p.y, 2000));
        materials.forEach((m,i)=>{
            if(Math.abs(p.x-m.x)<20 && Math.abs(p.y-m.y)<20){
                p.materials++; materials.splice(i,1);
            }
        });
        io.emit('state', players);
    });

    socket.on('castSpell', spell => {
        const p = players[socket.id];
        if(!p || p.health <= 0) return;
        p.spells.push(spell);
        for(const id in players){
            if(id!==socket.id){
                const target = players[id];
                if(Math.abs(target.x-spell.x)<20 && Math.abs(target.y-spell.y)<20){
                    target.health-=20;
                    if(target.health<=0){ target.respawnTimer=100; target.health=0; }
                }
            }
        }
        io.emit('state', players);
    });

    socket.on('disconnect', ()=>{ delete players[socket.id]; io.emit('state', players); });
});

function gameLoop(){
    for(const id in players){
        const p = players[id];
        if(p.respawnTimer>0){ p.respawnTimer--; if(p.respawnTimer===0){ p.x=Math.random()*800; p.y=Math.random()*600; p.health=100; p.spells=[]; } }
    }
    io.emit('state', players);
    setTimeout(gameLoop, 50);
}
gameLoop();

http.listen(PORT, ()=>console.log('Server running on port', PORT));
