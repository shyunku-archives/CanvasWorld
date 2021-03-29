$(() => {
    const canvas = new SuperCanvas('chart_canvas', 60);

    platform.applyDiv($('#items'));

    // publishCoin('메디렛저', 1750, boss);
    // publishCoin('제로블록캐시', 1990000, boss);
    // publishCoin('플론', 3000, boss);
    // publishCoin('부트코인', 650, boss);
    // publishCoin('라일트리코프넷', 15000, boss);
    // publishCoin('크리스피토큰', 10, boss);
    // publishCoin('레미온', 0.14, boss);
    // publishCoin('메스해시넷', 135, boss);
    // publishCoin('비트코인클래식크레디트', 90, boss);
    publishCoin('TEST', 9.99, boss);

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

        c.strokeStyle = '#999';
        c.lineWidth = 1;
        c.translate(0.5, 0.5);
        c.beginPath();
        c.moveTo(RB.x, LT.y);
        c.lineTo(RB.x, RB.y);
        c.lineTo(LT.x, RB.y);
        c.stroke();
        c.translate(-0.5, -0.5);

        let selectedCoin = platform.selectedCoin;
        if(selectedCoin !== null){
            const lineWidth = 4 * graphZoomLevel;
            const lineMarginRate = 0.3;
            let info = selectedCoin.getDisplayableInfo(graphCollectPeriod, parseInt(rectWidth / lineWidth));
            let min = Number.MAX_VALUE; // bottom
            let max = Number.MIN_VALUE; // top

            info.map(item => {
                min = Math.min(item.min, min);
                max = Math.max(item.max, max);
            });

            let lastValue = info[0].end;
            let lastValPosY = getValueCoordY(LT.y, RB.y, min, max, lastValue);

            // draw grid
            c.lineWidth = 1;
            let valueUnitStage = getPriceIntervalUnit(lastValue, min, max, parseInt(rectHeight / 50));
            for(let i=0;;i++){
                let targetValue = min + valueUnitStage * i;
                let horizontalGridBarY = getValueCoordY(LT.y, RB.y, min, max, targetValue);

                if(targetValue > max) break;

                c.strokeStyle = 'rgb(239, 239, 239)';
                c.translate(0.5, 0.5);
                c.beginPath();
                c.moveTo(parseInt(LT.x), horizontalGridBarY);
                c.lineTo(parseInt(RB.x), horizontalGridBarY);
                c.stroke();
                c.translate(-0.5, -0.5);

                c.fillStyle = '#999';
                c.fillText(formatPrice(targetValue), parseInt(RB.x) + 10, horizontalGridBarY + 5);
            }

            // draw axis label


            // draw graph
            for(let i=0; i<info.length; i++){
                let infoItem = info[i];
                let isRaised = infoItem.end > infoItem.start;

                let posX = RB.x - lineWidth * (i + 1) * (1 + lineMarginRate);
                let startPosY = getValueCoordY(LT.y, RB.y, min, max, infoItem.start);
                let endPosY = getValueCoordY(LT.y, RB.y, min, max, infoItem.end);

                let minPosY = getValueCoordY(LT.y, RB.y, min, max, infoItem.min);
                let maxPosY = getValueCoordY(LT.y, RB.y, min, max, infoItem.max);

                c.strokeStyle = 'black';
                c.translate(0.5, 0.5);
                c.beginPath();
                c.moveTo(parseInt(posX + lineWidth / 2), minPosY);
                c.lineTo(parseInt(posX + lineWidth / 2), maxPosY);
                c.stroke();
                c.translate(-0.5, -0.5);

                if(infoItem.start === infoItem.end){
                    c.translate(0.5, 0.5);
                    c.beginPath();
                    c.moveTo(parseInt(posX), parseInt(startPosY));
                    c.lineTo(parseInt(posX + lineWidth), parseInt(startPosY));
                    c.stroke();
                    c.translate(-0.5, -0.5);
                }else{
                    c.fillStyle = isRaised ? 'rgb(210, 80, 70)' : 'rgb(18, 100, 200)';
                    c.fillRect(
                        parseInt(posX),
                        startPosY,
                        parseInt(lineWidth),
                        endPosY - startPosY
                    );
                }

                // c.fillText(infoItem.min, posX, RB.y + 5);
                // c.fillText(infoItem.max, posX, LT.y + 10);
                // c.fillStyle = 'green';
                // c.fillText(infoItem.start, posX, LT.y + 30);
                // c.fillStyle = 'purple';
                // c.fillText(infoItem.end, posX, LT.y + 40);
            }

            let isRaised = lastValue > info[0].start;
            let priceText = formatPrice(lastValue);
            let textWidth = c.measureText(priceText).width;
            c.strokeStyle = c.fillStyle = isRaised ? 'rgb(210, 80, 70)' : 'rgb(18, 100, 200)';
            
            c.fillRect(RB.x + 10, lastValPosY + 5, textWidth + 10, -18);
            c.fillStyle = 'white';
            c.fillText(priceText, RB.x + 15, lastValPosY);

            c.translate(0.5, 0.5);
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(parseInt(RB.x), parseInt(lastValPosY));
            c.lineTo(parseInt(RB.x + 15), parseInt(lastValPosY));
            c.stroke();
            c.translate(-0.5, -0.5);
        }
    });
});

function publishCoin(name, value, icoClient){
    let coin = new CoinMarket(name, value, icoClient);
    platform.publishCoin(coin);
}

function getValueCoordY(lty, rby, totalMinValue, totalMaxValue, targetValue){
    let padding = 30;
    let valueDiffMax = totalMaxValue - totalMinValue;
    let posDiffMax = rby - lty - 2 * padding;

    if(valueDiffMax === 0){
        return rby - padding;
    }

    let curY = rby - (targetValue - totalMinValue) * posDiffMax / valueDiffMax - padding;
    return curY;
}