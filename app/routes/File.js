const fs = require('fs')
const path = require('path')
const DayJS = require('dayjs')
const Express = require('express')
const ExpressFileUpload = require('express-fileupload')
const {Op} = require('sequelize')

const checkTokenMiddleware = require('./tokenCheckMiddleware')
const {validationMiddleware} = require('../../lib/services/ValidationService')

const File = require('../../lib/models/File')

const FileMiddleware = ExpressFileUpload({
	limits: {
		files: 1,
		fileSize: 1024 * 1024 * 10
	}
})

const route = Express()
route.use(checkTokenMiddleware)

route.get('/list', validationMiddleware({
    get: {
      list_size: ['number', 'positive'], 
      page: ['number', 'positive']
    }
  }), async (req, resp) => {
  try {
    const listSize = req.query.list_size || 10
    const page = req.query.page || 1

    const files = await File.findAll({
      limit: Number(listSize),
      offset: (Number(page) -1) * Number(listSize),
      order: [['id', 'asc']]
    })

    if (!files) {
      throw new URIError('Ошибка загрузки файла')
    }

    return resp.status(200).json(files)
  } catch(err) {
    return resp.status(err instanceof URIError ? 404 : 500).send(err.message)
  }
})

route.get('/:id', validationMiddleware({
    params: {id: ['required', 'number', 'positive']}
	}), async (req, resp) => {
  try {
    const {id} = req.params

    const file = await File.findByPk(id)

    if (!file) {
      throw new URIError('Ошибка загрузки файла')
    }

    return resp.status(200).json(file.get({plain: true}))
  } catch(err) {
    return resp.status(err instanceof URIError ? 404 : 500).send(err.message)
  }
})

route.get('/download/:id', validationMiddleware({
    params: {id: ['required', 'number', 'positive']}
  }), async (req, resp) => {
  try {
    const {id} = req.params
    const file = await File.findByPk(id)

    if (!file) {
      throw new URIError('Ошибка загрузки файла')
    }
  
    fs.readFile(
      path.join(
        req.app.get('config.general').tmp_path, 
        `${file.get('id')}${file.get('ext')}`
      ),
      (err, data) => {
        if (err) {
          return resp.status(500).send('Ошибка загрузки файла')
        }
  
        return resp.status(200).set({
          'Content-Type': file.get('mimeType'),
          'Content-Length': file.get('size'),
          //'Content-Disposition': `attachment;filename="${file.get('name')}"`
        }).send(Buffer.from(data))
      }
    )
  } catch(err) {
    return resp.status(err instanceof URIError ? 404 : 500).send(err.message)
  }
})

route.post('/upload', FileMiddleware, async (req, resp) => {
  try {
    const fileOffsets = Object.keys(req.files)
    const uploadFile = req.files[fileOffsets[0]]

    if (!uploadFile.mv || !uploadFile.name) {
      throw new Error('Ошибка загрузки файла')
    }

    const tmpFileName = DayJS().unix()

    const err = await uploadFile.mv(
      path.join(
        req.app.get('config.general').tmp_path, 
        `${tmpFileName}${path.extname(uploadFile.name)}`
      )
    )

    if (err) {
      throw new Error(`Ошибка загрузки файла: ${err}`)
    }

    const file = await File.create({
      name: uploadFile.name,
      mimeType: uploadFile.mimetype,
      ext: path.extname(uploadFile.name),
      size: uploadFile.size
    })

    resp.status(200).json({id: file.get('id')})

    return fs.renameSync(
      path.join(
        req.app.get('config.general').tmp_path, 
        `${tmpFileName}${file.get('ext')}`
      ),
      path.join(
        req.app.get('config.general').tmp_path, 
        `${file.get('id')}${file.get('ext')}`
      )
    )
  } catch(err) {
    return resp.status(err instanceof URIError ? 401 : 500).send(err.message)
  }
})

route.put('/update/:id', validationMiddleware({
    params: {id: ['required', 'number', 'positive']}
  }), 
  FileMiddleware, async (req, resp) => {
  try {
    const {id} = req.params
    const fileOffsets = Object.keys(req.files)
    const uploadFile = req.files[fileOffsets[0]]

    if (!uploadFile.mv || !uploadFile.name) {
      throw new Error('Ошибка загрузки файла')
    }

    const fileExists = await File.count({
      where: {
        id: {[Op.eq]: id}
      }
    })

    if (!fileExists) {
      throw new URIError('Указанный файл не существует')
    }
  
    const err = await uploadFile.mv(
      path.join(
        req.app.get('config.general').tmp_path, 
        `${id}${path.extname(uploadFile.name)}`
      )
    )

    if (err) {
      throw new Error(`Ошибка загрузки файла: ${err}`)
    }

    const [affectedRows,] = await File.update(
      {
        name: uploadFile.name,
        mimeType: uploadFile.mimetype,
        ext: path.extname(uploadFile.name),
        size: uploadFile.size
      },
      {
        where: {
          id: {[Op.eq]: id}
        }
      }
    )

    if (err || !affectedRows) {
      throw new Error(`Ошибка загрузки файла: ${err}`)
    }
  
    return resp.status(200).json({id})
  } catch(err) {
    return resp.status(err instanceof URIError ? 401 : 500).send(err.message)
  }
})

module.exports = route