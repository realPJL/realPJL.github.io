let player;
let enemies = [];
let loots = [];
let extraction;
let score = 0;
let gameState = 'start';
let timer = 60; 
let playerImg, enemyImg, lootImg, bulletImg, extractionImg;
let shootSound;
let hurtSound;

function preload() {
    playerImg = loadImage("arc_waiter_v1.png")
    enemyImg = loadImage("arc_v1.png");
    lootImg = loadImage("lootBox.png");
    bulletImg = loadImage("bullet.png");
    extractionImg = loadImage("extraction.png");

    shootSound = loadSound("shoot.wav");
    hurtSound = loadSound("hurt.wav");
}

function setup() {
    imageMode(CENTER);
    let cnv = createCanvas(1000, 800);
    cnv.parent("game-container");
    player = new Player(width / 2, height / 2);
    
    for (let i = 0; i < 5; i++) {
        let ex, ey;
        do {
            ex = random(width);
            ey = random(height);
        } while (dist(ex, ey, player.x, player.y) < 200);
        enemies.push(new Enemy(ex, ey));
    }

    for (let i = 0; i < 10; i++) {
        loots.push(new Loot(random(width), random(height)));
    }
    extraction = new Extraction(random(width), random(height));
}

function draw() {
    background(60);
    fill(255);
    textSize(16);
    text(`Score: ${score}  Time: ${ceil(timer)}`, 20, 20);

    if (gameState === 'start') {
        fill(30, 30, 30, 230);
        rect(0, 0, width, height);
        textAlign(CENTER, CENTER);
        fill(255);
        textSize(48);
        text("ARC Waiters", width / 2, height / 2 - 80);
        textSize(24);
        text("A fan-made tribute", width / 2, height / 2 - 40);
        textSize(20);
        text("Press SPACE to Start", width / 2, height / 2 + 20);
        textSize(16);
        return;
    }

    if (gameState === 'playing') {
        timer -= 1 / 60;
        if (timer <= 0) {
            gameState = 'gameover';
        }

        player.show();
        player.move();

        for (let enemy of enemies) {
            enemy.show();
            enemy.move();
            if (player.hits(enemy) && !player.invincible) {
                player.health -= 1;
                if (hurtSound) hurtSound.play();
                player.invincible = true;
                player.invincibleTimer = 60;
                if (player.health <= 0) {
                    gameState = 'gameover';
                }
            }
        }

        for (let i = loots.length - 1; i >= 0; i--) {
            loots[i].show();
            if (player.hits(loots[i])) {
            score += 10;
            loots.splice(i, 1);
            }
        }

        extraction.show();
        if (player.hits(extraction)) {
            gameState = 'win';
        }

        if (player.invincible) {
            player.invincibleTimer--;
            if (player.invincibleTimer <= 0) {
            player.invincible = false;
            }
        }

    } else if (gameState === 'gameover') {
        textSize(32);
        textAlign(CENTER);
        text('Game Over! Press R to Restart', width / 2, height / 2);
        text(`Score: ${score}  Time: ${ceil(60 - timer)}`, width / 2, height / 2 + 40);
    } else if (gameState === 'win') {
        textSize(32);
        textAlign(CENTER);
        text("You Escaped!", width / 2, height / 2 - 40);
        text(`Score: ${score}  Time: ${ceil(60 - timer)}`, width / 2, height / 2);
        text(`Health Remaining: ${player.health}`, width / 2, height / 2 + 80);
        text("Press R to Restart", width / 2, height / 2 + 40);
    }
}

function keyPressed() {
    if (gameState === 'start' && keyCode === 32) {
        gameState = 'playing';
        return;
    }

    if (keyCode === 32) { // Spacebar to shoot
        player.shoot();
    }

    if (key === 'r' && (gameState === 'gameover' || gameState === 'win')) {
        score = 0;
        timer = 60;
        gameState = 'playing';
        player = new Player(width / 2, height / 2);
        enemies = [];
        loots = [];
        for (let i = 0; i < 5; i++) {
            let ex, ey;
            do {
                ex = random(width);
                ey = random(height);
            } while (dist(ex, ey, player.x, player.y) < 200);
            enemies.push(new Enemy(ex, ey));
        }

        for (let i = 0; i < 10; i++) {
            loots.push(new Loot(random(width), random(height)));
        }
        extraction = new Extraction(random(width), random(height));
    }

    if (keyCode === SHIFT) {
        player.sprinting = !player.sprinting;
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 50;
        this.baseSpeed = 3;
        this.sprintSpeed = 4.25;
        this.speed = this.baseSpeed;
        this.health = 3;
        this.bullets = [];
        this.sprinting = false;
        this.invincible = false;
        this.invincibleTimer = 0;
    }

    drawHealthBar() {
        const barWidth = 50;
        const barHeight = 8;
        const x = this.x - barWidth / 2;
        const y = this.y - this.size / 2 - 16;

        noStroke();
        fill(60);
        rect(x, y, barWidth, barHeight, 4);

        fill(200, 40, 40);
        let healthWidth = barWidth * (this.health / 3);
        rect(x, y, healthWidth, barHeight, 4);
    }

    show() {
        if (!this.invincible || (this.invincible && this.invincibleTimer % 10 < 5)) {
            image(playerImg, this.x, this.y, this.size, this.size);
            this.drawHealthBar();
        }
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].show();
            this.bullets[i].move();
            if (this.bullets[i].offscreen()) {
                this.bullets.splice(i, 1);
            } else {
                for (let j = enemies.length - 1; j >= 0; j--) {
                    if (this.bullets[i] && this.bullets[i].hits(enemies[j])) {
                        enemies.splice(j, 1);
                        this.bullets.splice(i, 1);
                        break;
                    }
                }
            }
        }
    }

    move() {
        this.speed = this.sprinting ? this.sprintSpeed : this.baseSpeed;
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) this.x -= this.speed;
        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) this.x += this.speed;
        if (keyIsDown(UP_ARROW) || keyIsDown(87)) this.y -= this.speed;
        if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) this.y += this.speed;
        this.x = constrain(this.x, this.size / 2, width - this.size / 2);
        this.y = constrain(this.y, this.size / 2, height - this.size / 2);
    }

    shoot() {
        if (shootSound) shootSound.play();
        this.bullets.push(new Bullet(this.x + this.size / 2, this.y));
    }

    hits(obj) {
        let d = dist(this.x, this.y, obj.x, obj.y);
        return d < this.size / 2 + obj.size / 2;
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 60;
        this.speed = 2;
    }

    show() {
        image(enemyImg, this.x, this.y, this.size, this.size);
    }

    move() {
        let angle = atan2(player.y - this.y, player.x - this.x);
        this.x += cos(angle) * this.speed;
        this.y += sin(angle) * this.speed;
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 10;
        this.size = 20;
    }

    show() {
        push();
        translate(this.x, this.y);
        rotate(radians(45));
        image(bulletImg, 0, 0, this.size, this.size);
        pop();
    }

    move() {
        this.x += this.speed;
    }

    offscreen() {
        return this.x > width;
    }

    hits(enemy) {
        let d = dist(this.x, this.y, enemy.x, enemy.y);
        return d < this.size / 2 + enemy.size / 2;
    }
}

class Loot {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 60;
    }

    show() {
        image(lootImg, this.x, this.y, this.size, this.size);
    }
}

class Extraction {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 70;
    }

    show() {
        image(extractionImg, this.x, this.y, this.size, this.size);
    }
}