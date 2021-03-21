$(() => {
    updateFancyStringWithRandomPeriod("Welcome to canvas world!!", 1500, 40, (res) => {
        $('#title').html(res);
    });

    updateFancyStringWithRandomPeriod("These are shyunku's canvas productions.", 1500, 40, (res) => {
        $('#introduction').html(res);
    });

    $('.template').click((e) => {
        let link = $(e.target).attr('link');
        location.href = link;
    });

    const templateDiv = $('#templates');
    const printer = $('#printer');
    const vale = $('#vale');
    let templateWidth = templateDiv.width();
    let templateHeight = templateDiv.height();
    let printerWidth = printer.width();
    let printerHeight = printer.height();

    let printerX = 0, printerY = 0;
    let xStage = 10, yStage = 20;
    let direction = 1;

    let goRight = false;
    let maxWidth = 0;
    
    for(let child of templateDiv.children()){
        if($(child).hasClass('template') === false) continue;
        maxWidth = Math.max(maxWidth, $(child).width());
    }

    let thread = new Thread(() => {
        if(goRight){
            goRight = false;
            direction *= -1;
        }else{
            if((printerY + printerHeight) > templateHeight){
                printerY = templateHeight - printerHeight;
                goRight = true;
            }else if(printerY < 0){
                printerY = 0;
                goRight = true;
            }
        }

        if((printerX + printerWidth) > templateWidth || printerX > maxWidth){
            printer.css({display: 'none'});
            thread.stop();
            return;
        }

        printer.css({left: printerX, top: printerY});
        
        if(goRight){
            printerX += xStage;
            vale.css({left: printerX});
        }else{
            printerY += direction * yStage;
        }
    });

    thread.repeat(10);
});