if (process.env.ENV != 'production') {
  require('dotenv').config()
}

const express = require('express')
const multer = require('multer')
const mongoose = require('mongoose')
const ImageDB = require('./models/image')
const { response } = require('express')
const app = express()
const port = process.env.PORT ? process.env.PORT : '3000'

// mongodb connection
mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection
db.on('error', (error) => console.log(error))
db.once('open', () => console.log('Connected to Database'))

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
const upload = multer({ storage: storage })


app.use(express.static(__dirname + '/public'))
app.use('/uploads', express.static('uploads'))

app.get('/images', async function (req, res) {
  try {
    const images = await ImageDB.find({})
    res.send(createTable(images))
  }
  catch (err) {
    res.status(500).json({ message: err.message });
  }
})

function createTable (images) {
  let response = '<a href="/">Home</a><br>'
    + '<h1>Images</h1>'

  images.forEach(image => {
    response += `<div>
      <form action="delete/${image._id}" method="get">
        ${createImageElement(image.imageInfo.path)}
        <button>delete image</button>
      </form>
    </div>`
  })

  return response
}

app.get('/delete/:id', getImage, async function (req, res) {
  try {
    await res.image.remove()
    res.redirect('/images')
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

async function getImage (req, res, next) {
  let image

  try {
    image = await ImageDB.findById(req.params.id)
    if (image == null) {
      return res.status(404).json({ message: 'Cannot find image', req: req.params })
    }
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }

  res.image = image
  next()
}

app.post('/profile-upload-single', upload.single('profile-file'), async function (req, res) {
  // req.file is the `profile-file` file
  // req.body will hold the text fields, if there were any
  const image = new ImageDB({ imageInfo: req.file })

  try {
    const newImage = await image.save()
    console.log(newImage.imageInfo)

    let response = '<a href="/">Home</a><br>'
    response += "Files uploaded successfully.<br>"
    response += createImageElement(newImage.imageInfo.path)
    return res.send(response)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

app.post('/profile-upload-multiple', upload.array('profile-files', 12), function (req, res, next) {
  // req.files is array of `profile-files` files
  // req.body will contain the text fields, if there were any
  let response = '<a href="/">Home</a><br>'
  response += "Files uploaded successfully.<br>"
  for (let i = 0; i < req.files.length; i++) {
    response += createImageElement(files[i].path)
  }

  return res.send(response)
})


function createImageElement (srcImage) {
  return `<img src="${srcImage}" /><br>`
}

app.listen(port, () => console.log(`Server running on port ${port}!`))
