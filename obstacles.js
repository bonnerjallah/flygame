import { Group, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// import { Explosion } from './Explosion.js';

class Obstacles {
    constructor(game) {
        this.game = game;
        this.assetsPath = game.assetsPath;
        this.loadingBar = game.loadingBar;
        this.scene = game.scene;
        this.loadGasCan();
        this.loadBomb();
        this.tmpPos = new Vector3();
        this.explosions = [];
        this.ready = false; // Initialization flag
    }

    loadGasCan() {
        const loader = new GLTFLoader().setPath(`${this.assetsPath}/bomb/`);
        
        loader.load(
            'gas_cylinder.glb',
            gltf => {
                this.gas = gltf.scene.children[0];
                const scale = 0.5;
                this.gas.scale.set(scale, scale, scale)
                this.gas.name = "gas";
                if (this.bomb !== undefined) this.initialize();
            },
            xhr => {
                // this.loadingBar.update('gas', xhr.loaded, xhr.total );
            },
            err => {
                console.error(err);
            }
        );
    }

    loadBomb() {
        const loader = new GLTFLoader().setPath(`${this.assetsPath}/bomb/`);
        
        loader.load(
            'nuclear_bomb.glb',
            gltf => {
                this.bomb = gltf.scene.children[0];
                const scale = 0.5;
                this.bomb.scale.set(scale, scale, scale)
                this.bomb.name = "bomb";
                if (this.gas !== undefined) this.initialize();
            },
            xhr => {
                // this.loadingBar.update('bomb', xhr.loaded, xhr.total );
            },
            err => {
                console.error(err);
            }
        );
    }

    //creat several column of objects
    initialize() {
        this.obstacles = [];
        const obstacle = new Group();
        obstacle.add(this.gas);
        this.bomb.rotation.x = -Math.PI * 0.5;
        this.bomb.position.y = 7.5;
        obstacle.add(this.bomb);

        let rotate = true;

        for (let y = 5; y >- 8; y -= 2.5) {
            rotate = !rotate;
            if (y === 0) continue;
            const bomb = this.bomb.clone();
            bomb.rotation.x = (rotate) ? -Math.PI * 0.5 : 0;
            bomb.position.y = y;
            obstacle.add(bomb);
        }

        this.obstacles.push(obstacle);
        this.scene.add(obstacle);

        for (let j = 0; j < 3; j++) {
            const obstacle1 = obstacle.clone();
            this.scene.add(obstacle1);
            this.obstacles.push(obstacle1);
        }

        this.reset();
        this.ready = true;
    }

    removeExplosion(explosion) {
        const index = this.explosions.indexOf(explosion);
        if (index != -1) this.explosions.splice(index, 1);
    }

    reset() {
        this.obstacleSpawn = { pos: 20, offset: 5 };
        this.obstacles.forEach(obstacle => this.respawnObstacle(obstacle));
        let count = 0;
        while (this.explosions.length > 0 && count < 100) {
            this.explosions[0].onComplete();
            count++;
        }
    }

    respawnObstacle(obstacle) {
        this.obstacleSpawn.pos += 30;
        const offset = (Math.random() * 2 - 1) * this.obstacleSpawn.offset;
        this.obstacleSpawn.offset += 0.2;
        obstacle.position.set(0, offset, this.obstacleSpawn.pos);
        obstacle.children[0].rotation.y = Math.random() * Math.PI * 2;
        obstacle.userData.hit = false;
        obstacle.children.forEach(child => {
            child.visible = true;
        });
    }

    update(pos, time) {
        let collisionObstacle;

        this.obstacles.forEach(obstacle => {
            obstacle.children[0].rotateY(0.01);
            const relativePosZ = obstacle.position.z - pos.z;
            if (Math.abs(relativePosZ) < 2 && !obstacle.userData.hit) {
                collisionObstacle = obstacle;
            }
            if (relativePosZ < -20) {
                this.respawnObstacle(obstacle);
            }
        });

        if (collisionObstacle !== undefined) {
            collisionObstacle.children.some(child => {
                child.getWorldPosition(this.tmpPos);
                const dist = this.tmpPos.distanceToSquared(pos);
                if (dist < 5) {
                    collisionObstacle.userData.hit = true;
                    this.hit(child);
                    return true;
                }
            });
        }

        this.explosions.forEach(explosion => {
            explosion.update(time);
        });
    }

    hit(obj) {
        if (obj.name === 'gas') {
            this.game.incScore();
        } else {
            this.explosions.push(new Explosion(obj, this));
            this.game.decLives();
        }
        obj.visible = false;
    }
}

export { Obstacles };
