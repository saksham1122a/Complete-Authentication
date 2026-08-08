import userModel from '../models/user.model.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken'
import config from '../config/config.js'

    export async function register(req,res){

        const { username, email, password} = req.body;
    
        const isUserAlreadyExist = await userModel.findOne({
            $or: [
                {username},
                {email}
            ]
        })
    
        if(isUserAlreadyExist){
            return res.status(409).json({message:"Username or email already exists"})
        }
    
        const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

        const user = await userModel.create({
            username,
            email,
            password: hashedPassword
        })

        const token = jwt.sign({
            id:user._id,
        }, config.JWT_SECRET,
        {
            expiresIn: "1d"
        })

res.status(201).json({
    message:"User registered successfully!",
    user: {
        username: user.username,
        email:user.email,
    },
     token
})

}

  export async function getMe(req,res){
     
// sabse pehle token ko header se nikalenge 
// split("")[1] ka matlab hai joh postman ke header mein hum authorization field bnake value mein pehle Barrier space token paste karenge then yeh verify karega on the basis of token


    const token = req.headers.authorization?.split(" ") [ 1 ];

    if(!token){
        res.status(401).json({
            message:"token not found"
        })
    }

    const decoded = jwt.verify(token, config.JWT_SECRET)

    const user = await userModel.findById(decoded.id)
    res.status(200).json({
        message:"User fetched successfully!",
        user: {
            username: user.username,
            email: user.email
        }
    })

  }