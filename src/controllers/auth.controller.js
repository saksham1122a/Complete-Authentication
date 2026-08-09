import userModel from '../models/user.model.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken'
import config from '../config/config.js'
import sessionModel from '../models/session.model.js';


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

        const refreshToken = jwt.sign({
            id:user._id,
        }, config.JWT_SECRET,{
            expiresIn: "7d"
        })

        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest('hex')

        const session = await sessionModel.create({
            user:user._id,
            refreshTokenHash,
            ip:req.ip,
            userAgent:req.headers["user-agent"]
        })

        const accessToken = jwt.sign({
            id: user._id,
            sessionId: session._id
        }, config.JWT_SECRET,
        {
            expiresIn: "15m"
        })


        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7*24*60*60*1000 // 7days
        })

res.status(201).json({
    message:"User registered successfully!",
    user: {
        username: user.username,
        email:user.email,
    },
     accessToken
})

}

/**
 * 
 * The main objective to create this get-me api is to the fetch the details of the user
 */
  export async function getMe(req,res){
     
// sabse pehle token ko header se nikalenge 
// split("")[1] ka matlab hai joh postman ke header mein hum authorization field bnake value mein pehle Bearer space token paste karenge then yeh verify karega on the basis of token


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

  export async function refreshToken(req,res){

    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken){
        return res.status(403).json({
            message:"Refresh Token not found"
        })
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET)

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")

    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked:false
    })

    if(!session){
        res.status(401).json({
            message:"Invalid refresh token"
        })
    }

    const accessToken = jwt.sign({
        id:decoded.id,
    }, config.JWT_SECRET,{
        expiresIn: "15m"
    }
)

 const newRefreshToken = jwt.sign({
        id:decoded.id,
    }, config.JWT_SECRET,{
        expiresIn: "7d"
    }
)

const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

session.refreshTokenHash = newRefreshTokenHash;
await session.save();

res.cookie(refreshToken, newRefreshToken,{
           httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7*24*60*60*1000 // 7days
} )
 
res.status(201).json({
    message:"Access Token Refreshed successfully!",
    accessToken
})

  }

  export async function logout(req,res){

    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken){
       return res.status(400).json({
            message:"Token not found"
        })
    }

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.findOneAndUpdate({
        refreshTokenHash,
        revoked: false
    })

    if(!session){
        return res.status(400).json({
            message:"Invalid refresh token"
        })
    }

    session.revoked=true;

    await session.save();

    res.clearCookie("refreshToken")

    res.status(200).json({
        message:"Logout Successfully"
    })

  }