class TankScene extends Phaser.Scene {
    /** @type {Phaser.Tilemaps.Tilemap} */
    map
    /** @type {Phaser.Tilemaps.TilemapLayer} */
    destructLayer
    /** @type {PlayerTank} */
    player
    /** @type {Array.<EnemyTank>} */
    enemyTanks = []
    /** @type {Phaser.Physics.Arcade.Group} */
    playerBullets
    /** @type {Phaser.Physics.Arcade.Group} */
    enemyBullets
    /** @type {Phaser.GameObjects.Text} */
    enemyTankRemaining
    /** @type {number} */
    enemyTankDestroyed = 0
    /** @type {Phaser.GameObjects.Image} */
    healthicon
    /** @type {Phaser.GameObjects.Image} */
    enemyicon
    /** @type {Phaser.Animations.Animation} */
    healthBar
    /** @type {Phaser.Animations.Animation} */
    fuelBar
    preload() {
        this.load.image("bullet", "assets/tanks/bullet.png")
        this.load.atlas("tank", "assets/tanks/tanks.png", "assets/tanks/tanks.json")
        this.load.atlas("enemy", "assets/tanks/enemy-tanks.png", "assets/tanks/tanks.json")
        this.load.image("tileset", "assets/tanks/landscape-tileset.png")
        this.load.tilemapTiledJSON("Level1", "assets/Level1.json")
        this.load.spritesheet("fuelbar", "assets/UI/fuel-bar.png", {frameWidth: 128, frameHeight: 10})
        this.load.image("enemyicon", "assets/UI/enemy-tank-icon.png")
        this.load.spritesheet("playerhealth", "assets/UI/player-tank-health.png", {frameWidth: 32, frameHeight: 32})
        this.load.image("healthicon", "assets/UI/health.png")
    }
    create() {
        // Load In Tilemaps
        this.map = this.make.tilemap({ key: "Level1" })
        const landscape = this.map.addTilesetImage("landscape-tileset", "tileset")
        this.map.createLayer("groundLayer", [landscape], 0, 0)
        this.destructLayer = this.map.createLayer("destructableLayer", [landscape], 0, 0)
        this.destructLayer.setCollisionByProperty({ collide: true })
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
        // Create UI
        this.add.image(26, 24, "healthicon").setScrollFactor(0).setScale(3, 3).setDepth(10)
        this.add.image(30, 570, "enemyicon").setScrollFactor(0).setScale(1.5, 1.5).setDepth(10)
        this.enemyTankRemaining =this.add.text(65, 565, "enemy tanks: 0", {
            fontSize: "20px",
            color: "#000000",
            fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
            fontStyle: "bold"
        }).setScrollFactor(0).setDepth(10)
        this.add.image(80, 24, "playerhealth", 0).setScrollFactor(0).setScale(1.5, 1.5).setDepth(10)
        this.add.image(625, 575, "fuelbar", 0).setScrollFactor(0).setScale(2.5, 2.5).setDepth(10)
        // UI Animations
        this.anims.create({
            key: "playerHealthBar",
            frames: this.anims.generateFrameNumbers("playerhealth", { start:0, end: 12}),
            frameRate: 0,
            repeat: -1
        })
        this.anims.create({
            key: "playerFuelBar",
            frames: this.anims.generateFrameNumbers("fuelbar", {start:0, end: 36}),
            frameRate: 0,
            repeat: -1
        })
        // Create Bullets
        this.enemyBullets = this.physics.add.group({
            defaultKey: "bullet",
            maxSize: 10
        })
        this.playerBullets = this.physics.add.group({
            defaultKey: "bullet",
            maxSize: 5
        })
        // Object Spawns
        const objectLayer = this.map.getObjectLayer("objectLayer")
        let enemyObjects = []
        let actor
        objectLayer.objects.forEach(function (object) {
            actor = Utils.RetrieveCustomProperties(object)
            if (actor.type == "playerSpawn") {
                this.createPlayer(actor)
            }else if(actor.type == "enemySpawn"){
                enemyObjects.push(actor)
            }
        }, this)
        this.cameras.main.startFollow(this.player.hull, true, 0.25, 0.25)
        for(let i = 0; i < enemyObjects.length; i++){
            this.createEnemy(enemyObjects[i])
        }   
    }
    update(time, delta) {
        this.player.update()
        for(let i = 0; i < this.enemyTanks.length; i++){
            this.enemyTanks[i].update(time, delta)
        }
    if (this.player.damageMax == 12){

    }
    else if(this.player.damageMax == 11){

    }    
    }
    createEnemy(dataObject){
        let enemyTank = new EnemyTank(this, dataObject.x, dataObject.y, "enemy", "tank1", this.player)
        enemyTank.initMovement()
        enemyTank.enableCollision(this.destructLayer)
        this.physics.add.collider(enemyTank.hull, this.player.hull)
        this.enemyTanks.push(enemyTank)
        if(this.enemyTanks.length > 1){
            for(let i = 0; i < this.enemyTanks.length - 1; i++){
                this.physics.add.collider(enemyTank.hull, this.enemyTanks[i].hull)
                this.enemyTankDestroyed += 1
                this.enemyTankRemaining.setText("enemy tanks: " + this.enemyTankDestroyed)

            }
        }
    }
    createPlayer(dataObject) {
        this.player = new PlayerTank(this, dataObject.x, dataObject.y, "tank", "tank1")
        this.player.enableCollision(this.destructLayer)
    }

}