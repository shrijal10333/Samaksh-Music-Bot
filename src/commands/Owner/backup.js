const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'backup',
    description: 'Create a backup of the bot source code',
    category: 'Owner',
    owner: true,


    async execute(message, args, client) {
        if (message.author.id !== '1236182929558732802') return;

        const loading = await message.reply({
            components: [
                new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**${client.emoji.load} Creating backup, please wait...**`)
                )
            ],
            flags: MessageFlags.IsComponentsV2
        });

        try {
            const backupFile = await createBackup();
            const developer = await client.users.fetch('1236182929558732802');

            const dmChannel = await developer.createDM();
            const prevMsgs = await dmChannel.messages.fetch({ limit: 20 });
            for (const m of prevMsgs.values()) {
                if (m.author.id === client.user.id && (m.attachments.some(a => a.name.includes('backup')) || m.content.includes('Backup successful'))) {
                    await m.delete().catch(() => null);
                }
            }

            const dmMsg = await developer.send({
                files: [backupFile],
                content: `<t:${Math.floor(Date.now() / 1000)}:F> !`
            });

            setTimeout(async () => {
                await dmMsg.delete().catch(() => null);
            }, 300000);

            if (fs.existsSync(backupFile)) fs.unlinkSync(backupFile);

            return loading.edit({
                components: [
                    new ContainerBuilder().addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`**${client.emoji.check} Backup has been sent to your DMs.**`)
                    )
                ]
            });
        } catch (error) {
            console.error(error);
            return loading.edit({
                components: [
                    new ContainerBuilder().addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`**${client.emoji.cross} Failed to create backup: ${error.message}**`)
                    )
                ]
            });
        }
    }
};

async function createBackup() {
    const rootDir = path.resolve(__dirname, '../../../');
    const backupPath = path.join(rootDir, `groove_backup.zip`);

    fs.readdirSync(rootDir).forEach(file => {
        if ((file.startsWith('backup_') && file.endsWith('.zip')) || file === 'groove_backup.zip') {
            fs.unlinkSync(path.join(rootDir, file));
        }
    });

    const output = fs.createWriteStream(backupPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
        output.on('close', () => resolve(backupPath));
        archive.on('error', (err) => reject(err));

        archive.pipe(output);

        archive.directory(path.join(rootDir, 'src/'), 'src');
        archive.file(path.join(rootDir, '.env'), { name: '.env' });
        archive.file(path.join(rootDir, 'database.db'), { name: 'database.db' });
        archive.file(path.join(rootDir, 'index.js'), { name: 'index.js' });
        archive.file(path.join(rootDir, 'config.eps'), { name: 'config.eps' });
        archive.file(path.join(rootDir, 'package.json'), { name: 'package.json' });
        archive.file(path.join(rootDir, 'Shard.js'), { name: 'Shard.js' });
        archive.file(path.join(rootDir, 'database.db-shm'), { name: 'database.db-shm' });
        archive.file(path.join(rootDir, 'database.db-wal'), { name: 'database.db-wal' });

        archive.finalize();
    });
}
