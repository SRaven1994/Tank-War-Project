class PlayerTank extends BaseTank {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame)
        this.cursors = scene.input.keyboard.createCursorKeys()
        this.keys = scene.input.keyboard.addKeys({
            w:Phaser.Input.Keyboard.KeyCodes.W,
            a:Phaser.Input.Keyboard.KeyCodes.A,
            s:Phaser.Input.Keyboard.KeyCodes.S,
            d:Phaser.Input.Keyboard.KeyCodes.D
        })
        this.damageMax = 12
        this.currentSpeed = 0
        this.currentFuel = 36
        this.usedFuel = true
    }
    update(){
        if(this.currentFuel > 36){
            this.currentFuel = 36
        }
        if(this.usedFuel && this.currentFuel >= 1){
            this.currentFuel --
            this.usedFuel = false
            setTimeout(() => { this.usedFuel = true}, 1000) 
         }  
        super.update()    
        if(this.keys.w.isDown && this.currentFuel >= 1){
            if(this.currentSpeed < this.tankSpeed){
                this.currentSpeed += 2000
            }
        }else if(this.keys.s.isDown && this.currentFuel >= 1){
            if(this.currentSpeed > -this.tankSpeed){
                this.currentSpeed -= 2000
            }
        }else{
            this.currentSpeed *= 0.9
        }    
        if(this.keys.w.isDown && this.currentFuel == 0){
            if(this.currentSpeed < this.tankSpeed){
                this.currentSpeed += 5
            }
        }
        else if(this.keys.s.isDown && this.currentFuel == 0){
            if(this.currentSpeed > -this.tankSpeed){
                this.currentSpeed -= 5
            }
        }else{
            this.currentSpeed *= 0.1    
        }          
        if(this.keys.a.isDown && this.damageCount < 12){
            if(this.currentSpeed > 0){
                this.hull.angle--
            }else{
                this.hull.angle++
            }
        }else if(this.keys.d.isDown  && this.damageCount < 12){
            if(this.currentSpeed > 0){
                this.hull.angle++
            }else{
                this.hull.angle--
            }
        }
        this.scene.physics.velocityFromRotation(this.hull.rotation, this.currentSpeed, this.hull.body.velocity)
        const worldPoint = this.scene.input.activePointer.positionToCamera(this.scene.cameras.main)
        this.turret.rotation = Phaser.Math.Angle.Between(this.turret.x, this.turret.y, worldPoint.x, worldPoint.y)
    }
    damage(){
        this.scene.cameras.main.shake(200, 0.005)
        this.damageCount++
        console.log(this.damageCount)
        if(this.isDestroyed()){
            this.burn()
        }
    }
}