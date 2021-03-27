const platform = new Platform();
const clientNum = 450;

const boss = new Client(platform, false);

$(() => {
    const canvas = new SuperCanvas('chart_canvas', 60);

    const itemsDiv = $('#items');
    const resizer = $('#resizer');
    const chartDiv = $('#chart_canvas_wrapper');
    let resizerMouseDownPos = null;
    let resizerDragging = false;
    let offset = chartDiv.height();

    platform.applyDiv(itemsDiv);

    publishCoin('메디렛저', 1750, boss);
    publishCoin('제로블록캐시', 1990000, boss);
    publishCoin('플론', 3000, boss);
    publishCoin('부트코인', 650, boss);
    publishCoin('라일트리코프넷', 15000, boss);
    publishCoin('크리스피토큰', 10, boss);
    publishCoin('레미온', 0.14, boss);
    publishCoin('메스해시넷', 135, boss);
    publishCoin('비트코인클래식크레디트', 90, boss);

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

        let selectedCoin = platform.selectedCoin;
        if(selectedCoin !== null){
            c.fillText(selectedCoin.value, 15, 15);

            let info = selectedCoin.getDisplayableInfo(30, 200);
            let min = Number.MAX_VALUE; // bottom
            let max = Number.MIN_VALUE; // top
            const lineWidth = 4;

            info.map(item => {
                min = Math.min(item.min, min);
                max = Math.max(item.max, max);
            });

            for(let i=0; i<info.length; i++){
                let infoItem = info[i];

                let isRaised = infoItem.end > infoItem.start;

                let posX = RB.x - lineWidth * (i + 1);
                let startPosY = getValueCoordY(LT.y, RB.y, min, max, infoItem.start);
                let endPosY = getValueCoordY(LT.y, RB.y, min, max, infoItem.end);

                let minPosY = getValueCoordY(LT.y, RB.y, min, max, infoItem.min);
                let maxPosY = getValueCoordY(LT.y, RB.y, min, max, infoItem.max);

                c.strokeStyle = 'gray';
                c.beginPath();
                c.moveTo(posX + lineWidth / 2, minPosY);
                c.lineTo(posX + lineWidth / 2, maxPosY);
                c.stroke();

                if(infoItem.start === infoItem.end){
                    c.beginPath();
                    c.moveTo(posX, startPosY);
                    c.lineTo(posX + lineWidth, startPosY);
                    c.stroke();
                }else{
                    c.fillStyle = isRaised ? 'red' : 'blue';
                    c.fillRect(
                        posX,
                        startPosY,
                        lineWidth,
                        endPosY - startPosY
                    );
                }
            }

            c.fillText(max, RB.x + 10, 15);
            c.fillText(min, RB.x + 10, RB.y);
        }
    });
});

function publishCoin(name, value, icoClient){
    let coin = new CoinMarket(name, value, icoClient);
    platform.publishCoin(coin);
}

function getValueCoordY(lty, rby, totalMinValue, totalMaxValue, targetValue){
    let valueDiffMax = totalMaxValue - totalMinValue;
    let posDiffMax = rby - lty;

    let curY = rby - (targetValue - totalMinValue) * posDiffMax / valueDiffMax;
    return curY;
}