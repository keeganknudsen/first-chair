import { hashPassword, verifyPassword } from './auth/passwords.js'

const a = await hashPassword('powderday')
const b = await hashPassword('powderday')
console.log(a)
console.log(b)
console.log('same hash?', a === b)
console.log('right password:', await verifyPassword('powderday', a))
console.log('wrong password:', await verifyPassword('powderdays', a))