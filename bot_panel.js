const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
const port = 3000;
const DISCORD_TOKEN = 'MTM4Mzc2MzA1MDM4MDc4NzcxMg.GWhYJc.sPh2SrkgS7hhJPWUOLYuaNf802dPUQjKyL2uq4';
const GUILD_ID = '1285341049547657278';

app.use(express.json());
app.use(express.static('public')); // Serve your HTML

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

let guildRef;
let botStartTime = Date.now();
let logs = [];

// API endpoints
app.get('/api/memberCount', async (req, res) => {
  if (guildRef) {
    await guildRef.members.fetch(); // Ensure cache is fresh
    res.json({ memberCount: guildRef.memberCount });
  } else {
    res.status(500).json({ error: 'Guild not ready' });
  }
});

app.get('/api/banCount', async (req, res) => {
  if (guildRef) {
    const bans = await guildRef.bans.fetch();
    res.json({ banCount: bans.size });
  } else {
    res.status(500).json({ error: 'Guild not ready' });
  }
});

app.get('/api/uptime', (req, res) => {
  res.json({ uptimeMs: Date.now() - botStartTime });
});

app.get('/api/commands', (req, res) => {
  res.json(['ban', 'kick']); // Extend this as you add more
});

app.get('/api/logs', (req, res) => {
  res.json(logs.slice(-20)); // Last 20 logs
});

app.get('/api/users', async (req, res) => {
  if (guildRef) {
    await guildRef.members.fetch();
    const users = guildRef.members.cache.map(m => ({
      id: m.id,
      username: m.user.username
    }));
    res.json(users);
  } else {
    res.status(500).json({ error: 'Guild not ready' });
  }
});

app.post('/api/useCommand', async (req, res) => {
  const { command, userId } = req.body;
  try {
    const member = await guildRef.members.fetch(userId);
    if (command === 'kick') {
      await member.kick('Kicked via dashboard');
      logs.push(`Kicked ${member.user.tag}`);
      res.json({ message: `Kicked ${member.user.tag}` });
    } else if (command === 'ban') {
      await member.ban({ reason: 'Banned via dashboard' });
      logs.push(`Banned ${member.user.tag}`);
      res.json({ message: `Banned ${member.user.tag}` });
    } else {
      res.status(400).json({ error: 'Unknown command' });
    }
  } catch (e) {
    res.status(500).json({ error: `Failed to execute: ${e.message}` });
  }
});

// Start Express server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Start Discord bot
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  guildRef = await client.guilds.fetch(GUILD_ID);
  await guildRef.members.fetch();
  logs.push('Bot started and guild loaded');
});

client.on('guildMemberAdd', member => {
  if (member.guild.id === GUILD_ID) {
    logs.push(`User joined: ${member.user.tag}`);
  }
});

client.on('guildMemberRemove', member => {
  if (member.guild.id === GUILD_ID) {
    logs.push(`User left: ${member.user.tag}`);
  }
});

client.login(DISCORD_TOKEN);