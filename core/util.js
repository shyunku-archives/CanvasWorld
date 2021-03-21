function getRandomCharacter(enableSymbols = false, enableNumbers = false, capitalizeLevel = 2){
    let numbers = "0123456789";
    let symbols = "!@#$%^&*()~`{}:\"<>?\\|";
    let capital = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let pure = "abcdefghijklmnopqrstuvwxyz";

    let target = "";
    switch(capitalizeLevel){
        case 0: target = pure; break;
        case 1: target = capital; break;
        default: 
            target = pure + capital;
            break;
    }

    if(enableNumbers) target += numbers;
    if(enableSymbols) target += symbols;

    return target[parseInt(Math.random() * (target.length - 1))]
}

function currentMilliseconds(){
    return new Date().getTime();
}

function updateFancyStringFromLeft(str, duration, renderPeriod, updateCallback){
    if(typeof str !== 'string') return "%ERROR%";

    let normalCharCounter = 0;
    let updateTime = currentMilliseconds();

    let thread = new Thread(() => {
        let normalStr = str.substr(0, normalCharCounter);
        let subseq = "";

        for(let i=0;i<str.length - normalCharCounter;i++)subseq += getRandomCharacter(false, false, 2);

        let final = normalStr + subseq;
        updateCallback(final);

        if(normalCharCounter >= str.length){
            thread.stop();
            return;
        }

        while(currentMilliseconds() - updateTime > (duration/str.length)){
            updateTime = currentMilliseconds();
            normalCharCounter++;
        }
    });

    thread.repeat(renderPeriod);
}

function updateFancyStringWithRandomPeriod(str, duration, renderPeriod, updateCallback){
    if(typeof str !== 'string') return "%ERROR%";

    let updateTime = currentMilliseconds();

    let buffer = Array(str.length).fill(false);
    let cbuffer = [];

    for(let i=0;i<str.length;i++){
        cbuffer.push(i);
    }

    let thread = new Thread(() => {
        let subseq = "";

        for(let i=0;i<str.length;i++){
            subseq += buffer[i] ? str[i] : getRandomCharacter(false, false, 2);
        }

        updateCallback(subseq);

        if(cbuffer.length === 0){
            thread.stop();
            return;
        }

        while(currentMilliseconds() - updateTime > (duration/str.length)){
            updateTime = currentMilliseconds();
            let randIdx = cbuffer[parseInt(Math.random() * cbuffer.length)];
            cbuffer = cbuffer.filter(item => item !== randIdx);
            buffer[randIdx] = true;
        }
    });

    thread.repeat(renderPeriod);
}

function repeat(func = () => {}, period = 0){
    func();
    return setInterval(func, period);
}

function randomInt(max){
    return parseInt(Math.random() * max);
}

function randSeedHexStr(str, len) {
    const chars = "ABCDEF0123456789";
    let res = "";
    for (let i = 0; i < len; i++) {
        res += chars.charAt(Math.floor(randSeedFloat(str + i) * chars.length));
    }
    return res;
}

function ellipsisString(str, len){
    if(str.length <= len){
        return str;
    }

    return str.substring(0, len - 1) + "...";
}

function randSeedFloat(str) {
    let seed = xmur3(str);
    let rand = mulberry32(seed());
    return rand();
}

function xmur3(str) {
    for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
        h = h << 13 | h >>> 19;
    return function() {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

function mulberry32(a) {
    return function() {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}