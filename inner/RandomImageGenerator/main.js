$(() => {
    const canvas = new SuperCanvas('canvas', 60);
    const map = new Map(50, 50, () => new Color());

    map.test();

    let encoder = new GIFEncoder();
    encoder.setDelay(100);
    encoder.start();

    canvas.render((c, self) => {
        let padding = 30;
        let ratio = map.row / map.col;
        let rectMinSize = Math.min(self.width, self.height / ratio);
        let rectWidth = rectMinSize - 2 * padding;
        let rectHeight = rectMinSize * ratio - 2 * padding;

        let LT = {x: padding, y: padding};
        let RB = {x: LT.x + rectWidth, y: LT.y + rectHeight};

        let w = RB.x - LT.x;
        let h = RB.y - LT.y;
        let len = w / map.col;

        for(let i=0;i<map.row;i++){
            for(let j=0;j<map.col;j++){
                let coordX = len * j + LT.x;
                let coordY = len * i + LT.y;

                c.fillStyle = map.data[i][j].getRawCode();
                c.fillRect(coordX - 1, coordY - 1, len+1, len+1);
            }
        }

        map.fillByBFS();
        encoder.addFrame(c);
    });

    $('#download_btn').click(() => {
        // encoder.finish();
        // encoder.download('result.gif');
    });
});