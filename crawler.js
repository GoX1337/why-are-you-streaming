require('dotenv').config();
const axios = require('axios');
const moment = require('moment');
const db = require('./db')();

const twitchOauthUrl = 'https://id.twitch.tv/oauth2/token';
const twitchApiUrl = 'https://api.twitch.tv/helix/streams';
const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;

let streamList = [];
let pageCount = 0;
let streamCount = 0;
let cursor;

let getToken = async () => {
    const paramsUrl = "?client_id=" + clientId + "&client_secret=" + clientSecret + "&grant_type=client_credentials";
    const tokenResponse = await axios.post(twitchOauthUrl + paramsUrl);
    return tokenResponse.data.access_token;
}

let getStreams = async (accessToken, cursor) => {
    const options = { headers: { 'Authorization': 'Bearer ' + accessToken, 'Client-Id': clientId }};
    let paramsUrl = "?first=100";
    if(cursor){
        paramsUrl += "&after=" + cursor;
    }
    const response = await axios.get(twitchApiUrl + paramsUrl, options);
    return response.data;
}

let printLog = () => {
    console.clear();
    console.log("Page", pageCount);
    console.log("Stream count processed", streamCount);
    console.log("Stream 0-viewer count", streamList.length);
}

(async () => {
    try {
        let accessToken = await getToken();
        console.log("Twich api token received: " + accessToken);
        console.log("Start stream searching...");

        setInterval(async () => {
            let resp = await getStreams(accessToken, cursor);
            cursor = resp.pagination.cursor;
            let streams = resp.data;
            streams.forEach(async stream => {
                let uptime = moment().diff(moment(stream.started_at), 'hours');
                if(stream.viewer_count < 2 &&  uptime >= 1){
                    console.log(stream.id + " " + stream.user_name + " " + stream.game_name + " " + stream.viewer_count + " " + uptime + "h");
                    streamList.push(stream);
                    await db.collection("streams").insertOne(stream);
                }
            });
            streamCount += streams.length;
            pageCount++;
            printLog();
        }, 2000);

    } catch (e) {
        console.error(e);
    }
})();