import dotenv from 'dotenv'
import fs from 'fs'
import SpotifyWebApi from 'spotify-web-api-node'
import fetch from 'node-fetch'
import NodeID3 from 'node-id3'

dotenv.config()

const spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
})

const download = async (url, filename) => {
  const res = await fetch(url)
  await new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(filename)
    res.body.pipe(fileStream)
    res.body.on('error', (err) => {
      reject(err)
    })
    fileStream.on('finish', function () {
      resolve()
    })
  })
}

const tag = async () => {
  const files = await fs.promises.readdir('./tracks/in')

  const res = await spotify.clientCredentialsGrant()
  spotify.setAccessToken(res.body['access_token'])
  files.forEach(async (file) => {
    const id = file.replace(/\.[^/.]+$/, '')
    const trackRes = await spotify.getTrack(id)
    const { artists, name, album } = trackRes.body
    const artistString = artists
      .map((artist) => {
        return artist.name
      })
      .join(', ')
    const fileName = `${artistString} - ${name}.mp3`
    fs.renameSync(`./tracks/in/${file}`, `./tracks/out/${fileName}`)
    await download(album.images[0].url, `./tracks/pics/${id}`)
    const tags = {
      title: name,
      artist: artistString,
      APIC: `./tracks/pics/${id}`,
    }
    NodeID3.update(tags, `./tracks/out/${fileName}`)
    fs.unlinkSync(`./tracks/pics/${id}`)
  })
}

tag()
