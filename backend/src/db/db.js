import mongoose, { connect } from "mongoose";
import { DB_NAME } from "../constants.js";

const connectdb = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`MONGODB connected!! DB Host ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("ERROR IN MONGODB", error);
        process.exit(1);
    }
}

export default connectdb;