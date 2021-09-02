import { Client, Intents, MessageEmbed } from 'discord.js';
import { getConfig } from './config/config';
import { getRequiredPermissions } from './helpers/permissionHelper';

const CLIENT = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const CONFIG = getConfig();

CLIENT.once('ready', () => {
  console.log('Ready!');
});

CLIENT.on('messageCreate', async (message) => {
  // Server outage
  if (!message.guild?.available) return;

  // Not logged in
  if (CLIENT.user === null) return;

  const authorUser = message.author;
  const authorMember = message.member;
  const guild = message.guild;
  const channel = message.channel;

  if (authorUser.bot) return;
  if (!channel.isText()) return;
  if (!CONFIG?.threadChannels?.includes(channel.id)) return;

  const botMember = await guild.members.fetch(CLIENT.user);
  const botPermissions = botMember.permissionsIn(message.channel.id);
  const requiredPermissions = getRequiredPermissions();
  if (!botPermissions.has(requiredPermissions)) {
    try {
      const missing = botPermissions.missing(requiredPermissions);
      const errorMessage = `Missing permission${missing.length > 1 ? 's' : ''}:`;
      await message.channel.send(`${errorMessage}\n    - ${missing.join('\n    - ')}`);
    } catch (e) {
      console.log(e);
    }
    return;
  }

  const creationDate = message.createdAt.toISOString().slice(0, 10);
  const authorName = authorMember === null || authorMember.nickname === null ? authorUser.username : authorMember.nickname;

  const thread = await message.startThread({
    name: `${authorName.replace(/\(.*/, '').trim()} (${creationDate})`,
    autoArchiveDuration: CONFIG.threadArchiveDurationInMinutes,
  });

  const channelMention = `<#${channel.id}>`;
  const teamMention = channel.id === '872579324446928896' ? `<@&857704834597650472>` : `<@&857704834597650472> <@&882699029706862602>`;
  const relativeTimestamp = `<t:${Math.round(message.createdTimestamp / 1000)}:R>`;

  const threadMsg = await thread.send({
    embeds: [], // [embed],
    content: `Hey <@${authorUser.id}>! I've automatically created this helpful thread from your message ${relativeTimestamp}.\n\nPinging ${teamMention} so that they see this as well!`,
  });

  // await new Promise((resolve) => setTimeout(resolve, 5000));

  const embed = new MessageEmbed().setAuthor(authorName, authorUser.displayAvatarURL()).setDescription(`Thanks, @user! :taco: :taco: :taco:`).setColor([0, 206, 201]);

  // const tacosMention = await thread.send({
  // embeds: [embed],
  // content: `*Hint: was someone extra helpful in this thread? Say thank you with tacos!*`,
  // });

  // await threadMsg.pin();
  await thread.leave();
});

CLIENT.login(CONFIG.discordApiToken);
