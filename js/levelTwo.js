var detectRadius = 500;
var weaponRadius = 100;
var attackRadius = 200;
var damageRadius = 200;
var slashDamage = 10;
var thrustDamage = 30;
var strikeDamage = 20;
var smashThreshold = 1;
var damageReduc = 1;
var shieldDamage = 50;
var stageCounter = 0;
var map;
var layerMain;
var layerBack;
var text;
var level2Music;

// gameState constructor
let levelTwoState = function() {
	this.score = 0;
};

levelTwoState.prototype.create = function() {
	
	level2Music = game.add.audio('level2Music');
	level2Music.play();
	
	game.physics.startSystem(Phaser.Physics.ARCADE);
	
	this.map = this.game.add.tilemap("TileMap2", 125, 125, 125, 75);
	this.map.addTilesetImage("TileSheetv2", "TileSheetv2");
	this.layerMain = this.map.createLayer("main");
	this.layerBack = this.map.createLayer("back");
	//layerMain.resizeWorld();
	this.layerBack.resizeWorld();
	this.layerBack.wrap = true;
	this.map.setCollision([7, 8, 9, 10, 12], true, this.layerMain);
	game.physics.arcade.enable(this.layerMain);
	//layerMain.wrap = true;

	this.enemies = game.add.group();
	this.enemies.enableBody = true;
	/*this.platforms = game.add.group();
	this.platforms.enableBody = true;

	let ground = this.platforms.create(0, game.world.height - 64, "platform");
	ground.scale.set(2, 2);
	ground.body.immovable = true;
	//game.physics.arcade.enable(this.ground);*/

	this.player = new Player(2000, 1500, "player", true, false);
	game.physics.arcade.enable(this.player);
	game.camera.follow(this.player, game.camera.FOLLOW_TOPDOWN);

	this.darkKnight = new Enemy(2000, 1125, "darkKnight", "dark knight", false);
	this.enemies.add(this.darkKnight);

	//add peaceful NPCs	
/*	this.peasant1 = game.add.sprite(4750, 4650, "character");
	this.peasant2 = game.add.sprite(4750, 4600, "character");
	this.knight = game.add.sprite(4625, 4675, "player");
	this.blacksmith = game.add.sprite(2250, 2375, "character");

	this.sign = game.add.sprite(4625, 4625, "player");*/

	//add five bandits that are initially peaceful but will turn hostile
/*	this.bandit1 = new Enemy(1625, 1250, "character", "bandit", false);
	this.enemies.add(this.bandit1);
	this.bandit2 = new Enemy(2125, 1250, "character", "bandit", false);
	this.enemies.add(this.bandit2);
	this.bandit3 = new Enemy(2125, 1625, "character", "bandit", false);
	this.enemies.add(this.bandit3);
	this.bandit4 = new Enemy(1625, 1625, "character", "bandit", false);
	this.enemies.add(this.bandit4);*/
/*	this.bandit5 = new Enemy(1875, 1500, "bandit", "bandit", false);
	this.enemies.add(this.bandit5);*/
	stageCounter = 0;

	this.button = game.add.button(0, 875, "buttonBackground", this.loadText, this);
	this.button.fixedToCamera = true;

	text = game.add.text(0, 875, "Don Quixote heads to the edge of the village, and begins venturing into the deadly, cursed woods. After about an hour, he wanders into a clearing and-", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
	text.setTextBounds(0, 0, 2436, 250);
	text.fixedToCamera = true;

	//this.player.body.bounce.y = 0.2;
	//this.player.body.gravity.y = 300;
	//this.player.body.collideWorldBounds = true;

	//this.player.animations.add("left", [0, 1, 2, 3], 10, true);
	//this.player.animations.add("right", [5, 6, 7, 8], 10, true);

	//this.cursors = game.input.keyboard.createCursorKeys();
	
};

levelTwoState.prototype.update = function() {
	game.physics.arcade.collide(this.enemies);
	game.physics.arcade.collide(this.enemies, this.layerMain);
	game.physics.arcade.collide(this.player, this.layerMain);

	if (this.button.alive)
		this.player.buttonPressed = true;
	else
		this.player.buttonPressed = false;

	//if clicked through beginning text and within 200px of blacksmith, display blacksmith text
	/*if (stageCounter === 7 && getDist(this.player.position, new Phaser.Point(2250, 2375)) <= 200) {
		this.loadText();
	}*/

	/*if (stageCounter === 11 && getDist(this.player.position, new Phaser.Point(1950, 2000)) <= 200) {
		this.loadText();
	}*/

	if (stageCounter === 6 && this.enemies.countLiving() === 0) {
		this.loadText();
	}
	//enemies will chase down player within certain detection radius
	this.enemies.forEachAlive(followPlayer, this, this.player);

	//if swiping over enemy, mark enemy as targeted
	this.enemies.forEachAlive(this.target, this, true);
	//if not swiping over any enemies, clear targets
	if (!this.player.pointerCross)
		this.enemies.forEachAlive(this.target, this, false);
	
	//player attack
	if (this.player.swipe && this.player.alive) {
		//determine attack move based on swipe direction
		let pi = game.math.PI2 / 2;
		let angle = game.math.normalizeAngle(this.player.swipeAngle);
		let damage = 0;
		if (angle >= 7*pi/4 || angle < pi/4) {	//swipe right
			console.log("slash right");
			damage = slashDamage;
		} else if (angle >= pi/4 && angle < 3*pi/4) {	//swipe up (angle rotated because y is down)
			console.log("strike");
			damage = strikeDamage;
		} else if (angle >= 3*pi/4 && angle < 5*pi/4) {	//swipe left
			console.log("slash left");
			damage = slashDamage;
		} else {	//swipe down (angle rotated because y is down)
			console.log("thrust");
			damage = thrustDamage;
		}
		//attack all enemies targeted by swipe
		if (this.player.pointerCross && this.player.swipeCt === 0) {
			//console.log("attackEnemy");
			this.enemies.forEachAlive(this.attackEnemy, this, damage);
			this.player.swipeCt++;
		}
	}

	if (this.player.drag && this.player.shieldCharge >= smashThreshold && this.player.alive) {
		if (this.player.pointerCross && this.player.dragCt === 0) {
			console.log("shield smash");
			this.enemies.forEachAlive(this.attackEnemy, this, shieldDamage);
			this.player.hasShield = false;
			this.player.dragCt++;
		}
	}

	//enemies within attack radius damage player
	this.enemies.forEachAlive(this.damagePlayer, this);
	
	
/*if (this.cursors.left.isDown && !this.cursors.right.isDown) {
		this.player.body.velocity.x = -150;
		this.player.animations.play("left");
	} else if (this.cursors.right.isDown && !this.cursors.left.isDown) {
		this.player.body.velocity.x = 150;
		this.player.animations.play("right");
	} else {
		this.player.animations.stop();
		this.player.frame = 4;
	}

	if (this.cursors.up.isDown && this.player.body.touching.down) {
		this.player.body.velocity.y = -350;
	}*/
};

levelTwoState.prototype.damagePlayer = function(enemy) {
	if (!this.player.alive || !enemy.evil)
		return;
	//deal damage to player if attacking and player is not shielding
	if (enemy.attack && !(this.player.hasShield && this.player.pointer.isDown))
		this.player.hp -= enemy.damage;
	console.log("Player health: " + this.player.hp);
	//kill player if health is depleted
	if (this.player.hp <= 0) {
		this.player.alive = false;
		this.player.kill();
		this.defeat = game.sprite.add("defeat");
		//game over?
	}
}

levelTwoState.prototype.attackEnemy = function(enemy, damage) {
	if (!this.player.alive)
		return;	
	//deal damage to enemy if targeted
	if (enemy.targeted)
		enemy.hp -= damage;
	console.log("Enemy health: " + enemy.hp);
	//kill enemy if health is depleted
	if (enemy.hp <= 0) {
		enemy.alive = false;
		enemy.kill();
	}
};

levelTwoState.prototype.target = function(enemy, attacking) {
	if (!this.player.alive)
		return;	
	//must be swiping within 5 pixels of enemy, and player can be no farther than 5 pixels away from enemy in order to target enemy
	if (samePoint(enemy.body.position, screenToWorld(this.player.pointer.position), weaponRadius) && samePoint(enemy.body.position, this.player.body.position, attackRadius)) {
		this.player.pointerCross = attacking;
		enemy.targeted = attacking;
	}
};

function followPlayer(enemy, player){
	if (!this.player.alive || !enemy.evil)
		return;	
	let dist = getDist(enemy.body.position, player.body.position);
	if (dist >= 0 && dist < detectRadius) {
		if (player.body.velocity.x === 0 && player.body.velocity.y === 0 && getDist(player.body.position, enemy.body.position) < 100){
			if (enemy.body.velocity.x !== 0 && enemy.body.velocity.y !== 0) {
				if (!enemy.retreating) {
					enemy.lastVeloX = enemy.body.velocity.x;
					enemy.lastVeloY = enemy.body.velocity.y;
				}
			} else if (enemy.body.velocity.x === 0 && enemy.body.velocity.y === 0 && !enemy.lunging) {
				enemy.lastX = enemy.body.x;
				enemy.lastY = enemy.body.y;
			}
			enemy.body.velocity.x = 0;
			enemy.body.velocity.y = 0;
			enemy.hostile = true;
		}
		else {
			let enemyVelocityX = (player.body.x - enemy.body.x) / getDist(enemy.body.position, player.body.position);
			let enemyVelocityY = (player.body.y - enemy.body.y) / getDist(enemy.body.position, player.body.position);
			let enemyVelocityMult = game.math.distance(0, 0, enemyVelocityX*enemyVelocityX, enemyVelocityY*enemyVelocityY);
			enemy.body.velocity.x = enemyVelocityX * (100/enemyVelocityMult);
			enemy.body.velocity.y = enemyVelocityY * (100/enemyVelocityMult);
			enemy.lunging = false;
			enemy.hostile = false;
		}
	}
	if (dist >= 0 && dist < attackRadius)
		enemy.attacking = true;
	else
		enemy.attacking = false;
};

levelTwoState.prototype.loadText = function() {
	//this.player.stationary = true;
	//this.player.buttonPressed = true;
	stageCounter++;
	//text.kill();
	text.fixedToCamera = true;
	text.setTextBounds(0, 875, 2436, 250);
	if (stageCounter === 1) {
		console.log("stage 1");
		text = game.add.text(0, 875, "Black Knight: HALT! All who pass must pay a toll in blood or coin. What will it be, peasant?", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter === 2) {
		text = game.add.text(0, 875, "Don Quixote: I’m no peasant you brigand! I am a hero, and you will be the one paying a toll in blood!", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter === 3) {
		text = game.add.text(0, 875, "5 other bandits step out from the behind the trees they were hiding in.", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle", strokeThickness: 10});
		this.bandit1 = new Enemy(1250, 1500, "bandit", "bandit", false);
		this.enemies.add(this.bandit1);
		this.bandit2 = new Enemy(2375, 1500, "bandit", "bandit", false);
		this.enemies.add(this.bandit2);
		this.bandit3 = new Enemy(2125, 875, "bandit", "bandit", false);
		this.enemies.add(this.bandit3);
		this.bandit4 = new Enemy(1375, 1125, "bandit", "bandit", false);
		this.enemies.add(this.bandit4);
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter === 4) {
		text = game.add.text(0, 875, "Black Knight: Kill him.", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter === 5) {
		text = game.add.text(0, 875, "Don Quixote: Fools, the forces of good will always triumph over evil!", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter === 6) {
		text = game.add.text(0, 875, "", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
		this.button.kill();
		this.bandit1.evil = true;
		this.bandit2.evil = true;
		this.bandit3.evil = true;
		this.bandit4.evil = true;
		this.darkKnight.evil = true;
		this.darkKnight.hp = 150;
		//this.bandit5.evil = true;
	}/* else if (stageCounter === 7) {
		text = game.add.text(0, 875, "", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
		this.button.revive();
		//return;
	}*/ else if (stageCounter === 7) {
		text = game.add.text(0, 875, "After the bandits are defeated, Juan takes off the black knights armor and puts it on. The instant he places the helmet on his head, the entire set of armor turns white.", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle", strokeThickness: 10});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
		this.button.revive();
	} else if (stageCounter === 8) {
		text = game.add.text(0, 875, "You have received A Hero’s Armor!", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter === 9) {
		text = game.add.text(0, 875, "Don Quixote: That is surely a good sign!", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
		this.player.armor = true;
	} else if (stageCounter === 10) {
		//next level
		text.kill();
		this.button.kill();
		game.state.start("LevelThree");
	}
	text.setTextBounds(0, 0, 2436, 250);
	text.fixedToCamera = true;
	//this.player.buttonPressed = false;


};

//get distance between points, returning -1 if points uninitialized
function getDist(point1, point2) {
	if (samePoint(point1, nullPoint) || samePoint(point2, nullPoint))
		return -1;
	return game.math.distance(point1.x, point1.y, point2.x, point2.y);
};

//determine if two points are within epsilon pixels of each other
function samePoint(point1, point2, epsilon) {
	return (game.math.fuzzyEqual(point1.x, point2.x, epsilon) && game.math.fuzzyEqual(point1.y, point2.y, epsilon));
};

function worldToScreen(point) {
	let newPt = new Phaser.Point(point.x - game.camera.x, point.y - game.camera.y);
  	return newPt;
};


function screenToWorld(point) {
	let newPt = new Phaser.Point(point.x + game.camera.x, point.y + game.camera.y);
  	return newPt;
};