import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    user: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        required: [true, "User is required"]
    },
    refreshTokenHash: {
        type:String,
        required:[true, "Refresh token Hash is required"]
    },
    ip:{
        type:String,
        required:[true, "IP address is required"]
    },
    userAgent:{   // browser ki ak alag string hoti hai jiski madad se hum identiy kar skte hai ki humara client konsa browser use kar raha hai, browser ka konsa version chal raha hai
        type:String,
        required:[true,"User Agent is required"]
    },
    revoked :{
        type:Boolean,
        default: false
    }
},{
    timestamps: true    // timestamp ko maintain karne ke liye like created and updated ko update karne ke liye
})

const sessionModel = mongoose.model("sessions", sessionSchema);

export default sessionModel;