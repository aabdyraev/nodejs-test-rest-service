const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

const PHONE_REGEX = /^\+\d{9,18}$/

const isInvalid = (value, dataTypes) => {
  const availableTypes = Array.from(dataTypes)

  if (!value && availableTypes.includes('required')) {
    return true
  }

  if (availableTypes.includes('positive')) {
    if (value === null || !String(value).length) {
      return false
    }

    if (!Number.isNaN(Number(value))) {
      return Number(value) <= 0
    }

    return true
  }

  if (availableTypes.includes('negative')) {
    if (value === null || !String(value).length) {
      return false
    }
  
    if (!Number.isNaN(Number(value))) {
      return Number(value) >= 0
    }

    return true
  }

  if (value && availableTypes.includes('number')) {
    return Number.isNaN(Number(value))
  }

  if (value && availableTypes.includes('email|phone')) {
    return !(EMAIL_REGEX.test(value) || PHONE_REGEX.test(value))
  }

  if (value && availableTypes.includes('email')) {
    return !EMAIL_REGEX.test(value)
  }

  if (value && availableTypes.includes('phone')) {
    return !PHONE_REGEX.test(value)
  }

  return false
}

const isInvalidContainerData = (container, dataTypes) => {
  const err = Object.keys(dataTypes).find(
    (name) => isInvalid((container[name] || null), dataTypes[name])
  )

  return err ? true : false
}

const validationMiddleware = (container) => (req, resp, next) => {
  const {post, get, params} = container

  if (params && isInvalidContainerData(req.params, params)) {
    return resp.status(400).send('Wrong request')
  }

  if (post && isInvalidContainerData(req.body, post)) {
    return resp.status(400).send('Wrong request')
  }

  if (get && isInvalidContainerData(req.query, get)) {
    return resp.status(400).send('Wrong request')
  }

  next()
}

module.exports = {
  validationMiddleware
}
