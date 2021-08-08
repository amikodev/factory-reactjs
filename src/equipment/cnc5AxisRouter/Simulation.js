/*
amikodev/factory-reactjs - Industrial equipment management with ReactJS
Copyright © 2021 Prihodko Dmitriy - asketcnc@yandex.ru
*/

/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import React from 'react';


import {AppContext} from '../../AppContext';

// import GCode from '../GCode';
// import { letterCodes } from '../GCode';
// import { COORD_SYSTEM_NULL, COORD_SYSTEM_USER } from '../GCode';

import * as THREE from 'three';
import TrackballControls from 'three-trackballcontrols';
import { CSG } from 'three-csg-ts';

import { withStyles } from '@material-ui/core/styles';
import Equipments from '../../Equipments';
const useStyles = theme => ({
    root: {
    }
});


/**
 * Симулятор
 */
 class Simulation extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);


        this.state = {

        }

        this.rotaryA = null;
        this.rotaryC = null;

        this.head = null;

        this.co = {x: 0, y: 0};
        this.translateCoord = null;

        this.equipmentLength = 5.7;
        this.equipmentWidth = 0.3;


        this.scene = null;
        this.cylinderGeometry = null;
        this.mill = null;
        this.blankMesh = null;

        
    }

    componentDidMount(){

        // console.log('componentDidMount');

        let screenWidth = 500;
        let screenHeight = 500;

        let renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(screenWidth, screenHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

        this.mount.appendChild(renderer.domElement);

        let scene = null;
        let geometry = null;
        let cylinderGeometry = null;

        // let co = {x: 0.0, y: 0.0};
        let co = this.co;

        // let equipmentWidth = 0.3;

        let init = () => {

            let posInfo = renderer.domElement.getBoundingClientRect();
            // if(posInfo.width === 0 && posInfo.height === 0){
            // console.log({posInfo});
            // screenWidth = posInfo.width;
            // renderer.setSize(screenWidth, screenHeight);


            scene = new THREE.Scene();
            // let camera = new THREE.PerspectiveCamera(75, screenWidth/screenHeight, 0.1, 1000);
            let camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1000);

            geometry = new THREE.BoxGeometry(1, 1, 1);
            cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);

            const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
            scene.add(light);

            const light2 = new THREE.DirectionalLight( 0xffffff, 0.4, 100 );
            light2.position.set( 6, 12, 2 ); //default; light shining from top
            light2.castShadow = true; // default false
            scene.add( light2 );
            
            //Set up shadow properties for the light
            light2.shadow.mapSize.width = 512; // default
            light2.shadow.mapSize.height = 512; // default
            light2.shadow.camera.near = 0.5; // default
            light2.shadow.camera.far = 500; // default

            camera.position.x = 30;
            camera.position.y = 0;
            camera.position.z = 0;

            let controls = new TrackballControls(camera, renderer.domElement);
            // controls.rotateSpeed = 1.0;
            // controls.zoomSpeed = 1.2;
            // controls.panSpeed = 0.8;
            // controls.noZoom = false;
            // controls.noPan = false;
            // controls.staticMoving = true;
            // controls.dynamicDampingFactor = 0.3;

            controls.update();

            let animate = () => {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            };
            animate();

            this.scene = scene;
            this.cylinderGeometry = cylinderGeometry;

        }

        let show = () => {

            let material1 = new THREE.MeshStandardMaterial({color: 0x7e31eb});
            let material2 = new THREE.MeshStandardMaterial({color: 0x317eeb});
            let material3 = new THREE.MeshStandardMaterial({color: 0x119e4b});
            let material4 = new THREE.MeshStandardMaterial({color: 0xeeeeee});


            let createRotaryA = () => {
                let group = new THREE.Group();
                
                let cube3 = new THREE.Mesh(geometry, material2);
                translateCoord(cube3, {x: 0.75 +co.x, y: 1.5 +co.y, z: -0.5}, {x: 2, y: 2, z: 3});
                cube3.castShadow = true;
                cube3.receiveShadow = true;
                group.add(cube3);
    
                let cylinder2 = new THREE.Mesh(cylinderGeometry, material2);
                cylinder2.rotation.z = Math.PI/2;
                translateCoord(cylinder2, {x: 0.75, y: 0.2, z: 1}, {x: 2, y: 2, z: 0.5});
                group.add(cylinder2);

                let cylinder3 = new THREE.Mesh(cylinderGeometry, material3);
                cylinder3.rotation.z = Math.PI/2;
                translateCoord(cylinder3, {x: 0.75, y: 2.7, z: 1}, {x: 2, y: 2, z: 0.5});
                group.add(cylinder3);
    
                let mill = new THREE.Mesh(cylinderGeometry, material4);
                translateCoord(mill, {x: 1.75-this.equipmentWidth/2 +co.x, y: 2.5-this.equipmentWidth/2 +co.y, z: -this.equipmentLength}, {x: this.equipmentWidth, y: this.equipmentWidth, z: this.equipmentLength});
                group.add(mill);
                this.mill = mill;
    
                return group;
            }

            let createRotaryC = () => {
                let group = new THREE.Group();

                let cube = new THREE.Mesh(geometry, material1);
                translateCoord(cube, {x: 0, y: 0, z: 0}, {x: 3.5, y: 1, z: 5.5});
                cube.castShadow = true;
                cube.receiveShadow = true;
                group.add(cube);

                let cube2 = new THREE.Mesh(geometry, material1);
                translateCoord(cube2, {x: 0, y: 1, z: 3.5}, {x: 3.5, y: 2.5, z: 2});
                cube2.castShadow = true;
                cube2.receiveShadow = true;
                group.add(cube2);
    
                let cylinder = new THREE.Mesh( cylinderGeometry, material1 );
                translateCoord(cylinder, {x: 0.75, y: 1.5, z: 5.5}, {x: 2, y: 2, z: 0.5});
                group.add(cylinder);
    
                return group;
            }

            let createHead = () => {
                let groupA = createRotaryA();
                let groupC = createRotaryC();

                let pivotA = new THREE.Group();
                pivotA.position.set(0, 1.25, 1.75);
                groupA.position.set(0, -1.25, -1.75);
                pivotA.add(groupA);
                
                let pivotC = new THREE.Group();
                pivotC.position.set(2.5, 0, 1.75);
                groupC.position.set(-2.5, 0, -1.75);
                pivotC.add(groupC);

                groupC.add(pivotA);

                let head = new THREE.Group();
                // head.position.set(0, 0, 0);
                head.position.set(-co.y, 0, -co.x);
                head.add(pivotC);
                scene.add(head);
    
                this.rotaryA = pivotA;
                this.rotaryC = pivotC;
                this.head = head;
            }

            createHead();

        }

        let translateCoord = (obj, point3d, size) => {
            let position = {
                x: point3d.y + size.y/2,
                y: point3d.z + size.z/2,
                z: point3d.x + size.x/2
            };
            let scale = {
                x: size.y,
                y: size.z,
                z: size.x
            };

            obj.position.x = position.x;
            obj.position.y = position.y;
            obj.position.z = position.z;
            obj.scale.x = scale.x;
            obj.scale.y = scale.y;
            obj.scale.z = scale.z;
        }
        this.translateCoord = translateCoord;

        let createBlank = () => {
            let material1 = new THREE.MeshStandardMaterial({color: 0x666666});
            let mesh = new THREE.Mesh(geometry, material1);
            translateCoord(mesh, {x: -4, y: -4, z: -2-this.equipmentLength+0.5}, {x: 8, y: 8, z: 2});
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            // material1.wireframe = true;
            scene.add(mesh);
            this.blankMesh = mesh;
        }

        let parseReady = () => {
            let posInfo = renderer.domElement.getBoundingClientRect();
            if(posInfo.width === 0 && posInfo.height === 0){
                window.setTimeout(parseReady, 100);
                return;
            }

            init();
            show();
            // createBlank();
        }

        window.setTimeout(parseReady, 100);

    }

    cutBlank(){
        let scene = this.scene;
        let cylinderGeometry = this.cylinderGeometry;

        let material4 = new THREE.MeshStandardMaterial({color: 0xff0000});
        let millCut = new THREE.Mesh(cylinderGeometry, material4);
        this.translateCoord(millCut, 
            {
                x: 1.75-this.equipmentWidth/2 +this.co.x + this.props.X, 
                y: 2.5-this.equipmentWidth/2 +this.co.y + this.props.Y, 
                z: -this.equipmentLength + this.props.Z
            }, {
                x: this.equipmentWidth, 
                y: this.equipmentWidth, 
                z: this.equipmentLength
            }
        );

        let position = new THREE.Vector3();
        let quaternion = new THREE.Quaternion();
        this.mill.getWorldPosition(position);
        this.mill.getWorldQuaternion(quaternion);
        millCut.position.copy(position);
        millCut.rotation.setFromQuaternion(quaternion);

        this.blankMesh.updateMatrix();
        millCut.updateMatrix();

        let subRes = CSG.subtract(this.blankMesh, millCut);
        // subRes.updateMatrix();

        scene.remove(this.blankMesh);
        this.blankMesh = subRes;
        scene.add(this.blankMesh);

    }

    handleCutBtnClick(event){
        this.cutBlank();
    }

    componentWillUpdate(props){

    }

    render(){

        if(this.head !== null){

            let aa = this.props.A;
            let ac = this.props.C;
            let rh = this.equipmentLength +1.3;

            const { sin, cos, atan2, sqrt, PI } = Math;

            let aa2 = aa *PI/180;
            let ac2 = ac *PI/180;

            let co = this.co;

            let tx = -co.x;
            let ty = -co.y;
            let tz = -this.equipmentLength -1.3;


            const rotX = (point, angle) => {
                let x = point.x;
                let y = point.y*cos(angle) - point.z*sin(angle);
                let z = point.z*sin(angle) + point.z*cos(angle);
                return {x, y, z};
            }

            const rotY = (point, angle) => {
                let x =  point.x*cos(angle) + point.z*sin(angle);
                let y =  point.y;
                let z = -point.x*sin(angle) + point.z*cos(angle);
                return {x, y, z};
            }

            const rotZ = (point, angle) => {
                let x = point.x*cos(angle) - point.y*sin(angle);
                let y = point.x*sin(angle) + point.y*cos(angle);
                let z = point.z;
                return {x, y, z};
            }

            let point = {x: co.x, y: co.y, z: -rh};
            point = rotY(point, aa2);
            point = rotZ(point, ac2);

            let dx = tx - point.x;
            let dy = ty - point.y;
            let dz = tz - point.z;
            // dx = dy = dz = 0;

            let x = this.props.X + dx;
            let y = this.props.Y + dy;
            let z = this.props.Z + dz;

            this.head.position.set(y, z, x);

            this.rotaryA.rotation.x = this.props.A *Math.PI/180;
            this.rotaryC.rotation.y = this.props.C *Math.PI/180;

            // this.cutBlank();
        }

        return (
            <div>
                <div ref={ref => (this.mount = ref)} />
                {/* <button onClick={e => this.handleCutBtnClick(e)}>Cut</button> */}
            </div>
        );
    }

}

Simulation.defaultProps = {
    X: 0,
    Y: 0,
    Z: 0,
    A: 0,
    B: 0,
    C: 0
};

export default Simulation;
