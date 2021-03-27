$(() => {
    const resizer = $('#resizer');
    const chartDiv = $('.upper-wrapper');
    let resizerMouseDownPos = null;
    let resizerDragging = false;
    let offset = chartDiv.height();

    resizer.on('mousedown', e => {
        resizerMouseDownPos = {x: e.pageX, y: e.pageY};
        resizerDragging = true;
        offset = chartDiv.height();
    });

    $(window).on('mouseup', e => {
        resizerDragging = false;
    });

    $(window).on('mousemove', e => {
        if(resizerDragging === false)return;
        let curPos = {x: e.pageX, y: e.pageY};
        let diff = {x: curPos.x - resizerMouseDownPos.x, y: curPos.y - resizerMouseDownPos.y};
        let newHeight = diff.y + offset;

        if(newHeight < 90 || newHeight > 700) return;

        chartDiv.css({height: newHeight});
    });

    $(window).on('keydown', e => {
        switch(e.keyCode){
            case 33: //page up
                graphZoomLevel *= 1.5;
                break;
            case 34: //page down
                graphZoomLevel /= 1.5;
                break;
        }
    });

    const graphPeriodSelector = $('#graph_period_selector');
    graphPeriodSelector.change(function() {
        graphCollectPeriod = this.value;
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
});