require('dotenv').config();
const axios = require('axios');
const moment = require('moment');

let twitchOauthUrl = 'https://id.twitch.tv/oauth2/token';
let twitchApiUrl = 'https://api.twitch.tv/helix/streams';
const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;

let streamList = [];
let pageCount = 0;
let streamCount = 0;
let cursor;

let getToken = async () => {
    let paramsUrl = "?client_id=" + clientId + "&client_secret=" + clientSecret + "&grant_type=client_credentials";
    const tokenResponse = await axios.post(twitchOauthUrl + paramsUrl);
    return tokenResponse.data.access_token;
}

let getStreams = async (cursor) => {
    let accessToken = await getToken();
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
    if(streamList.length){
        console.log(streamList);
    }
}

(async () => {
    try {
        setInterval(async () => {
            let resp = await getStreams(cursor);
            cursor = resp.pagination.cursor;
            let streams = resp.data;
            streams.forEach(stream => {
                let uptime = moment().diff(moment(stream.started_at), 'hours');
                if(stream.viewer_count < 2 &&  uptime >= 1){
                    console.log("cursor", cursor, stream.user_name, stream.game_name);
                    streamList.push(stream.id + " " + stream.user_name + " " + stream.game_name + " " + stream.viewer_count + " " + uptime.format());
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