class Map{
    constructor(row, column, initValueCaller){
        this.row = row;
        this.col = column;
        this.data = [];
        this.initValueCaller = initValueCaller;
        this.init();
    }

    init(){
        for(let i = 0; i < this.row; i++){
            let array = [];
            for(let j = 0; j < this.col; j++){
                array.push(this.initValueCaller());
            }

            this.data.push(array);
        }
    }

    empty(){
        for(let i = 0; i < this.row; i++){
            for(let j = 0; j < this.col; j++){
                this.data[i][j] = new Color(0, 0, 0);
            }
        }
    }

    fill(i, j, c){
        if(this.isValidCoord(i, j) === false) return;

        let current = this.data[i][j];
        if(current.flag === true) return;

        this.data[i][j] = c;
        this.data[i][j].setFlag(true);
    }

    isValidCoord(i, j){
        if(i < 0 || i > this.row - 1) return false;
        if(j < 0 || j > this.col - 1) return false;
        return true;
    }

    test(){
        this.empty();

        for(let i = 0; i < this.row; i++){
            for(let j = 0; j < this.col; j++){
                this.data[i][j].setFlag(false);
            }
        }

        for(let i=0; i< 1; i++){
            let x = randomInt(this.row);
            let y = randomInt(this.col);
            this.fill(x, y, new Color());
        }
        // this.fill(parseInt(this.row/2), 0, new Color());

        this.replica = [];
        for(let i = 0; i < this.row; i++){
            let array = [];
            for(let j = 0; j < this.col; j++){
                array.push([]);
            }

            this.replica.push(array);
        }
    }

    fillByBFS(stage = 20){
        const direction = [[-1, 0], [1, 0], [0, 1], [0, -1]];

        while(true){
            let terminated = true;
            for(let i = 0; i < this.row; i++){
                for(let j = 0; j < this.col; j++){
                    if(this.data[i][j].flag === false) {
                        terminated = false;
                        break;
                    }
                }
            }

            if(terminated) {
                console.log("done");
                break;
            }

            for(let i = 0; i < this.row; i++){
                for(let j = 0; j < this.col; j++){
                    let current = this.data[i][j];
                    if(current.flag === true){
                        for(let dir of direction){
                            // if(Math.random() < 0.9)continue;
                            let cx = i + dir[0];
                            let cy = j + dir[1];

                            if(this.isValidCoord(cx, cy)){
                                this.replica[cx][cy].push(current.rand(stage));
                            }
                        }
                    }
                }
            }

            for(let i = 0; i < this.row; i++){
                for(let j = 0; j < this.col; j++){
                    let repcur = this.replica[i][j];
                    if(repcur.length > 0){
                        let c = new Color(0, 0, 0);
                        for(let repc of repcur){
                            c.add(repc);
                        }
                        c.divide(repcur.length);

                        this.fill(i, j, c);
                    }
                }
            }
            break;
        }
    }
}

class Color{
    constructor(r = undefined, g, b){
        this.flag = false;

        if(r === undefined){
            this.r = randomInt(255);
            this.g = randomInt(255);
            this.b = randomInt(255);
        }else{
            this.r = r;
            this.g = g;
            this.b = b;
        }
    }

    setFlag(flag){
        this.flag = flag;
    }

    add(o){
        this.r += o.r;
        this.g += o.g;
        this.b += o.b;
    }

    divide(num){
        this.r /= num;
        this.g /= num;
        this.b /= num;
    }

    valueOf(){
        return this.r * 0x10000 + this.g * 0x100 + this.b;
    }

    rand(stage = 5){
        let gen = new Color(
            this.r + stage / 2 - stage * Math.random(), 
            this.g + stage / 2 - stage * Math.random(),
            this.b + stage / 2 - stage * Math.random(),
        );
        gen.flatten();

        return gen;
    }

    flatten(){
        if(this.r < 0) this.r = 0;
        if(this.g < 0) this.g = 0;
        if(this.b < 0) this.b = 0;

        if(this.r > 255) this.r = 255;
        if(this.g > 255) this.g = 255;
        if(this.b > 255) this.b = 255;
    }

    getRawCode(){
        return `rgb(${this.r}, ${this.g}, ${this.b})`;
    }
}