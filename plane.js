import {AnimationMixer, Vector3} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class Plane{
    constructor(game){
        this.assetsPath = game.assetsPath;
        this.loadingBar = game.loadingBar;
        this.game = game;
        this.scene = game.scene;
        this.load();
        this.tmpPos = new Vector3(); //This initialization prepares tmpPos to hold and manipulate positions in 3D space.
    }

    get position(){
        if(this.plane !== undefined) this.plane.getWorldPosition(this.tmpPos);
        return this.tmpPos;
    }

    set visible(mode){
        this.plane.visible = mode;
    }

    load() {
        const loader = new GLTFLoader().setPath(`${this.assetsPath}/plane/`);
        this.ready = false;
    
        loader.load(
			'microplane.glb',
            (gltf) => {
                this.scene.add(gltf.scene);
                this.plane = gltf.scene;
                const scale = 1;
                this.plane.scale.set(scale, scale, scale); 
                this.velocity = new Vector3(0, 0, 0.1);

    
                this.propeller = this.plane.getObjectByName("propeller");
                // console.log(this.propeller)
                // console.log(this.plane)

                // // Check for animations
                // if (gltf.animations && gltf.animations.length > 0) {
                //     this.mixer = new AnimationMixer(this.plane);
                //     gltf.animations.forEach((clip, index) => {
                //         console.log(`Animation ${index}: ${clip.name}`);
                //     });

                //     const clip = gltf.animations[0]; // Play the first animation as an example
                //     const action = this.mixer.clipAction(clip);
                //     action.play();
                // } else {
                //     console.log('No animations found in the model.');
                // }

    
                this.ready = true;
            },
            xhr => {
                // Uncomment and update this line if you have a loading bar to update
                // this.loadingBar.update('plane', xhr.loaded, xhr.total);
            },
            err => {
                console.error(err);
            }
        );
    }

    //call by startgame method of the game class in main file
    reset(){
        this.plane.position.set(0, 0, 0);
        this.plane.visible = true;
        this.velocity.set(0, 0, 0.1)
    }

    update(time){
        if(!this.plane) return
        if (this.propeller !== undefined) this.propeller.rotateZ(1);

        if (this.game.active){
            if (!this.game.spaceKey){
                this.velocity.y -= 0.001;
            }else{
                this.velocity.y += 0.001;
            }
            this.velocity.z += 0.0001;
            this.plane.rotation.set(0, 0, Math.sin(time*3)*0.2, 'XYZ');
            this.plane.translateZ( this.velocity.z );
            this.plane.translateY( this.velocity.y );
        }else{
            this.plane.rotation.set(0, 0, Math.sin(time*3)*0.2, 'XYZ');
            this.plane.position.y = Math.cos(time) * 1.5;
        }

    }
    
}

export {Plane}