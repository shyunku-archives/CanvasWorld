class Thread{
    constructor(runnable = () => {}){
        this.intervalId = null;
        this.runnable = runnable;
    }

    start(endListener = () => {}){
        this.runnable();
        endListener();
    }

    repeat(period = 0){
        if(this.intervalId !== null){
            clearInterval(this.intervalId);
        }

        this.start();
        this.intervalId = setInterval(() => {
            this.start();
        }, period);
    }

    repeatRunnable(runnable = () => {}, period = 0){
        if(this.intervalId !== null){
            clearInterval(this.intervalId);
        }

        runnable();
        this.intervalId = setInterval(() => {
            runnable();
        }, period);
    }

    stop(){
        if(this.intervalId !== null){
            clearInterval(this.intervalId);
        }
    }
}