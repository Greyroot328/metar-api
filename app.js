const express = require('express');
const axios = require('axios');
const { response } = require('express');
const redis = require('redis');

const app = express();
const port = 9000;
const redis_port = 6379;

const client = redis.createClient(redis_port);


app.get('/metar/info',function(req,res){

    const scode = req.query.scode;
    const noCache = req.query.nocache;

    if(noCache != 1){
        client.get(scode, (err, result) => {
            if(result){
                let svData = JSON.parse(result);
                console.log('Cache Data Served')
                res.send(svData)
            }
        })
    }
    var url = `https://tgftp.nws.noaa.gov/data/observations/metar/stations/${scode}.TXT`;
    
    axios.get(url)
        .then(function (response) {
            let report = response.data;
            //Date Time Start
            let dtRx = report.match(/(\d{4})\/(\d{2})\/(\d{2})/)
            let tmRx = report.match(/(\d{2}):(\d{2})/)
            let time = dtRx[0] + " at " + tmRx[0] + " GMT"
            // Date Time End
           
            // Temp Start
            let tmpRx = report.match(/[^(\d{4})\/(\d{2})\/(\d{2})](M)?(\d{2})\/(M)?(\d{2})/)
                if (tmpRx[1] == 'M'){
                    var degC = -1 * tmpRx[2]
                }else{
                    var degC = tmpRx[2]
                }
                var degF = degC * 9/5 + 32
            let temp = `${degC} C` + ` (${degF} F)`
            //End Temp

            // Wind Start
            let velRx = report.match(/(\d\d\d)(\d\d)(G(\d\d))?((KT)|(KMH)|(MPS))/)
            let velKt = velRx[2]
            let velMph = velKt * 1.15
            let degDir = velRx[1]
            if (degDir > 348.75 || degDir < 11.25){
                var dir = 'N'
            }else if (degDir > 11.25 && degDir < 33.75){
                var dir = 'NNE'
            } else if (degDir > 33.75 && degDir < 56.25){
                var dir = 'NE'
            } else if (degDir > 56.25 && degDir < 78.75){
                var dir = 'ENE'
            } else if (degDir > 78.75 && degDir < 101.25){
                var dir = 'E'
            } else if (degDir > 101.25 && degDir < 123.75){
                var dir = 'ESE'
            } else if (degDir > 123.75 && degDir < 146.25){
                var dir = 'SE'
            } else if (degDir > 146.25 && degDir < 168.75){
                var dir = 'SSE'
            } else if (degDir > 168.75 && degDir < 191.25){
                var dir = 'S'
            } else if (degDir > 191.25 && degDir < 213.75){
                var dir = 'SSW'
            } else if (degDir > 213.75 && degDir < 236.25){
                var dir = 'SW'
            } else if (degDir > 236.25 && degDir < 258.75){
                var dir = 'WSW'
            } else if (degDir > 258.75 && degDir < 281.25){
                var dir = 'W'
            } else if (degDir > 281.25 && degDir < 303.75){
                var dir = 'WNW'
            } else if (degDir > 303.75 && degDir < 326.25){
                var dir = 'NW'
            } else if (degDir > 326.25 && degDir < 348.75){
                var dir = 'NNW'
            } 
            let wind = `${dir} at ${velMph} mph (${velKt} knots)`
            // Wind Wnd
            let prData ={
                'data':{
                    'station': scode,
                    'last_observation': time,
                    'temperature': temp,
                    'wind': wind
                }
            }
            if(noCache == '1'){
            const saveCache = client.set(scode,JSON.stringify(prData),'EX',300)
            console.log('Cache Saved ' + saveCache)
            res.send(prData)
            }
        })
        .catch(console.error)

})


app.get('/metar/ping', function(req, res){
    let data = {
        "data": "pong"
    }
    res.send(data);
});

app.listen(port, function (req, res){
    console.log('Server started at port: ' + port);
});