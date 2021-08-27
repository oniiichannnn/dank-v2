const Discord = require('discord.js')
const client = new Discord.Client({ws:{intents: Discord.Intents.ALL},fetchAllMembers: true,partials: ['REACTION','MESSAGE','USER']})
const ms = require('ms')
const { API, } = require('nhentai-api');
const api = new API()
const express = require("express")

client.on('ready',async () => {
    console.log('Logged In')
    client.user.setActivity('read',{type: 'LISTENING'})
})

client.on("message",async message => {
	let args = message.content.split(/ +/)

	if(message.content.toLowerCase().startsWith("read")){
		if(!args[1]) return send("You need to give me a hentai manga's name")
		let input = message.content.slice('read'.length).trim()
		let searchQuery = encodeURIComponent(input)

		send(`Searching for "**${message.content.slice('read'.length).trim()}**", please wait`)

		api.search(searchQuery).then(async res => {
			if(res.books.length === 0) return send("No results found")

			let newRes = []
			let page = 2

			for(var i = 0; i < res.books.length; i++){
				newRes.push(res.books[i])

				if(i + 1 === res.books.length){
					let trySearch = await api.search(searchQuery,page)

					while (trySearch.books.length !== 0){
						page++
						for(var i = 0;i < trySearch.books.length; i++){
							newRes.push(trySearch.books[i])
						}

						trySearch = await api.search(searchQuery,page)
					}

				}
			}

			if(newRes.length > 1){
				let index_1 = 0

				let languages = newRes[index_1].tags.filter(t => t.type.type === 'language')
				let anime = newRes[index_1].tags.filter(t => t.type.type === 'parody')
				let characters = newRes[index_1].tags.filter(t => t.type.type === 'character')
				let tags = newRes[index_1].tags.filter(t => t.type.type === 'tag')

				message.channel.send("React with 📕 to read this book",
					new Discord.MessageEmbed()
					.setTitle(newRes[index_1].title.english)
					.setDescription(
						`**Language:** ${languages.map(l => `**\`${l.name}\`**`)}\n`+
						`**Anime:** ${anime.length === 0 ? '' : anime.map(a => a.name)}\n`+
						`**Characters:** ${characters.length === 0 ? '' : characters.map(c => `[${c.name}](${invite})`)}\n`+
						`**Tags:** ${tags.map(t => `\`${t.name.toUpperCase()}\``)}`
					)
					.setImage(`https://i.nhentai.net/galleries/${newRes[index_1].media}/${newRes[index_1].pages[0].id}.${newRes[index_1].pages[0].type.extension}`)
					.setFooter(`Result ${index_1 + 1} / ${newRes.length}`)
					.setURL(`https://nhentai.net/g/${newRes[index_1].id}`)
				)
				.then(async (sent) => {
					await sent.react('◀️')
					await sent.react('▶️')
					await sent.react('📕')

					let collector = await sent.createReactionCollector(
						(reaction,user) => user.id === message.author.id,
						{ time: ms('10 minutes') }
					)

					collector.on('collect', async (reaction,user) => {
						if(reaction.emoji.name === '▶️'){
							await reaction.users.remove(user.id)
							collector.resetTimer()
							index_1 = index_1 + 1
							if(index_1 > newRes.length) index_1 = 0

							let languages = newRes[index_1].tags.filter(t => t.type.type === 'language')
							let anime = newRes[index_1].tags.filter(t => t.type.type === 'parody')
							let characters = newRes[index_1].tags.filter(t => t.type.type === 'character')
							let tags = newRes[index_1].tags.filter(t => t.type.type === 'tag')

							sent.edit("React with 📕 to read this book",
								new Discord.MessageEmbed()
								.setTitle(newRes[index_1].title.english)
								.setDescription(
									`**Language:** ${languages.map(l => `**\`${l.name}\`**`)}\n`+
									`**Anime:** ${anime.length === 0 ? '' : anime.map(a => a.name)}\n`+
									`**Characters:** ${characters.length === 0 ? '' : characters.map(c => `[${c.name}](${invite})`)}\n`+
									`**Tags:** ${tags.map(t => `\`${t.name.toUpperCase()}\``)}`
								)
								.setImage(`https://i.nhentai.net/galleries/${newRes[index_1].media}/${newRes[index_1].pages[0].id}.${newRes[index_1].pages[0].type.extension}`)
								.setFooter(`Result ${index_1 + 1} / ${newRes.length}`)
								.setURL(`https://nhentai.net/g/${newRes[index_1].id}`)
							)

						} else

						if(reaction.emoji.name === '◀️'){
							await reaction.users.remove(user.id)
							collector.resetTimer()
							index_1 = index_1 - 1
							if(index_1 < 0) index_1 = newRes.length - 1

							let languages = newRes[index_1].tags.filter(t => t.type.type === 'language')
							let anime = newRes[index_1].tags.filter(t => t.type.type === 'parody')
							let characters = newRes[index_1].tags.filter(t => t.type.type === 'character')
							let tags = newRes[index_1].tags.filter(t => t.type.type === 'tag')

							sent.edit("React with 📕 to read this book",
								new Discord.MessageEmbed()
								.setTitle(newRes[index_1].title.english)
								.setDescription(
									`**Language:** ${languages.map(l => `**\`${l.name}\`**`)}\n`+
									`**Anime:** ${anime.length === 0 ? '' : anime.map(a => a.name)}\n`+
									`**Characters:** ${characters.length === 0 ? '' : characters.map(c => `[${c.name}](${invite})`)}\n`+
									`**Tags:** ${tags.map(t => `\`${t.name.toUpperCase()}\``)}`
								)
								.setImage(`https://i.nhentai.net/galleries/${newRes[index_1].media}/${newRes[index_1].pages[0].id}.${newRes[index_1].pages[0].type.extension}`)
								.setFooter(`Result ${index_1 + 1} / ${newRes.length}`)
								.setURL(`https://nhentai.net/g/${newRes[index_1].id}`)
							)

						} else

						if(reaction.emoji.name === '📕'){
							await collector.stop()
							let convertedBook = newRes[index_1]
							sent.reactions.removeAll()

							sent.edit(convertedBook.title.english,
								new Discord.MessageEmbed()
								.setImage(`https://i.nhentai.net/galleries/${convertedBook.media}/${convertedBook.pages[0].id}.${convertedBook.pages[0].type.extension}`)
								.setFooter(`Page 1 / ${convertedBook.pages.length}`)
							).then(async sent => {
								let page = 0
								await sent.react('◀️')
								await sent.react('▶️')

								let collector = await sent.createReactionCollector(
									(reaction,user) => user.id === message.author.id,
									{ time: ms('10 minutes') }
								)

								collector.on('collect', async (reaction,user) => {
									if(reaction.emoji.name === '▶️'){
										await reaction.users.remove(user.id)
										collector.resetTimer()
										page = page + 1
										if(page > convertedBook.pages.length) page = 0

										sent.edit(convertedBook.title.english,
											new Discord.MessageEmbed()
											.setImage(`https://i.nhentai.net/galleries/${convertedBook.media}/${convertedBook.pages[page].id}.${convertedBook.pages[page].type.extension}`)
											.setFooter(`Page ${page + 1} / ${convertedBook.pages.length}`)
											.setTitle("Link To Hentai")
											.setURL(`https://nhentai.net/g/${convertedBook.id}/`)
										)

									} else

									if(reaction.emoji.name === '◀️'){
										await reaction.users.remove(user.id)
										collector.resetTimer()
										page = page - 1
										if(page < 0) page = convertedBook.pages.length - 1

										sent.edit(convertedBook.title.english,
											new Discord.MessageEmbed()
											.setImage(`https://i.nhentai.net/galleries/${convertedBook.media}/${convertedBook.pages[page].id}.${convertedBook.pages[page].type.extension}`)
											.setFooter(`Page ${page + 1} / ${convertedBook.pages.length}`)
											.setTitle("Link To Hentai")
											.setURL(`https://nhentai.net/g/${convertedBook.id}/`)
										)

									}
								})

								collector.on('end',async clt => {
									await sent.reactions.removeAll()
								})
							})
						}
					})

					collector.on('end', async clt => {
						if(clt.size === 0) return send("No response")
					})
				})
			} else {

			}
		})
		.catch(err => { if(err) {
			send("This page can't be found")
			console.log(err)
		} })
	}

	/**
	 *
	 * @param {String} msg
	 * @param {Array} attachment
	 */
	async function send(msg,attachment){
		if(!message.channel.permissionsFor(message.guild.me).has('SEND_MESSAGES')) return 'no perm'

		if(attachment && attachment !== null){
			return await message.channel.send(msg,{
				files: attachment
			})
		} else {
			return await message.channel.send(msg)
		}
	}
})

client.login(process.env.TOKEN)

const app = express()

app.get("/", ( req,res ) => { res.send("lol i got ur ip...just kidding") })
app.listen(4000, () => { console.log("keep alived") })