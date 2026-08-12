const fs = require('fs');
const path = require('path');

function getAllCommands() {
  const commandsPath = path.join(__dirname, '../commands');
  const commandsList = [];

  if (!fs.existsSync(commandsPath)) return commandsList;

  const categories = fs.readdirSync(commandsPath);
  for (const cat of categories) {
    const catDir = path.join(commandsPath, cat);
    if (!fs.statSync(catDir).isDirectory()) continue;

    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      try {
        const cmd = require(path.join(catDir, file));
        let aliases = [];
        if (Array.isArray(cmd.aliases)) {
          aliases = cmd.aliases.filter(a => a && a.trim() !== "");
        } else if (typeof cmd.aliases === 'string' && cmd.aliases.trim() !== "") {
          aliases = [cmd.aliases.trim()];
        }

        commandsList.push({
          name: cmd.name || file.replace('.js', ''),
          description: cmd.description || 'No description provided.',
          category: cmd.category || cat,
          aliases: aliases,
          usage: cmd.usage || ''
        });
      } catch (e) {
        // Fallback for files that require client context
        commandsList.push({
          name: file.replace('.js', ''),
          description: 'Bot command',
          category: cat,
          aliases: [],
          usage: ''
        });
      }
    }
  }
  return commandsList;
}

module.exports = getAllCommands;
