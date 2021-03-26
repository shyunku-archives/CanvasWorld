class Client{
    constructor(platform, active = true){
        this.id = "Client#" + randSeedHexStr(Math.random(), 15);
        this.platform = platform;
        this.wallet = {};

        // 과감함: 0~1
        this.boldness = Math.random();
        // 침착함: 0~1
        this.calmness = Math.random();
        // 시드: 10000 ~ 300000000
        this.seed = Math.random(299990000) + 10000;

        this.fenceThread = new Thread(() => {
            // 새로 살지 말지 판단
            let marketMap = this.platform.marketMap;
            let markets = Object.keys(marketMap);
            // let pickedCoinId = pickRandomFromArray(markets);
            let pickedCoinId = markets[0];
            let pickedCoin = marketMap[pickedCoinId];

            let minSellPrice = pickedCoin.getMinSellPrice();
            let maxBuyPrice = pickedCoin.getMaxBuyPrice();
            let buyPrice = minSellPrice || maxBuyPrice;

            if(Math.random() < 0.6){
                pickedCoin.pushOrder(new Order(this, false, buyPrice, Math.random() * 5));
            }else{
                let coins = this.openWallet(pickedCoin.id);
                if(coins > 3){
                    console.log("asdfsd");
                    pickedCoin.pushOrder(new Order(this, true, formalizeStagePrice(buyPrice, buyPrice, Math.random() < 0.6), Math.random() * 2));
                }
            }

            // console.log(this.wallet);
        });

        if(active){
            setTimeout(() => {
                this.fenceThread.repeat(5000 + Math.random(3000));
            }, 8000 * Math.random() + 1000);
        }
    }

    considerBuy(){

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
}

class Order{
    constructor(client, isSell, price, amount){
        this.client = client;
        this.isSell = isSell;
        this.price = price;
        this.amount = amount;
        this.traded = false;
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

        // 매수-매도 1호가
        this.history = {};

        this.orderQueue = [];

        this.writeHistoryThread = new Thread(() => {
            this.history[currentMilliseconds()] = this.priceMap;
        });

        this.syncDocumentThread = new Thread(() => {
            this.applyDiv();
        });

        this.writeHistoryThread.repeat(1000);
        this.syncDocumentThread.repeat(1000);
        this.orderProcess();

        this.pushOrder(new Order(owner, true, this.value, 100));
    }

    orderProcess = () => {
        if(this.orderQueue.length !== 0){
            // this.printPriceStat();
            let currentOrder = this.popOrder();
            this.concatOrderPriceMap(currentOrder);
            // console.log(currentOrder.isSell ? "Sell":"Buy", currentOrder.price.toFixed(0), currentOrder.amount.toFixed(2));
    
            this.finalizeOrder();
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
                buyClient.concatCoin(this.id, sellAmount);
            }else if(sellAmount > buyAmount){
                // buyAmount만큼 처리
                info.sell[sellIter].amount -= buyAmount;

                buyIter++;

                sellClient.concatCoin(this.id, -buyAmount);
                buyClient.concatCoin(this.id, buyAmount);
            }else{
                info.buy[buyIter].amount -= sellAmount;
                info.sell[sellIter].amount -= buyAmount;

                sellIter++;
                buyIter++;

                sellClient.concatCoin(this.id, -sellAmount);
                buyClient.concatCoin(this.id, buyAmount);
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

    finalizeOrder(){
        this.maxBuyPrice = this.getMaxBuyPrice();
        this.minSellPrice = this.getMinSellPrice();

        this.value = this.minSellPrice || this.maxBuyPrice;

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
        let priceArray = Object.keys(this.priceClientMap);

        priceArray = priceArray.filter(price => {
            if(this.minSellPrice){
                return this.minSellPrice > price && this.getAmount(price) < 0;
            }
            return this.getAmount(price) < 0;
        });

        return offset >= priceArray.length ? null : parseFloat(priceArray[priceArray.length - 1 - offset]);
    }

    getMinSellPrice(offset = 0){
        let priceArray = Object.keys(this.priceClientMap);

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
}

class Platform{
    constructor(){
        this.marketMap = {};
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
    }

    selectFirst(){
        this.selectCoin(Object.keys(this.marketMap)[0]);
    }
}