import { verifyToken } from '../utils/jwt.js';
import User from '../models/user.js';

export const authenticateUser = async(req,res,next) =>{
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({message: 'Unauthorized', success: false})
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        const user = await User.findById(decoded.userId);

        if(!user){
            return res.status(400).json({
                message:'User not found', success:false
            })
        }

        req.user = user;

        req.tokenData = decoded;
        next();


        
    }
    catch(error){
        return res.status(401).json({
            message:"Invalid or expired token", success:false
        })
    }

}