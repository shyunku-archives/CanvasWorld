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

            if(Math.random() < 0.6){
                pickedCoin.pushOrder(new Order(this, false, pickedCoin.getMinSellPrice(), Math.random() * 5));
            }else{
                let coins = this.openWallet(pickedCoin.id);
                if(coins > 5){
                    pickedCoin.pushOrder(new Order(this, true, pickedCoin.getMinSellPrice() * 1.05, Math.random() * 2));
                }
            }

            // console.log(this.wallet);
        });

        if(active){
            setTimeout(() => {
                this.fenceThread.repeat(1000);
            }, 1000 * Math.random() + 500);
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
    }
}


class CoinMarket{
    constructor(name, icoValue, owner){
        this.id = "Coin#" + randSeedHexStr(Math.random(), 15);
        this.value = icoValue;
        this.name = name;
        this.priceClientMap = {};

        // 매수-매도 1호가
        this.delayedPriceMap = {};
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

        this.pushOrder(new Order(owner, true, this.value, 1000));
    }

    orderProcess = () => {
        if(this.orderQueue.length !== 0){
            let currentOrder = this.popOrder();
            this.concatOrderPriceMap(currentOrder);
    
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

        console.log(order.client.id, order.isSell);

        // console.log("before", this.priceClientMap[price]);

        if(isSell){
            this.priceClientMap[price].sell.push(order);
        }else{
            this.priceClientMap[price].buy.push(order);
        }

        // console.log("after", this.priceClientMap[price]);

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

                console.log(buyClient.id, sellClient.id);
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
                let relativeRate = (this.value - price) / this.value;

                if(price === Number.MAX_VALUE || price === -Number.MAX_VALUE || amount === 0){
                    // no value
                }else{
                    marketItemDiv.find('.amount').html(amount);
                    marketItemDiv.find('.price').html(formatPrice(price));
                    marketItemDiv.find('.rate').html(formatRelativeRate(relativeRate));

                    maxAmount = Math.max(amount, maxAmount);
                }
            }

            for(let marketItemDoc of marketItemDivList){
                let marketItemDiv = $(marketItemDoc);
                let curAmount = marketItemDiv.find('.amount').html();
                let graphDiv = marketItemDiv.find('.graph');

                if(Number.isNaN(curAmount) === false){
                    let rate = curAmount / maxAmount;
                    graphDiv.css({width: `${rate * 100}%`});
                }
            }
        }
    }

    finalizeOrder(){
        this.value = this.getMinSellPrice();
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
        let result = null;
        let found = false;

        for(let i=0; i<priceArray.length; i++){
            let curPrice = priceArray[i];
            if(this.getAmount(curPrice) > 0){
                result = i-1-offset;
                found = true;
                break;
            }
        }

        if(!found){
            let index = offset;
            return (index < 0 && index >= priceArray.length) ? -Number.MAX_VALUE : parseFloat(priceArray[index]);
        }

        return result < 0 ? -Number.MAX_VALUE : parseFloat(result);
    }

    getMinSellPrice(offset = 0){
        let priceArray = Object.keys(this.priceClientMap);
        let result = null;
        let found = false;

        for(let i=priceArray.length-1; i>=0; i--){
            let curPrice = priceArray[i];
            if(this.getAmount(curPrice) < 0){
                result = i+1+offset;
                found = true;
                break;
            }
        }

        if(!found){
            let index = priceArray.length - 1 - offset;
            return (index < 0 && index >= priceArray.length) ? Number.MAX_VALUE : parseFloat(priceArray[index]);
        }

        return result >= priceArray.length ? Number.MAX_VALUE : parseFloat(result);
    }

    currentPrice(){
        return formatPrice(this.value);
    }

    currentRate(){
        return formatRelativeRate(0);
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