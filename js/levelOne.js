var detectRadius = 500;
var weaponRadius = 100;
var attackRadius = 200;
var damageRadius = 200;
var slashDamage = 10;
var thrustDamage = 30;
var strikeDamage = 20;
var smashThreshold = 1;
var damageReduc = 5;
var shieldDamage = 50;
var stageCounter = 0;
var map;
var layerMain;
var layerBack;
var text;
var level1Music;

// gameState constructor
let levelOneState = function() {
	this.score = 0;
};

levelOneState.prototype.create = function() {
	
	level1Music = game.add.audio('level1Music');
	level1Music.play();
	
	game.physics.startSystem(Phaser.Physics.ARCADE);
	
	this.map = this.game.add.tilemap("TileMap1", 125, 125, 125, 75);
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

	this.player = new Player(5000, 4625, "player", false, false);
	game.physics.arcade.enable(this.player);
	game.camera.follow(this.player, game.camera.FOLLOW_TOPDOWN);


	this.sign = game.add.sprite(4625, 4625, "sign");
	//add peaceful NPCs	
	this.peasant1 = game.add.sprite(4750, 4675, "npc");
	this.peasant2 = game.add.sprite(4750, 4575, "npc");
	this.knight = game.add.sprite(4625, 4675, "knight");
	this.blacksmith = game.add.sprite(2250, 2375, "blacksmith");


	//add five bandits that are initially peaceful but will turn hostile
	this.bandit1 = new Enemy(1625, 1250, "bandit", "bandit", false);
	this.enemies.add(this.bandit1);
	this.bandit2 = new Enemy(2125, 1250, "bandit", "bandit", false);
	this.enemies.add(this.bandit2);
	this.bandit3 = new Enemy(2125, 1625, "bandit", "bandit", false);
	this.enemies.add(this.bandit3);
	this.bandit4 = new Enemy(1625, 1625, "bandit", "bandit", false);
	this.enemies.add(this.bandit4);
/*	this.bandit5 = new Enemy(1875, 1500, "bandit", "bandit", false);
	this.enemies.add(this.bandit5);*/

	this.button = game.add.button(0, 875, "buttonBackground", this.loadText, this);
	this.button.fixedToCamera = true;

	text = game.add.text(0, 875, "Peasants are gathered around a sign, talking excitedly. A royal knight stands by watching them.", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle",strokeThickness: 2});
	text.setTextBounds(0, 0, 2436, 250);
	text.fixedToCamera = true;

	//this.player.body.bounce.y = 0.2;
	//this.player.body.gravity.y = 300;
	//this.player.body.collideWorldBounds = true;

	//this.player.animations.add("left", [0, 1, 2, 3], 10, true);
	//this.player.animations.add("right", [5, 6, 7, 8], 10, true);

	//this.cursors = game.input.keyboard.createCursorKeys();
	
};

levelOneState.prototype.update = function() {
	game.physics.arcade.collide(this.enemies);
	game.physics.arcade.collide(this.enemies, this.layerMain);
	game.physics.arcade.collide(this.player, this.layerMain);

	if (this.button.alive)
		this.player.buttonPressed = true;
	else
		this.player.buttonPressed = false;

	//if clicked through beginning text and within 200px of blacksmith, display blacksmith text
	if (stageCounter === 7 && getDist(this.player.position, new Phaser.Point(2250, 2375)) <= 200) {
		this.loadText();
	}

	if (stageCounter === 13 && getDist(this.player.position, new Phaser.Point(1950, 2000)) <= 200) {
		this.loadText();
	}

	if (stageCounter === 17 && this.enemies.countLiving() === 0) {
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

levelOneState.prototype.damagePlayer = function(enemy) {
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

levelOneState.prototype.attackEnemy = function(enemy, damage) {
	if (!this.player.alive)
		return;	
	//deal damage to enemy if targeted
	if (enemy.targeted)
		enemy.hp -= damage/damageReduc;
	console.log("Enemy health: " + enemy.hp);
	//kill enemy if health is depleted
	if (enemy.hp <= 0) {
		enemy.alive = false;
		enemy.kill();
	}
};

levelOneState.prototype.target = function(enemy, attacking) {
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

levelOneState.prototype.loadText = function() {
	//this.player.stationary = true;
	//this.player.buttonPressed = true;
	stageCounter++;
	//text.kill();
	text.fixedToCamera = true;
	text.setTextBounds(0, 875, 2436, 250);
	if (stageCounter === 1) {
		text = game.add.text(0, 875, "ADVENTURERS WANTED: The evil dragon Jose has captured the sacred relic known as the Scepter of Life. \nThis scepter is so powerful it would enable everyone in the kingdom to live forever, but only if it can be recovered by a brave adventurer such as yourself.\n His Royal Majesty, Peter the Pious, has issued a royal decree that anyone who recovers the scepter will receive 1000 gold coins and the title of Royal Knight.", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter === 2) {
		text = game.add.text(0, 875, "Peasant 1: Wow can you believe that? I've always wanted to be a Royal Knight, ever since I was a young lad!", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter === 3) {
		text = game.add.text(0, 875, "Peasant 2: You're an idiot, there is no way they would let common peasants like us become Royal Knights, clearly they just want brave knights to search for it.", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter === 4) {
		text = game.add.text(0, 875, "Royal Knight: Fear not peasants, King Peter will be extremely generous to whoever recovers the scepter, regardless of their blood!*under breath: not that either of you fools have a chance*", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter === 5) {
		text = game.add.text(0, 875, "Don Quixote: This is my chance, finally I can fulfill my destiny and become the greatest hero Valencia has ever known!", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter === 6) {
		text = game.add.text(0, 875, "Royal Knight: You look like a hearty fellow, perhaps you can recover the scepter! \nYou’ll need equipment, the blacksmith’s shop is yonder. Go to the end of the road on the left and then head up until you see it!", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter === 7) {
		text = game.add.text(0, 875, "", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
		this.button.kill();
		//return;
	} else if (stageCounter === 8) {
		text = game.add.text(0, 875, "Don Quixote walks up the road to the blacksmith, but then he hears shouts and the clash of metal.", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle", strokeThickness: 2});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
		this.button.revive();
	} else if (stageCounter === 9) {
		text = game.add.text(0, 875, "Blacksmith: YOU THERE, HELP ME PLEASE! There are bandits ransacking my shop! If you stop them, i’ll give you this MAGIC shield!", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
		this.button.revive();
	} else if (stageCounter === 10) {
		text = game.add.text(0, 875, "Don Quixote: Okay no problem, do you have a sword I can borrow?", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter === 11) {
		text = game.add.text(0, 875, "Blacksmith: Here you go! *under breath: amateur*", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
		damageReduc = 1;
	} else if (stageCounter === 12) {
		text = game.add.text(0, 875, "You have received a Rusty Sword!", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle", strokeThickness: 2});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter === 13) {
		text = game.add.text(0, 875, "", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle", strokeThickness: 2});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
		this.button.kill();
		//return;
	} else if (stageCounter === 14) {
		text = game.add.text(0, 875, "Don Quixote enters the shop and sees a handful of bandits trashing the shop and searching for anything valuable.", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle", strokeThickness: 2});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
		this.button.revive();
	} else if (stageCounter === 15) {
		text = game.add.text(0, 875, "Don Quixote: You fools should never have come here, you will pay with your lives!", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter === 16) {
		text = game.add.text(0, 875, "The bandits simply laugh.", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle", strokeThickness: 2});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter === 17) {
		this.button.kill();
		this.bandit1.evil = true;
		this.bandit2.evil = true;
		this.bandit3.evil = true;
		this.bandit4.evil = true;
		//this.bandit5.evil = true;
		//return;
	} else if (stageCounter === 18) {
		text = game.add.text(0, 875, "Don Quixote: Blacksmith, your shop is safe now, though I fear quite a bit of it was destroyed in the scuffle.", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
		this.button.revive();
	} else if (stageCounter === 19) {
		text = game.add.text(0, 875, "Blacksmith (holding back tears): It’ll be okay… Here’s your shield. The cursed woods are down and to your left!", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle"});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
	} else if (stageCounter == 20) {
		text = game.add.text(0, 875, "You have received Magic Shield! (You can now cast shield bash (one cast only))", {fill: "white", boundsAlignH: "center", boundsAlignV: "middle", strokeThickness: 2});
		//this.player.tap = this.player.doubleTap = this.player.swipe = this.player.hold = this.player.drag = false;
		this.player.hasShield = true;
	} else if (stageCounter === 21) {
		console.log("next level");
		game.state.start("LevelTwo");
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