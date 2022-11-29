/**
 * Helper function to get a certain DOM element from a query
 * @param {String} query The query to search
 * @returns {HTMLElement} The queried HTMLElement of the DOM
 */
const $ = function(query) {
    return document.querySelector(query);
}

class Canvas {
    /**
     * @param {HTMLCanvasElement} canvas The HTMLElement of the canvas
     */
    constructor(canvas) {
        this.element = canvas;
        this.ctx = this.element.getContext("2d");
    }
    
    /**
     * Refreshes the canvas.
     * 
     * Default color is set to white (#fff).
     */
    refresh(colour="#fff") {
        this.ctx.fillStyle = colour;
        this.ctx.fillRect(0, 0, this.element.width, this.element.height);
    }

    /**
     * Draws a circle on the canvas.
     * @param {{x: Number, y: Number}} xy The position of the circle
     * @param {Number} r The radius of the circle
     * @param {String} fill The hex colour of the circle
     * @param {String} stroke The hex colour of the circunference
     * @param {Number} width The width of the circunference 
     * @param {{o: Number, f: Number}} a The start and end angle of the circle
     */
    drawCircle(xy, r, fill="black", stroke="black", width=1, a={o: 0, f: 2*Math.PI}) {
        this.ctx.beginPath();
        this.ctx.arc(xy.x, xy.y, r, a.o, a.f);
        if (fill) {
            this.ctx.fillStyle = fill;
            this.ctx.fill()
        }
        if (stroke) {
            if (width) {
                this.ctx.lineWidth = width;
            }
            this.ctx.strokeStyle = stroke;
            this.ctx.stroke();
        }
    }

    /**
     * Draws a rectangle on the canvas.
     * @param {{x: Number, y: Number}} xy The position of the rectangle
     * @param {{w: Number, h: Number}} wh The size of the rectangle
     * @param {String} fill The hex colour of the rectangle
     */
    drawRect(xy, wh, fill="black") {
        this.ctx.fillStyle = fill;
        this.ctx.fillRect(xy.x, xy.y, wh.w, wh.h);
    }

    /**
     * Draws a line on the canvas.
     * @param {{x: Number, y: Number}} xyo The starting position of the line
     * @param {{x: Number, y: Number}} xyf The end position of the line
     * @param {Number} width The width of the line
     * @param {String} stroke The hex colour of the line
     */
    drawLine(xyo, xyf, width=1, stroke="black") {
        this.ctx.beginPath();
        this.ctx.moveTo(xyo.x, xyo.y);
        this.ctx.lineTo(xyf.x, xyf.y);
        this.ctx.lineWidth = width;
        this.ctx.strokeStyle = stroke;
        this.ctx.stroke();
    }
}

class Game extends Canvas {
    /**
     * @param {HTMLElement} canvas The HTMLElement of the canvas
     */
    constructor(canvas) {
        super(canvas);
        this.balls = [];
        this.state = false;
    }

    /**
     * Spawns a ball on the canvas.
     * @param {{x: Number, y: Number}} xy The position of the ball
     * @param {{x: Number, y: Number}} vxy The velocity of the ball
     * @param {Number} size The size of the ball
     * @param {String} colour The hex colour of the ball
     */
    spawnBall(xy, vxy, size, colour) {
        this.balls.push(Ball.spawn(xy, vxy, size, colour));
    }

    /**
     * Spawns a ball with mostly randomized properties the canvas.
     */
     spawnRandomBall() {
        this.balls.push(Ball.spawnRandom(this));
    }

    /**
     * Renders the game on the canvas.
     */
    render() {
        this.refresh();
        this.balls.forEach(ball => {
            ball.move();
            ball.checkColls(this);
            ball.draw(this);
        });
    }

    /**
     * Resets the game properties to the default value.
     */
    reset() {
        this.balls = [];
        this.state = false;
        this.refresh();
    }

    /**
     * Updates and renders a frame of the game.
     */
    tick() {
        if (this.state) {
            this.render();
        }
        //requestAnimationFrame(() => this.tick());
    }
}

class Ball {
    /**
     * @param {{x: Number, y: Number}} xy The position of the ball
     * @param {{x: Number, y: Number}} vxy The velocity of the ball
     * @param {Number} size The size of the ball
     * @param {String} colour The hex colour of the ball
     */
    constructor(xy, vxy, size, colour) {
        this.xy = xy;
        this.lastxy = {...this.xy};
        this.vxy = vxy;
        this.size = size;
        this.colour = colour;
    }

    /**
     * @param {Canvas} canvas The canvas to draw the ball in
     */
    draw(canvas) {
        canvas.drawCircle(this.xy, this.size, this.colour, this.colour);
    }

    /**
     * Moves the ball accross the canvas.
     */
    move() {
        this.lastxy = {...this.xy};
        this.xy.x += this.vxy.x;
        this.xy.y += this.vxy.y;
    }

    /**
     * Checks if a collision has happened.
     * @param {Canvas} canvas The canvas of the ball
     */
    checkColls(canvas) {
        if (this.xy.x-this.size/2 < 0)
            this.vxy.x = Math.abs(this.vxy.x);
        else if (this.xy.x+this.size/2 > canvas.element.width)
            this.vxy.x = -Math.abs(this.vxy.x);

        if (this.xy.y-this.size/2 < 0)
            this.vxy.y = Math.abs(this.vxy.y);
        else if (this.xy.y+this.size/2 > canvas.element.height)
            this.vxy.y = -Math.abs(this.vxy.y);

        canvas.balls.forEach(ball => {
            if (ball != this) {
                if (Rect.distancePoints(this.xy, ball.xy) <= this.size+ball.size) {
                    if (Rect.horizontalAngle(this.lastxy, this.xy)*180/Math.PI <= 45)
                        this.vxy.x *= -1;
                    else
                        this.vxy.y *= -1;
                    
                    if (Rect.horizontalAngle(ball.lastxy, ball.xy)*180/Math.PI <= 45)
                        ball.vxy.x *= -1;
                    else
                        ball.vxy.y *= -1;
                }
            }
        });
    }

    /**
     * @param {{x: Number, y: Number}} xy The position of the ball
     * @param {{x: Number, y: Number}} vxy The velocity of the ball
     * @param {Number} size The size of the ball
     * @param {String} colour The hex colour of the ball
     * @returns {Ball} A newly created ball object from the parameters.
     */
    static spawn(xy, vxy, size, colour) {
        return new Ball(xy, vxy, size, colour);
    }

    /**
     * @param {Canvas} canvas The canvas of the ball
     * @returns {Ball} A newly created ball with mostly random properties.
     */
    static spawnRandom(canvas) {
        return Ball.spawn(
            {x: Math.random()*(canvas.element.width-20)+20, y: Math.random()*(canvas.element.height-20)+20},
            {x: Math.random()*(5+1)-1, y: Math.random()*(5+1)-1},
            $("#tamaño").value, `hsl(${Math.random()*359}, 50%, 50%)`
        );
    }
}

class Rect {
    /**
     * Calculates the axis distance between points.
     * @param {{x: Number, y: Number}} xyo The starting point
     * @param {{x: Number, y: Number}} xyf The end point
     * @returns {x: Number, y: Number} The x and y distances
     */
    static distanceAxis(xyo, xyf) {
        return {
            x: Math.abs(xyo.x-xyf.x),
            y: Math.abs(xyo.y-xyf.y)
        }
    }


    /**
     * Calculates the distance between points.
     * @param {{x: Number, y: Number}} xyo The starting point
     * @param {{x: Number, y: Number}} xyf The end point
     * @returns {Number} The distance between points
     */
    static distancePoints(xyo, xyf) {
        let axis = Rect.distanceAxis(xyo, xyf);
        return Math.sqrt(Math.pow(axis.x, 2) + Math.pow(axis.y, 2));
    }

    /**
     * Calculates the angle relative to the horizontal axis from two points.
     * @param {{x: Number, y: Number}} xyo The starting point
     * @param {{x: Number, y: Number}} xyf The end point
     * @returns Number The angle in radians
     */
    static horizontalAngle(xyo, xyf) {
        let axis = Rect.distanceAxis(xyo, xyf);
        return Math.atan2(axis.y, axis.x);
    }
}

let game = new Game($("#canvas"));
//requestAnimationFrame(() => game.tick());
setInterval(() => game.tick(), 10);

$("#simular").onclick = function () {
    game.state = true;
    game.fps = $("#ticks").value;
    for (let i = 0; i < $("#cantidad").value; i++) {
        game.spawnRandomBall();
    }

    if ($("#cantidad").value-1 < game.balls.length) {
        game.balls.splice(0, game.balls.length-$("#cantidad").value);
    }
    $("#estado").innerHTML = "Estado: En curso";

}

$("#toggle").onclick = function () {
    if (game.balls.length != 0) game.state = !game.state;
    $("#estado").innerHTML = "Estado: " + ((game.state) ? "En curso" : "Parado");
}

$("#frame").onclick = function () {
    game.state = false;
    game.render();
    $("#estado").innerHTML = "Estado: Parado";
}

$("#limpiar").onclick = function () {
    game.reset();
    $("#estado").innerHTML = "Estado: Parado";
}