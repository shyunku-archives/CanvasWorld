class Client{
    constructor(platform, isBoss = false){
        this.id = "Client#" + randSeedHexStr(Math.random(), 15);
        this.platform = platform;
        this.wallet = {};

        // 존버력: 0.1~0.9 (관망 주기)
        this.stayness = Math.random() * 0.8 + 0.1;
        // 과감함: 0.1~0.9 (쓰는 돈의 비율)
        this.boldness = Math.random() * 0.8 + 0.1;
        // 경솔함: 0.1~0.9
        this.frivolity = Math.random() * 0.8 + 0.1;
        // 침착함: 0.1~0.9 (위기 대처 능력)
        this.calmness = Math.random() * 0.8 + 0.1;
        // 시드: 10000 ~ 3000000 (초기 자본)
        this.seed = isBoss ? Number.MAX_SAFE_INTEGER : normalDistribution(10000, 3000000, 8);
        // 지능: 0.1~0.9 (지능)
        this.intelligence = normalDistribution(0.1, 0.9);
        // 관망 정도: 5 ~ 60
        this.lookOutRange = parseInt(normalDistribution(5, 60, 3));


        // 결정 관련
        this.decisionPeriod = Math.random() * 3000 + 100;

        // Flags
        this.evaluationMap = {};
        this.currentSeed = this.seed;

        this.fenceThread = new Thread(() => {
            let marketMap = this.platform.marketMap;
            let markets = Object.keys(marketMap);

            if(Math.random() > this.stayness){
                let maxEvaluationScoreCoin = [];
                let maxEvaluationScore = 0;
                for(let coinId of markets){
                    let coin = marketMap[coinId];
                    let trendiness = coin.getTrendDifference(this.lookOutRange);

                    // 지능이 높을 수록 오른 코인에 대해 시세가 낮아질 것이라고 예측
                    let score = 0.5 - (this.intelligence - 0.5) * Math.tanh(trendiness);
                    this.evaluateCoin(coinId, score);

                    let calculatedScore = this.getEvaluationScore(coinId);

                    if(calculatedScore > maxEvaluationScore){
                        maxEvaluationScore = calculatedScore;
                        maxEvaluationScoreCoin = [coinId];
                    }else if(calculatedScore === maxEvaluationScore){
                        maxEvaluationScoreCoin.push(coinId);
                    }
                }

                let remainSeed = this.currentSeed;
                const calmnessFactor = 20;

                // intelligence high: 낮은 가격에 매수, 높은 가격에 매도
                // intelligence low: 높은 가격에 매수, 낮은 가격에 매도
                if(maxEvaluationScore > (0.5 + this.calmness / calmnessFactor)){
                    // 매수
                    let pickedCoinId = maxEvaluationScoreCoin[parseInt(Math.random() * maxEvaluationScoreCoin.length)];
                    let pickedCoin = marketMap[pickedCoinId];
    
                    let minSellPrice = pickedCoin.minSellPrice;
                    let maxBuyPrice = pickedCoin.maxBuyPrice;
                    let sellPrice = minSellPrice || maxBuyPrice;
                    let buyPrice = maxBuyPrice || minSellPrice;

                    // 매수 가격 책정
                    let buyBias = this.frivolity / 0.5; // 경솔함이 높을수록 분포가 가격이 높은 쪽에 치우침 -> 최우선 매수가에 가까움
                    let buyPriceDecision = normalDistribution(buyPrice * 0.9, buyPrice, buyBias);
                    let finalBuyPrice = formalizeStagePrice(buyPriceDecision);
                    let finalBuyAmount = remainSeed * normalDistribution(0.05, 0.9, 5) / finalBuyPrice;
                    console.log(buyPrice);

                    this.order(pickedCoin, false, finalBuyPrice, finalBuyAmount);
                }else if(maxEvaluationScore < (0.5 - this.calmness / calmnessFactor)){
                    // 매도
                    let descendingDecCoins = markets.filter(coinId => this.wallet.hasOwnProperty(coinId)).sort((ca, cb) => {
                        return this.getEvaluationScore(cb) - this.getEvaluationScore(ca);
                    });

                    if(descendingDecCoins.length === 0){
                        // 보유 코인 없음
                    }else{
                        let selectedToSell = descendingDecCoins[0];
                        let pickedCoin = marketMap[selectedToSell];

                        let minSellPrice = pickedCoin.minSellPrice;
                        let maxBuyPrice = pickedCoin.maxBuyPrice;
                        let sellPrice = minSellPrice || maxBuyPrice;
                        let buyPrice = maxBuyPrice || minSellPrice;

                        // 매도 가격 책정
                        let sellBias = 0.5 / this.frivolity; // 경솔함이 높을수록 분포가 낮은 쪽에 치우침 -> 최우선 매수가에 가까움
                        let sellPriceDecision = normalDistribution(sellPrice * 0.95, sellPrice * 1.1, sellBias);
                        let finalSellPrice = formalizeStagePrice(sellPriceDecision);
                        let finalSellAmount = remainSeed * normalDistribution(0.05, 0.9, 5) / finalSellPrice;

                        this.order(pickedCoin, true, finalSellPrice, finalSellAmount);
                    }
                }
            }else{
                // 관망
            }
        });

        if(!isBoss){
            this.fenceThread.repeat(this.decisionPeriod);
        }
    }

    order = (coin, isSell, price, amount) => {
        let order = new Order(this, isSell, price, amount);
        coin.pushOrder(order);
    }

    tradeListener = () => {

    }

    considerBuy(){

    }

    evaluateCoin(coinId, newScore){
        let originalEvaluateScore = 0;
        if(this.evaluationMap.hasOwnProperty(coinId)){
            originalEvaluateScore = this.evaluationMap[coinId];
        }else{
            originalEvaluateScore = Math.random();
        }

        this.evaluationMap[coinId] = (newScore + originalEvaluateScore) / 2;
    }

    getEvaluationScore(coinId){
        if(!this.evaluationMap.hasOwnProperty(coinId)){
            this.evaluationMap[coinId] = 0.5;
            
        }

        return this.evaluationMap[coinId];
    }

    openWallet(coinId){
        if(this.wallet.hasOwnProperty(coinId) === false){
            return 0;
        }

        return this.wallet[coinId];
    }

    concatCoin(coinId, amount){
        if(this.wallet.hasOwnProperty(coinId) === false){
            this.wallet[coinId] = 0;
        }

        this.wallet[coinId] += amount;
        // console.log(this.id, coinId, amount);

        // 돈 정산

        if(this.wallet[coinId] === 0){
            delete this.wallet[coinId];
        }
    }

    deposit(value){
        // 입금
        this.currentSeed += value;
    }

    withdraw(value){
        // 출금
        this.currentSeed -= value;
    }
}

class Order{
    constructor(client, isSell, price, amount){
        this.client = client;
        this.isSell = isSell;
        this.price = price;
        this.amount = amount;
    }

    isValid = () => {
        if(this.price <= 0) return false;
        if(this.amount < 0) return false;
        if(formalizeStagePrice(this.price) !== this.price){
            console.error("Order price format not valid!");
            return false;
        }

        if(this.client.currentSeed < this.getTotalPrice()){
            return false;
        }

        return true;
    }

    getTotalPrice(){
        return this.price * this.amount;
    }
}


class CoinMarket{
    constructor(name, icoValue, owner){
        this.id = "Coin#" + randSeedHexStr(Math.random(), 15);
        this.value = icoValue;
        this.name = name;
        this.priceClientMap = {};

        this.maxBuyPrice = null;
        this.minSellPrice = null;

        this.lastUpdateValue = this.value;
        this.ready = false;

        // 매수-매도 1호가
        this.history = {};

        this.orderQueue = [];

        this.writeHistoryThread = new Thread(() => {
            this.history[currentSeconds()] = Object.assign({}, {
                priceMap: this.priceClientMap,
                value: this.value
            });
        });

        this.syncDocumentThread = new Thread(() => {
            this.applyDiv();
        });

        this.writeHistoryThread.repeat(1000);
        this.syncDocumentThread.repeat(1000);
        this.orderProcess();

        this.pushOrder(new Order(owner, true, this.value, 10000));
    }

    orderProcess = () => {
        if(this.orderQueue.length !== 0){
            let currentOrder = this.popOrder();
            if(currentOrder.isValid()){
                // console.log(`Order ${currentOrder.isSell ? "Sell" : "Buy"} ${currentOrder.price} ${currentOrder.amount.toFixed(2)}`)
                this.concatOrderPriceMap(currentOrder);
                this.finalizeOrder();
            }else{
                // console.error("Invalid Order!");
            }
        }

        setTimeout(() => {
            this.orderProcess();
        });
    }

    concatOrderPriceMap(order){
        let price = order.price;
        let isSell = order.isSell;

        if(this.priceClientMap.hasOwnProperty(price) === false){
            this.priceClientMap[price] = {
                buy: [],
                sell: []
            };
        }

        if(isSell){
            this.priceClientMap[price].sell.push(order);
        }else{
            this.priceClientMap[price].buy.push(order);
        }

        let info = this.priceClientMap[price];

        for(let buyIter = 0, sellIter = 0;;){
            if(buyIter >= info.buy.length || sellIter >= info.sell.length){
                // terminate concatenation
                info.buy = info.buy.slice(buyIter, info.buy.length);
                info.sell = info.sell.slice(sellIter, info.sell.length);
                break;
            }

            let buyInfo = info.buy[buyIter];
            let sellInfo = info.sell[sellIter];

            let buyAmount = buyInfo.amount;
            let sellAmount = sellInfo.amount;

            let sellClient = sellInfo.client;
            let buyClient = buyInfo.client;

            if(buyAmount > sellAmount){
                // sellAmount만큼 처리
                info.buy[buyIter].amount -= sellAmount;

                sellIter++;

                sellClient.concatCoin(this.id, -sellAmount);
                sellClient.deposit(sellAmount * price);
                buyClient.concatCoin(this.id, sellAmount);
                buyClient.withdraw(sellAmount * price);
            }else if(sellAmount > buyAmount){
                // buyAmount만큼 처리
                info.sell[sellIter].amount -= buyAmount;

                buyIter++;

                sellClient.concatCoin(this.id, -buyAmount);
                sellClient.deposit(buyAmount * price);
                buyClient.concatCoin(this.id, buyAmount);
                buyClient.withdraw(buyAmount * price);
            }else{
                info.buy[buyIter].amount -= sellAmount;
                info.sell[sellIter].amount -= buyAmount;

                sellIter++;
                buyIter++;

                sellClient.concatCoin(this.id, -sellAmount);
                sellClient.deposit(sellAmount * price);
                buyClient.concatCoin(this.id, buyAmount);
                buyClient.withdraw(sellAmount * price);
            }
        }

        if(info.buy.length === 0 && info.sell.length === 0){
            delete this.priceClientMap[price];
        }
    }

    printPriceStat = () => {
        let stat = {};
        for(let price in this.priceClientMap){
            stat[price] = this.getAmount(price).toFixed(2);
        }
        console.log(stat);
    }

    popOrder = () => {
        return this.orderQueue.shift();
    }

    pushOrder = (order) => {
        // console.log(order);
        this.orderQueue.push(order);
    }

    concatDelayedPriceMap(price, client, amount){
        let clientId = client.id;

        if(!this.delayedPriceMap.hasOwnProperty(price)){
            this.delayedPriceMap[price] = {};
        }

        if(!this.delayedPriceMap[price].hasOwnProperty(clientId)){
            this.delayedPriceMap[price][clientId] = 0;
        }

        this.delayedPriceMap[price][clientId] += amount;

        if(this.delayedPriceMap[price][clientId] === 0){
            delete this.delayedPriceMap[price][clientId];
        }

        if(Object.keys(this.delayedPriceMap[price]).length === 0){
            delete this.delayedPriceMap[price];
        }
    }

    applyDiv(){
        const marketItemDivList = $(`div[coin_id="${this.id}"]`);
        if(marketItemDivList.length > 0){
            let maxAmount = 0;

            for(let marketItemDoc of marketItemDivList){
                let marketItemDiv = $(marketItemDoc);
                let isSell = marketItemDiv.hasClass('sell-market-item');
                let index = parseInt(marketItemDiv.attr('ind'));

                let price = isSell ? this.getMinSellPrice(index) : this.getMaxBuyPrice(index);
                let amount = this.getAmount(price);
                let relativeRate = (price - this.lastUpdateValue) / this.lastUpdateValue;

                // console.log(isSell, index, price, amount, relativeRate);

                if(price === null || amount === 0){
                    // no value
                    marketItemDiv.find('.amount').html("-");
                    marketItemDiv.find('.price').html("-");
                    marketItemDiv.find('.rate').html("-");
                }else{
                    if(isSell && amount > 0){
                        marketItemDiv.find('.amount').html(amount.toFixed(3));
                    }else if(!isSell && amount < 0){
                        marketItemDiv.find('.amount').html(-amount.toFixed(3));
                    }

                    marketItemDiv.find('.price').html(formatPrice(price));

                    if(this.value !== null){
                        marketItemDiv.find('.rate').html(formatRelativeRate(relativeRate));
                    }

                    maxAmount = Math.max((isSell ? 1 : -1) * amount, maxAmount);
                }
            }

            for(let marketItemDoc of marketItemDivList){
                let marketItemDiv = $(marketItemDoc);
                let curAmount = marketItemDiv.find('.amount').html();
                let graphDiv = marketItemDiv.find('.graph');

                curAmount = parseFloat(curAmount);

                if(Number.isNaN(curAmount) === false){
                    let rate = curAmount / maxAmount;
                    graphDiv.css({width: `${rate * 100}%`});
                }else{
                    graphDiv.css({width: `${0}%`});
                }
            }
        }

        const itemWrapperDiv = $(`.item-wrapper[coinId="${this.id}"]`);
        itemWrapperDiv.find('.item-curr-value').html(this.currentPrice());
        itemWrapperDiv.find('.item-curr-rate').html(this.currentRate());
    }

    finalizeOrder = () => {
        this.maxBuyPrice = this.getMaxBuyPrice();
        this.minSellPrice = this.getMinSellPrice();

        this.value = this.minSellPrice || this.maxBuyPrice;
        if(this.value !== null) this.ready = true;

        // console.log(this.maxBuyPrice, this.minSellPrice);

        this.applyDiv();
    }

    getAmount(price){
        if(this.priceClientMap.hasOwnProperty(price)){
            let info = this.priceClientMap[price];
            let buyAmount = info.buy.reduce((acc, cur) => {
                return acc + cur.amount;
            }, 0);
            let sellAmount = info.sell.reduce((acc, cur) => {
                return acc + cur.amount;
            }, 0);

            return sellAmount - buyAmount;
        }

        return 0;
    }

    getMaxBuyPrice(offset = 0){
        let priceArray = Object.keys(this.priceClientMap).sort((a, b) => (parseFloat(a) - parseFloat(b)));

        priceArray = priceArray.filter(price => {
            if(this.minSellPrice){
                return this.minSellPrice > price && this.getAmount(price) < 0;
            }
            return this.getAmount(price) < 0;
        });

        return offset >= priceArray.length ? null : parseFloat(priceArray[priceArray.length - 1 - offset]);
    }

    getMinSellPrice(offset = 0){
        let priceArray = Object.keys(this.priceClientMap).sort((a, b) => (parseFloat(a) - parseFloat(b)));

        priceArray = priceArray.filter(price => {
            if(this.maxBuyPrice){
                return this.maxBuyPrice < price && this.getAmount(price) > 0;
            }
            return this.getAmount(price) > 0;
        });
        return offset >= priceArray.length ? null : parseFloat(priceArray[offset]);
    }

    currentPrice(){
        return this.value ? formatPrice(this.value) : "-";
    }

    currentRate(){
        return formatRelativeRate((this.value - this.lastUpdateValue) / this.lastUpdateValue);
    }

    registerChangeListener(listener){
        this.listener = listener;
    }

    getTrendDifference = (stage = 30) => {
        let historyTimelineKey = Object.keys(history).sort((a, b) => (b - a));
        let recentValue = this.value;

        if(historyTimelineKey.length === 0) return 0;
        let oldValue = historyTimelineKey[historyTimelineKey.length <= stage ? historyTimelineKey.length - 1 : stage];

        return (recentValue - oldValue) / oldValue;
    }

    getDisplayableInfo(unitSeconds, maxInfoNum = 200){
        let history = this.history;

        let historyTimelineKey = Object.keys(history).sort((a, b) => (b - a));
        let info = [];
        let count = 0;
        let buffer = null;

        for(let timeKey of historyTimelineKey){
            let data = history[timeKey];
            let curValue = data.value;
            let timestamp = parseInt(timeKey);

            // sequence: last -> fist

            if(buffer === null){
                // last segment
                let target = info.length > 0 ? info[info.length - 1].start : curValue;

                buffer = {
                    start: target,
                    end: target,
                    max: target,
                    min: target,
                    time: formalizeByQuotient(timestamp, unitSeconds)
                }
            }else if(formalizeByQuotient(timestamp, unitSeconds) === timestamp){
                // first segment
                buffer.start = curValue;
                buffer.time = timestamp;
                buffer.max = Math.max(buffer.max, curValue);
                buffer.min = Math.min(buffer.min, curValue);
                
                info.push(buffer);

                count++;
                buffer = null;

                if(maxInfoNum < count) break;
            }else{
                // middle segment
                buffer.start = curValue;
                buffer.max = Math.max(buffer.max, curValue);
                buffer.min = Math.min(buffer.min, curValue);
            }
        }

        if(buffer !== null){
            info.push(buffer);
        }

        return info;
    }
}

class Platform{
    constructor(){
        this.marketMap = {};
        this.selectedCoin = null;
    }

    applyDiv(div){
        this.root = div;
    }

    refresh(){
        console.log("refresh");
    }

    publishCoin(coin){
        this.marketMap[coin.id] = coin;
        coin.registerChangeListener(this.refresh);

        this.root.append(`
            <div class="item-wrapper" coinID="${coin.id}">
                <div class="item-name">${coin.name}</div>
                <div class="item-detail">
                    <div class="value-wrapper">
                        <div class="item-curr-value">${coin.currentPrice()}</div>
                        <div class="krw-label">KRW</div>
                    </div>
                    <div class="item-curr-rate">${coin.currentRate()}</div>
                </div>
            </div>
        `);

        $(`.item-wrapper[coinId="${coin.id}"]`).click(e => {
            this.selectCoin(coin.id);
        });
    }

    selectCoin(coinId){
        $('.item-wrapper').removeClass('selected');
        $(`.item-wrapper[coinId="${coinId}"]`).addClass('selected');
        $('.market-item').attr('coin_id', coinId);

        let coin = this.marketMap[coinId];
        coin.applyDiv();

        this.selectedCoin = coin;
    }

    selectFirst(){
        this.selectCoin(Object.keys(this.marketMap)[0]);
    }
}