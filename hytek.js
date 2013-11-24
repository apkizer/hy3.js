var fs = require('fs'),
    utils = require('./hytekutils.js');

var tags = JSON.parse(fs.readFileSync('tags.json').toString());
var includeAlias = true;

function newline(buffer) {
    return buffer[131] == 0x0a ? 2 : 1;
}

function parseSync(file) {
    var o = new Array(),
        buf = fs.readFileSync(file),
        str = buf.toString('ascii');
        line = 130 + newline(buf);//determine if file uses 0D or 0D0A newline character, only one is interpretted by node when converted to string from buffer
        lines = str.length / line;
    console.log('( ' + str.length + ' / ' + line + ') = ' + lines);
    for (var i = 0; i < lines; i++) {
        var start = i * line;
        var l = parseLine(str.slice(start, start + line), tags);
        o[i] = l;
        console.log(l);
        console.log('###');
    }
    console.log(o.length);
    return o;
}

function parse(file, callback){
    fs.readFile(file, function(err, buf){
        if(err)
            return callback(err, null);
        var str = buf.toString('ascii'),
            line = 130 + newline(buf),
            lines = str.length / line,
            o = new Array();
        for (var i = 0; i < lines; i++) {
            var start = i * line;
            var l = parseLine(str.slice(start, start + line), tags);
            o[i] = l;
            console.log(l);
            console.log('###');
        }
        callback(null, o);
    });
}

function parseLine(str, tags) {
    str = str.slice(0, 130);
    var id = str.slice(0, 2).toString('ascii');
    var tag = tags[id];
    if (tag == undefined)
        return new Error('Tag not found: ' + id);
    var o = {};
    o.tagId = id;
    for (var intervalProperty in tag) {
        if (!tag.hasOwnProperty(intervalProperty) || (intervalProperty.toString() == 'alias' && includeAlias == false))
            continue;
        if (intervalProperty.toString() == 'alias') {
            o[intervalProperty] = tag[intervalProperty];
            continue;
        }
        var interval = tag[intervalProperty];
        if (!interval instanceof Array || interval.length != 2) {
            return new Error('Invalid interval: ' + interval);
            continue;
        }
        var data = str.slice(interval[0], interval[1] + 1).trim(); //assuming inclusive interval
        o[intervalProperty] = data;
    }
    o.checksum = str.slice(str.length - 2, str.length);
    return o;
}

exports.parseSync = parseSync;
exports.parse = parse;