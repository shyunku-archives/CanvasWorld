class Client{
    constructor(){
        // 과감함: 0~1
        this.boldness = Math.random();
        // 침착함: 0~1
        this.calmness = Math.random();
        // 시드: 10000 ~ 300000000
        this.seed = Math.random(299990000) + 10000;

        this.fenceThread = new Thread(() => {
            // 새로 살지 말지 판단
        });

        this.fenceThread.repeat(1000);
    }

    considerBuy(){

    }
}

class CoinMarket{
    constructor(name, icoValue){
        this.id = randSeedHexStr(currentMilliseconds());
        this.value = icoValue;
        this.name = name;
        this.priceMap = {};
        this.history = {};

        this.writeHistoryThread = new Thread(() => {
            this.history[currentMilliseconds()] = this.priceMap;
        });

        this.writeHistoryThread.repeat(1000);
    }

    buy(price, amount){
    }

    sell(price, amount){

    }

    applyDiv(){

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
    }
}