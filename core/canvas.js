class SuperCanvas{
    constructor(canvasId, FPS = 60){
        this.canvasRef = $(`#${canvasId}`);
        this.canvasObject = this.canvasRef[0];
        this.canvasWrapperRef = this.canvasRef.parent();
        this.ref = this.canvasObject.getContext('2d');

        this.ref.imageSmoothingEnabled = true;
        this.destRenderPeriod = parseInt(1000 / FPS);

        this.resize();
        window.addEventListener('resize', this.resize);

        // detect resize of wrapper
        var lastBound = null;
        new Thread(() => {
            if(lastBound === null) lastBound = {x: this.canvasWrapperRef.width(), y: this.canvasWrapperRef.height()};
            var wrapperBound = {x: this.canvasWrapperRef.width(), y: this.canvasWrapperRef.height()};
            if(wrapperBound !== lastBound){
                this.resize();
            }
            lastBound = wrapperBound;
        }).repeat(10);
    }

    resize = () => {
        let tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;

        let tempContext = tempCanvas.getContext('2d');

        tempContext.drawImage(this.ref.canvas, 0, 0);

        this.width = this.ref.canvas.width = this.canvasWrapperRef.width();
        this.height = this.ref.canvas.height = this.canvasWrapperRef.height();

        if(tempContext.canvas.width === 0 || tempContext.canvas.height === 0) return;
        this.ref.drawImage(tempContext.canvas, 0, 0);
    }

    preRender(){
        // clear all
        this.ref.clearRect(0, 0, this.width, this.height);
    }

    postRender(){

    }

    render(caller){
        setInterval(() => {
            this.preRender();
            caller(this.ref, this);
            this.postRender();
        }, this.destRenderPeriod);
    }

    setFillStyle(style){
        this.ref.fillStyle = style;
    }
}