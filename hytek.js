var fs = require('fs'),
    utils = require('./hytekutils.js');

var tags = JSON.parse(fs.readFileSync('tags.json').toString());
var includeAlias = true;

function is0D0A(buffer) {
    return buffer[131] == 0x0a;
}

function parse(file) {
    var o = new Array(),
        buf = fs.readFileSync(file),
        str = buf.toString('ascii');
    //determine if file uses 0D or 0D0A newline character, only one is interpretted by node when converted to string from buffer
    var line = 0;
    if (is0D0A(buf)) {
        line = 132;
        newline = 1;
        console.log('newline = 0d0a')
    } else {
        line = 131;
        str = str.slice(0, str.length - 1); //remove final line, because 0a is interpretted
        console.log('newline = 0d');
    }
    var lines = str.length / line;
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

exports.parseTest1 = function (file) {
    var buf = fs.readFileSync(file);
    var str = buf.toString('ascii');
    var secondLine = buf.slice(132, 132 + 130);
    var parsed = parseLine(secondLine, tags);
    console.log(parsed);

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
            console.log('invalid interval: ' + interval);
            continue;
        }
        var data = str.slice(interval[0], interval[1] + 1).trim(); //assuming inclusive interval
        o[intervalProperty] = data;
    }
    o.checksum = str.slice(str.length - 2, str.length);
    return o;
}

exports.parse = parse;