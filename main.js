import './style.css'

import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { Plane } from './plane.js';
import { Obstacles } from './obstacles.js';
import { SFX } from './Sounds.js';


class Game {
    constructor () {
        const container = document.createElement('div');
        document.body.appendChild(container);

        this.clock = new THREE.Clock()

        this.assetsPath = "./assets/"; // Relative path from Game.js to assets folder

        this.scene = new THREE.Scene()

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set( -4.37, 0, -4.75 );
        this.camera.lookAt(0, 0, 6)

        this.cameraController = new THREE.Object3D();
        this.cameraController.add(this.camera);
        this.cameraTarget = new THREE.Vector3(0, 0, 6);
        this.scene.add(this.cameraController);

        const ambientLight = new THREE.HemisphereLight(0xffffff, 0xffffbb, 1)
        ambientLight.position.set( 0.5, 1, 0.25 );
        this.scene.add(ambientLight);

        this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        container.appendChild(this.renderer.domElement)
        this.setEnvironment()

        // const boxTexture = new THREE.TextureLoader().load(`${this.assetsPath}plane/jupitermap.jpg`);
        // this.box = new THREE.Mesh (
        //     new THREE.BoxGeometry(1, 1, 1),
        //     new THREE.MeshBasicMaterial({ map: boxTexture })
        // )
        // this.scene.add(this.box)

        this.active = false;
        this.load()

        window.addEventListener('resize', this.onWindowResize.bind(this))

        //controler event listner
        window.addEventListener("keydown", this.keydown.bind(this))
        window.addEventListener('keyup', this.keyUp.bind(this))

        this.spaceKey = false;

        const btn = document.getElementById('playBtn');
        btn.addEventListener('click', this.startGame.bind(this))

        this.animate()
    }

    //Start and game over functions
    startGame(){
        const gameover = document.getElementById('gameover');
        const instructions = document.getElementById('instructions');
        const btn = document.getElementById('playBtn');

        gameover.style.display = 'none';
        instructions.style.display = 'none';
        btn.style.display = 'none';

        this.score = 0;
        this.bonusScore = 0;
        this.lives = 3;

        let scoreElem = document.getElementById("score");
        scoreElem.innerHTML = this.score;

        let livesElem = document.getElementById('lives');
        livesElem.innerHTML = this.lives;

        this.plane.reset();
        this.Obstacles.reset();

        this.active = true;

        this.sfx.play("engine")

    }

    gameOver(){
        this.active = false;

        const gameOver = document.getElementById('gameover')
        const btn = document.getElementById('playBtn');


        gameOver.style.display = 'block'
        btn.style.display = 'block';

        this.plane.visible = false;

        this.sfx.stopAll();
        this.sfx.play("gameover")
    }

    reset(){
        this.plane.position.set(0, 0, 0);
        this.plane.visible = true;
        this.velocity.set(0, 0, 0.1)
    }

    //set Environment lighting
    setEnvironment(){
        const loader = new RGBELoader().setPath(this.assetsPath);
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader()

        const self = this;

        loader.load("hdr/venice_sunset_1k.hdr", (texture) => {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            pmremGenerator.dispose();

            self.scene.environment = envMap;
        },undefined, (err) => {
            console.error(err.message);
        })
    }

    //load function
    load () {
        this.loadSkyBox();
        // this.loading = true;
        //this.loadingBar.visible = true;

        this.plane = new Plane(this)
        this.Obstacles = new Obstacles(this)

        this.loadSFX()

    }

    //Controller
    keydown(event){
        switch(event.keyCode) {
            case 32: 
                this.spaceKey = true
                break
        }
    }

    keyUp(event){
        switch(event.keyCode) {
            case 32:
                this.spaceKey = false
                break
        }
    }

    //load keybox method
    loadSkyBox() {

        const textureLoader = new THREE.TextureLoader();
        textureLoader.setPath(`${this.assetsPath}plane/paintedsky/`);

        const outerEnvironmentMap = textureLoader.load([
            'px.jpg?timestamp=' + Date.now(), // Unique query parameter
            'nx.jpg?timestamp=' + Date.now(),
            'py.jpg?timestamp=' + Date.now(),
            'ny.jpg?timestamp=' + Date.now(),
            'pz.jpg?timestamp=' + Date.now(),
            'nz.jpg?timestamp=' + Date.now()
        ]);

        outerEnvironmentMap.encoding = THREE.sRGBEncoding;
        outerEnvironmentMap.generateMipmaps = true;

        this.scene.background = outerEnvironmentMap;
        this.scene.environment = outerEnvironmentMap;

    }

    //load sfx function
    loadSFX(){
        this.sfx = new SFX(this.camera, this.assetsPath + 'plane/');

        this.sfx.load('explosion');
        this.sfx.load('engine', true);
        this.sfx.load('gliss');
        this.sfx.load('gameover');
        this.sfx.load('bonus');
    }

    //score increment method
    incScore(){
        this.score ++;

        const elem = document.getElementById("score");

        if(this.score % 3 === 0) {
            this.bonusScore += 3;
        }

        elem.innerHTML = this.score + this.bonusScore;

        this.sfx.play("gliss")
    }

    //life decrement method
    decLives () {
        this.lives --;

        const elem = document.getElementById('lives');

        elem.innerHTML = this.lives

        if(this.lives == 0) {
            setTimeout(() => {
                this.gameOver()
            },1000)
        } 

        this.sfx.play("explosion")
    }

    //update camera method
    updateCamera(){
        this.cameraController.position.copy( this.plane.position );
        this.cameraController.position.y = 0;
        this.cameraTarget.copy(this.plane.position);
        this.cameraTarget.z += 6;
        this.camera.lookAt( this.cameraTarget );
    }

    //window resize method
    onWindowResize () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //animation function
    animate = () => {

        if (this.loading){
            if (this.plane.ready && this.obstacles.ready){
                this.loading = false;
                this.loadingBar.visible = false;
            }else{
                return;
            }
        }

        const dt = this.clock.getDelta();
        const time = this.clock.getElapsedTime();


        requestAnimationFrame(this.animate)



        this.plane.update(time);

        if(this.active){
            this.updateCamera()
            this.Obstacles.update(this.plane.position, dt)
        }

        this.renderer.render(this.scene, this.camera)
    }
}

export  {Game}