import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config()


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';

export const generateToken = (payload) =>{
    return jwt.sign({
        userId:payload.userId,
        email:payload.email,
        organisationId:payload.organisationId
    },
JWT_SECRET,{expiresIn:'15m'})
}

export const verifyToken = (token) => {
    try{
        return jwt.verify(token, JWT_SECRET);
    }
    catch(error){
        throw new Error('Invalid or expired token');
    }
}

export const decodeToken = (token) =>{
    return jwt.decode(token)
}