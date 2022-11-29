class Canvas {
    constructor(parent = document.body, width=500, height=500) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;
        parent.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");
    }
    
    refresh(colour="transparent") {
        this.ctx.fillStyle = colour;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawCircle(actor) {
        this.ctx.fillStyle = actor.colour;
        this.ctx.beginPath();
        this.ctx.arc(actor.position.x, actor.position.y, actor.radius, 0, 2*Math.PI);
        this.ctx.closePath();
        this.ctx.fill();
    }

    sync(state) {
        this.clearDisplay();
        this.drawActors(state.actors);
    }

    clearDisplay() {
        this.ctx.fillStyle = "rgba(255, 255, 255, .4)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawActors(actors) {
        actors.forEach(actor => {
            if (actor.type === "circle")
                this.drawCircle(actor);
        });
    }
}

class Ball {
    constructor(config) {
        Object.assign(this,
            {
                id: Math.floor(Math.random() * 1000000),
                type: "circle",
                position: new Vector(50, 50),
                velocity: new Vector(5, 3),
                radius: 10,
                colour: "#f00",
                collisions: [],
            },
            config
        );
    }

    update(state, time, updateId) {
        if (this.collisions.length > 10) {
            this.collisions = this.collisions.slice(this.collisions.length - 3);
        }

        const upperLimit = new Vector(
            state.display.canvas.width - this.radius,
            state.display.canvas.height - this.radius
        );

        const lowerLimit = new Vector(
            0 + this.radius,
            0 + this.radius
        );


        if (this.position.x >= upperLimit.x || this.position.x <= lowerLimit.x) {
            this.velocity = new Vector(-this.velocity.x, this.velocity.y);
        }

        if (this.position.y >= upperLimit.y || this.position.y <= lowerLimit.y) {
            this.velocity = new Vector(this.velocity.x, -this.velocity.y);
        }

        state.actors.forEach(actor => {
            if (this !== actor && !this.collisions.includes(actor.id + updateId)) {
                const distance = this.position.add(this.velocity)
                                              .substract(actor.position.add(actor.velocity))
                                              .magnitude;

                if (distance <= this.radius + actor.radius) {
                    const v1 = collisionVector(this, actor);
                    const v2 = collisionVector(actor, this);
                    this.velocity = v1;
                    actor.velocity = v2;
                    this.collisions.push(actor.id + updateId);
                    actor.collisions.push(this.id + updateId);
                }
            }
        });

        const newX = Math.max(
            Math.min(this.position.x + this.velocity.x, upperLimit.x),
            lowerLimit.x
        );

        const newY = Math.max(
            Math.min(this.position.y + this.velocity.y, upperLimit.y),
            lowerLimit.y
        );

        return new Ball({
            ...this,
            position: new Vector(newX, newY),
        });
    }

    get sphereArea() {
        return 4 * Math.PI * this.radius ** 2;
    }
}

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(vector) {
        return new Vector(
            this.x + vector.x,
            this.y + vector.y
        );
    }

    substract(vector) {
        return new Vector(
            this.x - vector.x,
            this.y - vector.y
        );
    }

    multiply(scalar) {
        return new Vector(
            this.x * scalar,
            this.y * scalar
        );
    }

    dotProduct(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    get magnitude() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    get direction() {
        return Math.atan2(this.x, this.y);
    }
}

class State {
    constructor(display, actors) {
        this.display = display;
        this.actors = actors;
    }

    update(time) {
        const updateId = Math.floor(Math.random() * 1000000);
        const actors = this.actors.map(actor => {
            return actor.update(this, time, updateId);
        });
        return new State(this.display, actors);
    }
}

/**
 * Helper function to get a certain DOM element from a query
 * @param {String} query The query to search
 * @returns {HTMLElement} The queried HTMLElement of the DOM
 */
const $ = function(query) {
    return document.querySelector(query);
}

const runAnimation = function(animation) {
    let then = null;
    const frame = now => {
        if (then !== null) {
            const deltatime = Math.min(100, now-then) / 1000;

            if (animation(deltatime) === false) {
                return;
            }
        }

        then = now;
        requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
};

const collisionVector = function(b1, b2) {
    /**
     * Two-dimensional elastic collision formula: https://en.wikipedia.org/wiki/Elastic_collision#Two-dimensional
     * 
     * v'1 = v1 - (2*m2)/(m1 + m2) * <v1 - v2, x1 - x2>/||x1 - x2||^2 * (x1 - x2)
     * v'2 = v2 - (2*m1)/(m1 + m2) * <v2 - v1, x2 - x1>/||x2 - x1||^2 * (x2 - x1)
     * 
     * v' is the resulting velocity vector
     * v is the current velocity
     * m is mass and x is the position
     * 
     * <...> brackets denote the dot product of the vector
     * and ||...|| denote the magnitude or length of the vector
     */
    return b1.velocity.substract(
                b1.position.substract(b2.position)
                           .multiply(
                                b1.velocity.substract(b2.velocity)
                                            .dotProduct(b1.position.substract(b2.position))
                                / b1.position.substract(b2.position).magnitude ** 2
                           )
                           .multiply((2*b2.sphereArea) / (b1.sphereArea + b2.sphereArea))
             );
};

const random = function(max=9, min=0) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

const collidingBalls = function({width=500, height=500, parent=document.body, count=50}) {
    const display = new Canvas(parent, width, height);
    const balls = [];
    for (let i = 0; i < count; i++) {
        balls.push(new Ball({
            radius: random(10, 3),
            colour: colours[random(colours.length - 1)],
            position: new Vector(random(width-10, 10), random(height-10, 10)),
            velocity: new Vector(random(3, -3), random(3, -3)),
        }));
    }

    let state = new State(display, balls);
    runAnimation(time => {
        state = state.update(time);
        display.sync(state);
    });
};

const colours = ["red", "green", "blue", "purple", "orange"];
collidingBalls({
    count: 40,
    width: 500,
    height: 250,
    parent: $("body"),
});