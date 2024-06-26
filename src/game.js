function startGame() {
    
    const moveSpeed = 120;
    const jumpForce = 360;
    const bigJumpForce = 550;
    let currentJumpForce = jumpForce;
    const fallDeath = 400;
    const enemySpeed = 20;
    const msToFallthrough = 800;
    let isJumping = true;
    let scoreLabel = 0;
        
    var config = {
        type: Phaser.AUTO,
        width: 600,
        height: 600,
        zoom: 1.9,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 1000 },
                debug: false
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };
    
    var player;
    var cursors;
    var caveTile;
    var game = new Phaser.Game(config);
    var level = "01";

    let hillsLayer;
    let groundLayer;
    let waterLayer;
    
    function preload() {
        this.load.spritesheet('player-doux', '../assets/sprites/DinoSprites-doux.png', {
            frameWidth: 24,
            frameHeight: 24,
            startFrame: 0,
            endFrame: 23,
        });

        this.load.image('tiles', '../assets/sprites/nature-platformer-tileset-16x16.png');
        this.load.tilemapTiledJSON('map01', '../assets/maps/map01.json');
        this.load.tilemapTiledJSON('map02', '../assets/maps/map02.json');
    }
    
    function create() {
        cursors = this.input.keyboard.createCursorKeys();
        
        // === WORLD ===
        /* 
        Some of the values below are fetched from the map data in program Tiled:
        
        this.make.tilemap({ key: 'Chosen key after loding the JSON data in preload()' });

        map.addTilesetImage('Name of the tileset in Tiled','Chosen key after loading the image in preload()');
        
        map.createLayer('Name of the layer in Tiled', tileset variable);
        */

        const map = this.make.tilemap({ key: 'map'+level });
        const tileset = map.addTilesetImage('tiles1', 'tiles');

        map.createLayer('sky', tileset);
        hillsLayer = map.createLayer('hills', tileset);
        groundLayer = map.createLayer('ground', tileset);
        waterLayer = map.createLayer('water', tileset);
        

        // === PLAYER ===
        player = this.physics.add.sprite(100, 200, 'player-doux');

        player.setCollideWorldBounds(true);
        player.body.height = 18;
        player.body.width = 18;
        player.body.offset = {x: 3, y: 3};
        // player.body.setFrictionAir(5);
        console.log(player);

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player-doux', { start: 0, end: 2 }),
            frameRate: 5,
            // repeat: -1 // loop
            loop: true
        });
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('player-doux', { start: 3, end: 9 }),
            frameRate: 7,
            repeat: -1
        });
        this.anims.create({
            key: 'kick',
            frames: this.anims.generateFrameNumbers('player-doux', { start: 10, end: 12 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'hurt',
            frames: this.anims.generateFrameNumbers('player-doux', { start: 13, end: 16 }),
            frameRate: 10,
            repeat: 1
        });
        this.anims.create({
            key: 'sneak',
            frames: this.anims.generateFrameNumbers('player-doux', { start: 17, end: 23 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'duck',
            frames:this.anims.generateFrameNumbers('player-doux', { start: 17, end: 17 }),
            frameRate: 1,
            repeat: -1
        });
        this.anims.create({
            key: 'jump',
            frames:this.anims.generateFrameNumbers('player-doux', { start: 21, end: 21 }),
            frameRate: 1,
            repeat: -1
        });

        // === COLLISION ====
        hillsLayer.setCollisionByProperty({collision: true});
        groundLayer.setCollisionByProperty({collision: true});
        waterLayer.setCollisionByProperty({collision: true});

        this.physics.add.collider(player, hillsLayer);
        this.physics.add.collider(player, groundLayer);
        this.physics.add.collider(player, waterLayer);
        
        // TODO: Break out to a proper function
        hillsLayer.layer.data.forEach(row => {
            row.find((tile) => { 
                if(tile.properties['collision-top']){
                    tile.collideUp = true;
                    tile.collideDown = false;
                    tile.collideLeft = false;
                    tile.collideRight = false;

                    tile.faceTop = true;
                    tile.faceBottom = false;
                    tile.faceLeft = false;
                    tile.faceRight = false;

                }
            });
        });
    }

    function update() {
        if(cursors.left.isDown) {
            player.setVelocityX(-160);
            player.anims.play('run', true);
            player.setFlipX(true);
        } else if(cursors.right.isDown) {
            player.setVelocityX(160);
            player.anims.play('run', true);
            player.setFlipX(false);
        } else if(cursors.down.isDown) {
            player.setVelocityX(0);
            player.anims.play('duck');
            if(cursors.down.getDuration() >= msToFallthrough) {
                // Fallthrough
                player.body.checkCollision.down = false;
                setTimeout(() => {
                    player.body.checkCollision.down = true;
                }, 200);
            }
        } else if(cursors.up.isDown) {
            console.log(player);
            console.log(waterLayer);
            let currentTile = hillsLayer.getTileAtWorldXY(player.x, player.y);
            if(currentTile && currentTile.properties.id == "cave") {
                // Next level or interact
                // TODO: Make a proper level handeler
                if(level == "01") {
                    level = "02";
                } else {
                    level = "01";
                }
                this.scene.restart({ key: 'map'+level });
            }
        } else {
            player.anims.play('idle', true);
            player.setVelocityX(0);
        }

        // if(cursors.up.isDown && player.body.touching.down) {
        if(cursors.space.isDown && player.body.onFloor()) {
            player.setVelocityY(-330);
        }

        if(player.body.blocked.none) {
            player.anims.play('jump');
        }

    }
}