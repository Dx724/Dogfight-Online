function draw_getPlayerColor(playerNumber) {
	switch (playerNumber) {
		case 1:
			return "#ee0000";
		case 2:
			return "#ee8400";
		case 3:
			return "#ecee00";
		case 4:
			return "#38ee00";
		case 5:
			return "#00b8ee";
		case 6:
			return "#5000ee";
		case 7:
			return "#ffa0a0";
		case 8:
			return "#ffd0a0";
		case 9:
			return "#feffa0";
		case 10:
			return "#a0ffbe";
		case 11:
			return "#a0e5ff";
		case 12:
			return "#b6a0ff";
		default:
			snake_warn("Player Number: " + playerNumber);
			return "white";
	}
}

function snake_findSuitableLocation(snakes, foodPellets) {
	function isNearby(x, y, space2) {
		if ([x, y] == space2 ||
			[x - 1, y] == space2 ||
			[x + 1, y] == space2 ||
			[x, y - 1] == space2 ||
			[x, y + 1] == space2 ||
			[x - 1, y - 1] == space2 ||
			[x + 1, y - 1] == space2 ||
			[x - 1, y + 1] == space2 ||
			[x + 1, y + 1] == space2) {
			
			return true;
			
		}
		else {
			return false;
		}
	}

	var locationFound = false;
	var x, y;
	do {
		x = Math.floor(Math.random() * 32);
		y = Math.floor(Math.random() * 32);
		locationFound = true;
		for (snake of snakes) {
			for (segment of snake.segments) {
				if (isNearby(x, y, segment)) {
					locationFound = false;
					break;
				}
			}
			if (locationFound == false) {
				break;
			}
		}
		if (locationFound == true) { //Only check for nearby food if there are no nearby snake segments found already.
			for (pellet of foodPellets) {
				if (isNearby(x, y, pellet)) {
					locationFound = false;
					break;
				}
			}
		}
	} while (locationFound != true);
	return [x, y];
}

function snake_getTileBasedOnDirection(x, y, direction) {
	if (direction == "north") {
		return [x, y - 1];
	}
	else if (direction == "south") {
		return [x, y + 1];
	}
	else if (direction == "east") {
		return [x + 1, y];
	}
	else if (direction == "west") {
		return [x - 1, y];
	}
	else {
		snake_warn("Direction: " + direction);
	}
}

function snake_getRelativeDirection(direction, relativeDirection) {
	directions = ["north", "east", "south", "west"]; //Clockwise
	if (relativeDirection == "right") {
		if (direction == "west") {
			return "north";
		}
		else {
			return directions[directions.indexOf(direction) + 1];
		}
	}
	else if (relativeDirection == "left") {
		if (direction == "north") {
			return "west";
		}
		else {
			return directions[directions.indexOf(direction) - 1];
		}
	}
}

function snake_warn(message) {
	console.log("[GAME_SNAKE] " + message);
}

function pong_warn(message) {
	console.log("[GAME_PONG] " + message);
}

function draw_getFilledCanvas(color) { //This returns a 32x32 canvas.
	var canvas = [];
	for (var y = 0; y < 32; y++) {
		canvas.push([]);
		for (var x = 0; x < 32; x++) {
			canvas[y].push(color);
		}
	}
	return canvas;
}

exports.snake = () => ({ //TODO: Food eating
	snakes: [],
	foodPellets: [],
	FOOD_SPAWNS_PER_PLAYER: 3,
	accumulator: 0,
	MILLISECONDS_BETWEEN_MOVEMENTS: 750, //~4 movements every 3 seconds
	colors: {
		foodPellet: "#fff7a8"
	},
	tick: function(delta) {
		this.accumulator += delta;
		if (this.accumulator > this.MILLISECONDS_BETWEEN_MOVEMENTS) {
			this.accumulator = 0;
			for (var snake of this.snakes) {
				if (!snake.alive) {
					continue;
				}
				if (snake.pendingSegments == 0) {
					snake.segments.pop(); //Remove the last segment
				}
				else {
					snake.pendingSegments -= 1;
				}
				snake.segments.unshift(snake_getTileBasedOnDirection(...snake.segments[0], snake.direction));
				switch (this.checkCollisions(snake)) { //This technically puts players with lower player numbers at a slight disadvantage for this game, as they will collide first with other snakes in this game.
					case "wall":
					case "snake":
						snake.alive = false;
						break;
					case "food":
						snake.pendingSegments += 1;
						for (foodPellet of this.foodPellets) {
							if (foodPellet[0] == snake.segments[0][0] && foodPellet[1] == snake.segments[0][1]) {
								this.foodPellets.splice(this.foodPellets.indexOf(foodPellet), 1);
							}
						}
						break;
				}
			}
		}
	},
	input: function(playerNumber, button, state) {
		if (state == 1) { //Button pressed down
			if (button == 0 || button == 1) {
				this.snakes[playerNumber - 1].direction = snake_getRelativeDirection(this.snakes[playerNumber - 1].direction, (button == 0 ? "left" : "right"));
			}
		}
	},
	checkCollisions: function(snake) {
		location = snake.segments[0];
		if (location[0] < 0 || location[0] >= 32 || location[1] < 0 || location[1] >= 32) {
			return "wall";
		}
		for (var foodPellet of this.foodPellets) {
			if (foodPellet[0] == location[0] && foodPellet[1] == location[1]) {
				return "food";
			}
		}
		for (var iterSnake of this.snakes) {
			if (!iterSnake.alive) {
				continue;
			}
			if (snake == iterSnake) {
				iterSnake = {
					segments: iterSnake.segments.slice(1)
				};
			}
			for (segment of iterSnake.segments) {
				if (segment[0] == location[0] && segment[1] == location[1]) {
					return "snake";
				}
			}
		}
	},
	draw: function() { //A 32x32 array should be returned.
		var canvas = draw_getFilledCanvas("#545454");
		for (var foodPellet of this.foodPellets) {
			canvas[foodPellet[1]][foodPellet[0]] = this.colors.foodPellet;
		}
		for (var index = 0; index < this.snakes.length; index++) {
			var snake = this.snakes[index];
			if (!snake.alive) {
				continue;
			}
			for (segment of snake.segments) {
				canvas[segment[1]][segment[0]] = draw_getPlayerColor(index + 1);
			}
		}
		return canvas;
	},
	onPlayerConnect: function() {
		var [x, y] = snake_findSuitableLocation(this.snakes, this.foodPellets);
		var startingDirection;
		if (x < 16) {
			startingDirection = "east";
		}
		else {
			startingDirection = "west";
		}
		this.snakes.push({
			segments: [[x, y]],
			pendingSegments: 3, //Start with a snake length of 4.
			alive: true,
			direction: startingDirection
		});
		
		for (var i = 0; i < this.FOOD_SPAWNS_PER_PLAYER; i++) {
			this.spawnFoodPellet();
		}
	},
	onPlayerDisconnect: function(playerNumber) {
		this.snakes.splice(playerNumber - 1, 1);
		for (var i = 0; i < this.FOOD_SPAWNS_PER_PLAYER; i++) {
			this.foodPellets.shift();
		}
	},
	spawnFoodPellet: function() {
		var [x, y] = snake_findSuitableLocation(this.snakes, this.foodPellets);
		this.foodPellets.push([x, y]);
	},
	minPlayers: 1,
	maxPlayers: 12
});

exports.pong = () => ({
	MOVE_DELAY: 150, //~20 ticks every three seconds
	accumulator: 0,
	BALL_DELAY: 100,
	ballAccumulator: 0,
	keyData: [[false, false],
				[false, false]],
	STARTING_KEY_DATA: [false, false],
	PADDLE_WIDTH: 5,
	HORIZONTAL_PADDING: 7, //7 spaces from each side results in a 18x32 play area.
	p1Paddle: {
		x_offset: 5,
		y_offset: 30
	},
	p2Paddle: {
		x_offset: 5,
		y_offset: 2
	},
	ball: {
		x_offset: 16,
		y_offset: 16,
		x_real: 9,
		y_real: 16,
		vel_x: 2 * (Math.random() - 0.5),
		vel_y: (() => {var tVal = 2 * (Math.random() - 0.5); tVal += (tVal > 0 ? 0.2 : -0.2); return tVal;})()
	},
	tick: function(delta) {
		this.accumulator += delta;
		if (this.accumulator >= this.MOVE_DELAY) {
			this.accumulator -= this.MOVE_DELAY;
			this.movePaddles();
		}
		this.ballAccumulator += delta;
		if (this.ballAccumulator >= this.BALL_DELAY) {
			this.ballAccumulator -= this.BALL_DELAY;
			this.moveBall();
		}
	},
	input: function(playerNumber, button, state) {
		if (button == 0 || button == 1) {
			this.keyData[playerNumber - 1] = this.STARTING_KEY_DATA.slice(); //Slicing an array without changing anything copies it by value.
			if (state == 1) { //Button pressed down
				this.keyData[playerNumber - 1][button] = true;
			}
			else if (state == 0) { //Button released
				this.keyData[playerNumber - 1][button] = false;
			}
		}
	},
	draw: function() {
		var canvas = draw_getFilledCanvas("#767676");
		for (row of canvas) {
			for (var index = 0; index < row.length; index++) {
				if (index < this.HORIZONTAL_PADDING || (32 - index) <= this.HORIZONTAL_PADDING) {
					row[index] = "#1f1f1f";
				}
			}
		}
		for (var x = this.HORIZONTAL_PADDING + this.p1Paddle.x_offset; x < (this.HORIZONTAL_PADDING + this.p1Paddle.x_offset + this.PADDLE_WIDTH); x++) {
			canvas[this.p1Paddle.y_offset][x] = "#e2e2e2";
		}
		for (var x = this.HORIZONTAL_PADDING + this.p2Paddle.x_offset; x < (this.HORIZONTAL_PADDING + this.p2Paddle.x_offset + this.PADDLE_WIDTH); x++) {
			canvas[this.p2Paddle.y_offset][x] = "#e2e2e2";
		}
		
		canvas[this.ball.y_offset][this.HORIZONTAL_PADDING + this.ball.x_offset] = "#ffffff";
		
		return canvas;
	},
	movePaddles: function() {
		for (var playerNumber = 1; playerNumber <= 2; playerNumber++) {
			var paddle = (playerNumber == 1 ? this.p1Paddle : (playerNumber == 2 ? this.p2Paddle : null));
			if (this.keyData[playerNumber - 1][0]) {
				if (paddle.x_offset > 0) {
					paddle.x_offset -= 1;
				}
			}
			else if (this.keyData[playerNumber - 1][1]) {
				if (paddle.x_offset < (32 - (this.HORIZONTAL_PADDING * 2) - this.PADDLE_WIDTH)) {
					paddle.x_offset += 1;
				}
			}
		}
	},
	moveBall: function() {
		this.ball.x_real += this.ball.vel_x;
		this.ball.y_real += this.ball.vel_y;
		if (this.ball.x_real <= 0) {
			this.ball.x_real *= -1;
			this.ball.vel_x *= -1;
		}
		else if (this.ball.x_real >= 32 - 2 * this.HORIZONTAL_PADDING) {
			this.ball.x_real = (32 - 2 * this.HORIZONTAL_PADDING) - (this.ball.x_real - (32 - 2 * this.HORIZONTAL_PADDING));
			this.ball.vel_x *= -1;
		}
		if (this.ball.y_real <= 0 || this.ball.y_real >= 32) {
			this.ball.x_real = 9;
			this.ball.y_real = 16;
			this.ball.vel_x = 2 * (Math.random() - 0.5);
			this.ball.vel_y = 2 * (Math.random() - 0.5);
			this.ball.vel_y += (this.ball.vel_y > 0 ? 0.2 : -0.2);
		}
		if (Math.abs(this.ball.y_real - this.p1Paddle.y_offset) < 1 && this.ball.x_real >= this.p1Paddle.x_offset && this.ball.x_real <= this.p1Paddle.x_offset + this.PADDLE_WIDTH) {
			this.ball.vel_y *= -1;
		}
		else if (Math.abs(this.ball.y_real - this.p2Paddle.y_offset) < 1 && this.ball.x_real >= this.p2Paddle.x_offset && this.ball.x_real <= this.p2Paddle.x_offset + this.PADDLE_WIDTH) {
			this.ball.vel_y *= -1;
		}
		this.ball.x_offset = Math.round(this.ball.x_real);
		this.ball.y_offset = Math.round(this.ball.y_real);
		if (this.ball.x_offset < 0) this.ball.x_offset = 0;
		if (this.ball.x_offset > (32 - 2 * this.HORIZONTAL_PADDING - 1)) this.ball.x_offset = 32 - 2 * this.HORIZONTAL_PADDING - 1;
		if (this.ball.y_offset < 0) this.ball.y_offset = 0;
		if (this.ball.y_offset > (32 - 1)) this.ball.y_offset  = 32 - 1;
	},
	onPlayerConnect: function() {
	
	},
	onPlayerDisconnect: function(playerNumber) {
		this.keyData[playerNumber - 1] = this.STARTING_KEY_DATA.slice();
	},
	minPlayers: 2,
	maxPlayers: 2
});

const DISPLAY_SIZE = [1000, 1000];

exports.winterGame = () => ({
	GAME_ID: 150000015,
	MOVE_DELAY: 150/10, //~20 ticks every three seconds
	accumulator: 0,
	BALL_DELAY: 100,
	ballAccumulator: 0,
	keyData: [], //MULT -> add this
	STARTING_KEY_DATA: [false, false],
	PADDLE_WIDTH: 5,
	HORIZONTAL_PADDING: 7, //7 spaces from each side results in a 18x32 play area.
	SPAWN_PADDING: 0.2,
	paddles: [],
	getNextTeam: function() {
		evenAdvantage = 0;
		for (var padObj of this.paddles) {
			evenAdvantage += (padObj.id % 2 ? 1 : -1);
		}
		return (evenAdvantage > 0 ? 0 : 1);
	},
	Paddle: function(upperThis) { //Padding Defaults
		this.id = (upperThis.paddles.length > 0 ? upperThis.paddles[upperThis.paddles.length - 1] + 1 + upperThis.getNextTeam() : 1);
		var isOdd = this.id % 2;
		this.x_pos = isOdd ? 650 : 350;
		this.y_pos = upperThis.SPAWN_PADDING + DISPLAY_SIZE[1] * Math.random() * (1 - 2 * upperThis.SPAWN_PADDING);
		this.dir_pos = isOdd ? Math.PI : 0;
		this.turn_speed = 7 * Math.PI/180;
		this.move_speed = 7;
		this.shoot_delay = 0;
		this.health = 0; //Functioning as "hits"
	},
	bulletList: [],
	bulletSpeed: 18,
	bulletFrequency: 7, //Amount of delay
	Bullet: function(x, y, dir, vel, ownerId) {
		this.x = x;
		this.y = y;
		this.dir = dir;
		this.vel = vel;
		this.ownerId = ownerId;
		this.hitRadiusSquared = 15*15;
		this.active = true;
	},
	ball: {
		x_offset: 16,
		y_offset: 16,
		x_real: 9,
		y_real: 16,
		vel_x: 2 * (Math.random() - 0.5),
		vel_y: (() => {var tVal = 2 * (Math.random() - 0.5); tVal += (tVal > 0 ? 0.2 : -0.2); return tVal;})()
	},
	tick: function(delta) {
		this.accumulator += delta;
		if (this.accumulator >= this.MOVE_DELAY) {
			this.accumulator -= this.MOVE_DELAY;
			this.movePaddles();
		}
		this.ballAccumulator += delta;
		if (this.ballAccumulator >= this.BALL_DELAY) {
			this.ballAccumulator -= this.BALL_DELAY;
			this.checkCollisions();
		}
	},
	input: function(playerNumber, button, state) {
		if (button == 0 || button == 1) {
			//this.keyData[playerNumber - 1] = this.STARTING_KEY_DATA.slice(); //Slicing an array without changing anything copies it by value.
			if (state == 1) { //Button pressed down
				this.keyData[playerNumber - 1][button] = true;
			}
			else if (state == 0) { //Button released
				this.keyData[playerNumber - 1][button] = false;
			}
		}
	},
	draw: function() {
		var canvas = draw_getFilledCanvas(0);
		canvas[0] = this.GAME_ID;
		canvas[1] = [];
		for (var padObj of this.paddles) {
				canvas[1].push([padObj.x_pos, padObj.y_pos, padObj.dir_pos, padObj.health]);
		}
		canvas[3] = this.bulletList.map((bullet) => [bullet.x, bullet.y]);
		
		return canvas;
	},
	movePaddles: function() {
		for (var playerNumber = 0; playerNumber < this.paddles.length; playerNumber++) {
			var paddle = this.paddles[playerNumber];
			if (this.keyData[playerNumber][0]) {
				paddle.dir_pos += paddle.turn_speed;
			}
			else {
				paddle.dir_pos -= paddle.turn_speed;
			}
			paddle.x_pos += paddle.move_speed * Math.cos(paddle.dir_pos);
			paddle.y_pos += paddle.move_speed * Math.sin(paddle.dir_pos);
			
			if (paddle.shoot_delay > 0) paddle.shoot_delay -= 1;
			if (this.keyData[playerNumber][1]) {
				if (paddle.shoot_delay == 0) {
					this.bulletList.push(new this.Bullet(paddle.x_pos, paddle.y_pos, paddle.dir_pos, this.bulletSpeed, paddle.id));
					paddle.shoot_delay = this.bulletFrequency;
				}
			}
		}
		for (var bulletObj of this.bulletList) {
			bulletObj.x += bulletObj.vel * Math.cos(bulletObj.dir);
			bulletObj.y += bulletObj.vel * Math.sin(bulletObj.dir);
		}
	},
	calcDistSquared: function(x1, y1, x2, y2) {
		return Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
	},
	checkCollisions: function() {
		for (var pNum = 0; pNum < this.paddles.length; pNum++) {
			var pObj = this.paddles[pNum];
			for (const bObj of this.bulletList) {
				if (pObj.id != bObj.ownerId) {
					if (this.calcDistSquared(pObj.x_pos, pObj.y_pos, bObj.x, bObj.y) < bObj.hitRadiusSquared) {
						pObj.health += 1;
						bObj.active = false;
					}
				}
			}
		}
		this.bulletList = this.bulletList.filter((b) => b.active);
	},
	moveBall: function() {
		this.ball.x_real += this.ball.vel_x;
		this.ball.y_real += this.ball.vel_y;
		if (this.ball.x_real <= 0) {
			this.ball.x_real *= -1;
			this.ball.vel_x *= -1;
		}
		else if (this.ball.x_real >= 32 - 2 * this.HORIZONTAL_PADDING) {
			this.ball.x_real = (32 - 2 * this.HORIZONTAL_PADDING) - (this.ball.x_real - (32 - 2 * this.HORIZONTAL_PADDING));
			this.ball.vel_x *= -1;
		}
		if (this.ball.y_real <= 0 || this.ball.y_real >= 32) {
			this.ball.x_real = 9;
			this.ball.y_real = 16;
			this.ball.vel_x = 2 * (Math.random() - 0.5);
			this.ball.vel_y = 2 * (Math.random() - 0.5);
			this.ball.vel_y += (this.ball.vel_y > 0 ? 0.2 : -0.2);
		}
		if (Math.abs(this.ball.y_real - this.p1Paddle.y_offset) < 1 && this.ball.x_real >= this.p1Paddle.x_offset && this.ball.x_real <= this.p1Paddle.x_offset + this.PADDLE_WIDTH) {
			this.ball.vel_y *= -1;
		}
		else if (Math.abs(this.ball.y_real - this.p2Paddle.y_offset) < 1 && this.ball.x_real >= this.p2Paddle.x_offset && this.ball.x_real <= this.p2Paddle.x_offset + this.PADDLE_WIDTH) {
			this.ball.vel_y *= -1;
		}
		this.ball.x_offset = Math.round(this.ball.x_real);
		this.ball.y_offset = Math.round(this.ball.y_real);
		if (this.ball.x_offset < 0) this.ball.x_offset = 0;
		if (this.ball.x_offset > (32 - 2 * this.HORIZONTAL_PADDING - 1)) this.ball.x_offset = 32 - 2 * this.HORIZONTAL_PADDING - 1;
		if (this.ball.y_offset < 0) this.ball.y_offset = 0;
		if (this.ball.y_offset > (32 - 1)) this.ball.y_offset  = 32 - 1;
	},
	onPlayerConnect: function() {
		this.paddles.push(new this.Paddle(this));
		this.keyData.push(this.STARTING_KEY_DATA.slice());
	},
	onPlayerDisconnect: function(playerNumber) {
		this.paddles.splice(playerNumber - 1, 1);
		this.keyData.splice(playerNumber - 1, 1);
	},
	minPlayers: 1,
	maxPlayers: 200
});

//Platformer, Chess, Checkers, Climbing-style Game