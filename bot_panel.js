const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans
  ]
});

client.login('MTM4Mzc2MzA1MDM4MDc4NzcxMg.Ge1Agj.Us0Jy95S3m9S2KPVWdEZGKCT4EnFmyFUvq_BVs');

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  const guild = client.guilds.cache.first();

  // Push updates at startup
  sendUpdates();

  // Optional: Listen to events to auto-push (can also poll periodically)
  client.on('guildMemberAdd', sendUpdates);
  client.on('guildMemberRemove', sendUpdates);
});

async function sendUpdates() {
  const guild = client.guilds.cache.first();

  // Live fetch members
  await guild.members.fetch();
  const users = guild.members.cache.map(m => ({
    id: m.user.id,
    tag: `${m.user.username}#${m.user.discriminator}`
  }));

  // Live fetch bans
  const bans = await guild.bans.fetch();
  const bannedUsers = bans.map(b => ({
    id: b.user.id,
    tag: `${b.user.username}#${b.user.discriminator}`
  }));

  io.emit('update', { users, bans });
}

// **Hier komt de CSP header erbij**
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; font-src 'self' https://fonts.gstatic.com; style-src 'self' https://fonts.googleapis.com; script-src 'self';");
  next();
});

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Client connected');
  sendUpdates();

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(3000, () => {
  console.log('Panel running on http://localhost:3000');
});
