const platform = new Platform();
const clientNum = 30;

const boss = new Client(platform, false);

$(() => {
    const canvas = new SuperCanvas('chart_canvas', 60);

    const itemsDiv = $('#items');
    const resizer = $('#resizer');
    const chartDiv = $('#chart_canvas_wrapper');
    let resizerMouseDownPos = null;
    let resizerDragging = false;
    let offset = chartDiv.height();

    const coin1 = new CoinMarket('부트코인', 650, boss);
    const coin2 = new CoinMarket('라일트리코프넷', 15000, boss);
    const coin3 = new CoinMarket('크리스피토큰', 10, boss);
    const coin4 = new CoinMarket('레미온', 0.014, boss);
    const coin5 = new CoinMarket('메스해시넷', 135, boss);

    platform.applyDiv(itemsDiv);

    platform.publishCoin(coin1);
    platform.publishCoin(coin2);
    platform.publishCoin(coin3);
    platform.publishCoin(coin4);
    platform.publishCoin(coin5);

    resizer.on('mousedown', e => {
        resizerMouseDownPos = {x: e.pageX, y: e.pageY};
        resizerDragging = true;
        offset = chartDiv.height();
    });

    $(window).on('mousemove', e => {
        if(resizerDragging === false)return;
        let curPos = {x: e.pageX, y: e.pageY};
        let diff = {x: curPos.x - resizerMouseDownPos.x, y: curPos.y - resizerMouseDownPos.y};
        let newHeight = diff.y + offset;

        if(newHeight < 50 || newHeight > 700) return;

        chartDiv.css({height: newHeight});
    });

    $(window).on('mouseup', e => {
        resizerDragging = false;
    });

    for(let i=0; i<15; i++){
        $('.market-item-wrapper.sell').prepend(`
            <div class="sell-market-item market-item" ind="${i}">
                <div class="amount-graph">
                    <div class="graph-wrapper">
                        <div class="graph"></div>
                        <div class="amount">-</div>
                    </div>
                </div>
                <div class="price-rate">
                    <div class="price">-</div>
                    <div class="rate">-</div>
                </div>
            </div>
        `);
    }

    for(let i=0; i<15; i++){
        $('.market-item-wrapper.buy').append(`
            <div class="buy-market-item market-item" ind="${i}">
                <div class="amount-graph">
                    <div class="graph-wrapper">
                        <div class="graph"></div>
                        <div class="amount">-</div>
                    </div>
                </div>
                <div class="price-rate">
                    <div class="price">-</div>
                    <div class="rate">-</div>
                </div>
            </div>
        `);
    }

    const marketOrderPanelDiv = $('#market_order_panel');
    marketOrderPanelDiv.scrollTop(marketOrderPanelDiv.prop('scrollHeight')/4);


    platform.selectFirst();

    const clients = [];
    for(let i=0;i<clientNum; i++){
        let newClient = new Client(platform);
    }


    // render
    const rightPadding = 60;
    const bottomPadding = 30;

    canvas.render((c, ref) => {
        let rectWidth = ref.width - rightPadding;
        let rectHeight = ref.height - bottomPadding;

        let LT = {x: 0, y: 0};
        let RB = {x: LT.x + rectWidth, y: LT.y + rectHeight};

        c.strokeStyle = 'black';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(RB.x, LT.y);
        c.lineTo(RB.x, RB.y);
        c.lineTo(LT.x, RB.y);
        c.stroke();
    });
});