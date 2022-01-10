class SpeedyTank extends EnemyTank{
    /** @type {number} */
    shotInterval = 5000
    /** @type {number} */
    tankSpeed = 200
    /** @type {number} */
    damageMax = 2
    constructor(scene, x, y, texture, frame, player){
        super(scene, x, y, texture, frame, player)
    }
}