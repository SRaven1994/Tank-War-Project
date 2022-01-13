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
    /**@type {Phaser.Physics.Arcade.StaticGroup} */
    healthItem
    /**@type {Phaser.Physics.Arcade.StaticGroup} */
    fuelItem
    /** @type {Phaser.GameObjects.Text} */
    enemyTankRemaining
    /** @type {number} */
    enemyTankRemain = 0
    /** @type {Phaser.GameObjects.Image} */
    healthIcon
    /** @type {Phaser.GameObjects.Image} */
    enemyIcon
    /** @type {Phaser.GameObjects.Sprite} */
    healthBar
    /** @type {Phaser.GameObjects.Sprite} */
    fuelBar
    /** @type {Phaser.GameObjects.Group} */
    explosions
    preload() {
        this.load.image("bullet", "assets/tanks/bullet.png")
        this.load.atlas("tank", "assets/tanks/tanks.png", "assets/tanks/tanks.json")
        this.load.atlas("enemy", "assets/tanks/enemy-tanks.png", "assets/tanks/tanks.json")
        this.load.atlas("boss", "assets/tanks/boss-tanks.png", "assets/tanks/tanks.json")
        this.load.atlas("speed", "assets/tanks/speed-tanks.png", "assets/tanks/tanks.json")
        this.load.image("tileset", "assets/tanks/landscape-tileset.png")
        this.load.tilemapTiledJSON("Level1", "assets/Level1.json")
        this.load.spritesheet("fuelbar", "assets/UI/fuel-bar.png", { frameWidth: 128, frameHeight: 10 })
        this.load.image("enemyicon", "assets/UI/enemy-tank-icon.png")
        this.load.spritesheet("playerhealth", "assets/UI/player-tank-health.png", { frameWidth: 32, frameHeight: 32 })
        this.load.image("healthicon", "assets/UI/health.png")
        this.load.spritesheet("explosion", "assets/tanks/explosion.png", { frameWidth: 64, frameHeight: 64 })
        this.load.image("healthItem", "assets/items/repairItem.png")
        this.load.image("ammoItem", "assets/items/ammoItem.png")
        this.load.image("fuelItem", "assets/items/fuelItem.png")
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
        this.enemyTankRemaining = this.add.text(65, 565, "enemy tanks: 0", {
            fontSize: "20px",
            color: "#FFFFFF",
            fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
            fontStyle: "bold"
        }).setScrollFactor(0).setDepth(10)
        this.add.sprite(80, 24, "playerhealth", 0).setScrollFactor(0).setScale(1.5, 1.5).setDepth(10)
        this.add.sprite(625, 575, "fuelbar", 0).setScrollFactor(0).setScale(2.5, 2.5).setDepth(10)
        // UI Animations
        this.anims.create({
            key: "playerHealthBar",
            frames: this.anims.generateFrameNumbers("playerhealth", {frames:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}),
            frameRate: 1,
        })
        this.anims.create({
            key: "playerFuelBar",
            frames: this.anims.generateFrameNumbers("fuelbar", { start: 0, end: 36 }),
            frameRate: 1,
        })
        // To test out later for UI Animation changes on Frame, may work?
        // this.anims.create({
        //     key: 'anim_run',
        //     frames: [
        //         { key: 'sprites', frame: 'guyrun1' },
        //         { key: 'sprites', frame: 'guyrun2' },
        //         { key: 'sprites', frame: 'guyrun3' },
        //         { key: 'sprites', frame: 'guyrun2' }
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
            } else if (actor.type == "enemySpawn" || actor.type == "speedSpawn" || actor.type == "bossSpawn") {
                enemyObjects.push(actor)
            }
        }, this)
        let healthPoints = TankScene.FindPoints(this.map, "objectLayer", "healthItem")
        this.healthItem = this.physics.add.staticGroup()
        for (let point, i = 0; i < healthPoints.length; i++){
            point = healthPoints[i]
            this.healthItem.create(point.x, point.y, "healthItem")
        }
        this.physics.add.overlap(this.player.hull, this.healthItem, this.collectHealth, null, this)
        let fuelPoints = TankScene.FindPoints(this.map, "objectLayer", "fuelItem")
        this.fuelItem = this.physics.add.staticGroup()
        for (let point, i = 0; i < fuelPoints.length; i++){
            point = fuelPoints[i]
            this.fuelItem.create(point.x, point.y, "fuelItem")
        }
        this.physics.add.overlap(this.player.hull, this.fuelItem, this.collectFuel, null, this)
        this.cameras.main.startFollow(this.player.hull, true, 0.25, 0.25)
        for (let i = 0; i < enemyObjects.length; i++) {
            this.createEnemy(enemyObjects[i])
        }
        // Create Explosions
        this.explosions = this.add.group({
            defaultKey: "explosion",
            maxSize: enemyObjects.length + 1
        })
        this.anims.create({
            key: "explode",
            frames: this.anims.generateFrameNumbers("explosion", { start: 0, end: 23, first:23 }),
            frameRate: 24,
        })
        // Pointer
        this.input.on("pointerdown", this.tryShoot, this)
        this.physics.world.on("worldbounds", function (body) {
            this.disposeOfBullet(body.gameObject)
        }, this)
    }
    update(time, delta) {
        this.player.update()
        for (let i = 0; i < this.enemyTanks.length; i++) {
            this.enemyTanks[i].update(time, delta)
        }
        if (this.player.damageCount == 0) {
            // this.healthBar.setMask
        }
        else if (this.player.damageCount == 1) {

        }
    }
    createEnemy(dataObject) {
        let enemyTank 
        if(dataObject.type == "enemySpawn"){
            enemyTank = new EnemyTank(this, dataObject.x, dataObject.y, "enemy", "tank1", this.player)
        }else if(dataObject.type == "bossSpawn"){
            enemyTank = new BossTank(this, dataObject.x, dataObject.y, "boss", "tank1", this.player)
        }else if(dataObject.type == "speedSpawn"){
            enemyTank = new SpeedyTank(this, dataObject.x, dataObject.y, "speed", "tank1", this.player)
        }
        enemyTank.initMovement()
        enemyTank.enableCollision(this.destructLayer)
        enemyTank.setBullets(this.enemyBullets)
        this.enemyTankRemain ++
        this.physics.add.collider(enemyTank.hull, this.player.hull)
        this.enemyTanks.push(enemyTank)
        if (this.enemyTanks.length > 1) {
            for (let i = 0; i < this.enemyTanks.length - 1; i++) {
                this.physics.add.collider(enemyTank.hull, this.enemyTanks[i].hull)                
                this.enemyTankRemaining.setText("enemy tanks: " + this.enemyTankRemain)
            }
        }
    }
    createPlayer(dataObject) {
        this.player = new PlayerTank(this, dataObject.x, dataObject.y, "tank", "tank1")
        this.player.enableCollision(this.destructLayer)
    }
    tryShoot(pointer) {
        /** @type {Phaser.Physics.Arcade.Sprite} */
        let bullet = this.playerBullets.get(this.player.turret.x, this.player.turret.y)
        if (bullet) {
            this.fireBullet(bullet, this.player.turret.rotation, this.enemyTanks)
        }
    }
    fireBullet(bullet, rotation, target) {
        bullet.setDepth(3)
        bullet.body.collideWorldBounds = true
        bullet.body.onWorldBounds = true
        bullet.enableBody(false, bullet.x, bullet.y, true, true)
        bullet.rotation = rotation
        this.physics.velocityFromRotation(bullet.rotation, 500, bullet.body.velocity)
        this.physics.add.collider(bullet, this.destructLayer, this.damageWall, null, this)
        if(target === this.player){
            this.physics.add.overlap(this.player.hull, bullet, this.bulletHitPlayer, null, this)
        }else{
            for(let i = 0; i < this.enemyTanks.length; i++)
                this.physics.add.overlap(this.enemyTanks[i].hull, bullet, this.bulletHitEnemy, null, this)
        }
    }
    bulletHitPlayer(hull, bullet){
        this.disposeOfBullet(bullet)
        let explosion = this.explosions.get(hull.x, hull.y)
        if(explosion){
            this.activateExplosion(explosion)
            explosion.play("explode")
        }
        this.player.damage()
        if(this.player.isDestroyed()){
            this.input.enabled = false
            this.enemyTanks = []
            this.physics.pause()
            let explosion = this.explosions.get(hull.x, hull.y)
            if(explosion){
                this.activateExplosion(explosion)
                explosion.play("explode")
            }
        }
    }

    bulletHitEnemy(hull, bullet) {
        /** @type {EnemyTank} */
        let enemy
        /** @type {number} */
        let index
        for(let i = 0; i < this.enemyTanks.length; i++){
            if(this.enemyTanks[i].hull === hull){
            enemy = this.enemyTanks[i]
            index = i
            break
            }
        }
        this.disposeOfBullet(bullet)
        let explosion = this.explosions.get(hull.x, hull.y)
        if(explosion){
            this.activateExplosion(explosion)
            explosion.on("animationcomplete", this.animComplete, this)
            explosion.play("explode")
        }
        enemy.damage()
        if(enemy.isImmobilised()){
            let explosion = this.explosions.get(hull.x, hull.y)
            if(explosion){
                this.activateExplosion(explosion)
                explosion.on("animationcomplete", this.animComplete, this)
                explosion.play("explode")
            }
            if(enemy.isDestroyed()){
                // Remove from Array
                this.enemyTanks.splice(index, 1)
                this.enemyTankRemain --
                this.enemyTankRemaining.setText("enemy tanks: " + this.enemyTankRemain)
            }
        }
    }
    activateExplosion(explosion){
        explosion.setDepth(5)
        explosion.setActive(true)
        explosion.setVisible(true)
    }
    damageWall(bullet, tile) {
        this.disposeOfBullet(bullet)
        let explosion = this.explosions.get(bullet.x, bullet.y)
        if(explosion){
            this.activateExplosion(explosion)
            explosion.on("animationcomplete", this.animComplete, this)
            explosion.play("explode")
        }
        // Obtain tileset id
        let firstGid = this.destructLayer.tileset[0].firstgid
        // Next tile id
        let nextTileId = tile.index + 1 - firstGid
        // Get next tile properties
        let tileProperties = this.destructLayer.tileset[0].tileProperties[nextTileId]
        let newTile = this.destructLayer.putTileAt(nextTileId + firstGid, tile.x, tile.y)
        if (tileProperties && tileProperties.collides) {
            newTile.setCollision(true)
            let explosion = this.explosions.get(bullet.x, bullet.y)
            if(explosion){
                this.activateExplosion(explosion)
                explosion.on("animationcomplete", this.animComplete, this)
                explosion.play("explode")
            }
        }
    }
    collectHealth(player, healthItem){
        if(this.player.damageCount > 0){
            healthItem.disableBody(true, true)
            this.player.damageCount --
        }
    }
    collectFuel(player, fuelItem){
        if(this.player.currentFuel < 36){
            fuelItem.disableBody(true, true)
            this.player.currentFuel += 9
        }
    }
    disposeOfBullet(bullet) {
        bullet.disableBody(true, true)
    }
    animComplete(animation, frame, gameObject){
        this.explosions.killAndHide(gameObject)
    }
        // Spawn Objects on Point
        static FindPoint(map, layer, type, name) {
            var loc = map.findObject(layer, function (object) {
                if (object.type === type && object.name === name) {
                    return object
                }
            })
            return loc
        }
        static FindPoints(map, layer, type) {
            var locs = map.filterObjects(layer, function (object) {
                if (object.type === type) {
                    return object
                }
            })
            return locs
        }

}