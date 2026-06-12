import multer from 'multer'

const storage = multer.memoryStorage()

function fileFilter(_req, file, cb) {
  if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
    return cb(new Error('Only JPG/PNG allowed'))
  }
  cb(null, true)
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
})
