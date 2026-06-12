import jwt from 'jsonwebtoken'

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }

  return secret
}

export const signChatToken = (user) => {
  const payload = {
    sub: user._id.toString(),
    name: user.name,
    role: user.role,
  }

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '12h',
  })
}

export const verifyChatToken = (token) => {
  return jwt.verify(token, getJwtSecret())
}
