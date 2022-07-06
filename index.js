if (process.env.ENV != 'production') {
  require('dotenv').config()
}

const express = require('express')
const multer = require('multer')
const mongoose = require('mongoose')
const ImageDB = require('./models/image')
const fs = require('fs')
const path = require('path')
const app = express()
const port = process.env.PORT ? process.env.PORT : '3000'

// mongodb connection
mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection
db.on('error', (error) => console.log(error))
db.once('open', () => console.log('Connected to Database'))

const uploadFolderPath = process.env.UPLOADS_FOLDER_PATH === undefined ? 'uploadsdev' : process.env.UPLOADS_FOLDER_PATH

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './' + uploadFolderPath)
  },
  filename: function (req, file, cb) {
    const fileName = Date.now() + file.originalname

    ensureDirectoryExistence(uploadFolderPath)

    cb(null, fileName)
  }
})
const upload = multer({ storage: storage })

app.use(express.static(__dirname + '/public'))
app.use('/' + uploadFolderPath, express.static(uploadFolderPath))

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
    await fs.unlinkSync(res.image.imageInfo.path)
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

function ensureDirectoryExistence (filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}


app.listen(port, () => console.log(`Server running on port ${port}!`))
