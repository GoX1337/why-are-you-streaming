const MongoClient = require('mongodb').MongoClient;

const url = process.env.MONGO_HOST;
const dbName = process.env.MONGO_DBNAME;
let dbo;

async function connect() {
    try{
        let db = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to mongo db.");
        dbo = db.db(dbName);
    } catch(err){
        console.error(err);
    }
}

module.exports = async () => {
    if(!dbo){
        await connect();
    }
    return dbo
}