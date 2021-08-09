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


function SimulateScene(){

    let screenWidth = 500;
    let screenHeight = 500;

    let props = {};

    let material1 = null, material2 = null, material3 = null, material4 = null;

    let rotaryA = null;
    let rotaryC = null;

    let head = null;

    let co = {x: 0, y: 0};          // смещение от центра

    let equipmentLength = 5.7;
    let equipmentWidth = 0.3;

    let mount = null;
    let renderer = null;
    let scene = null;
    let geometry = null;
    let cylinderGeometry = null;
    let mill = null;
    let blankMesh = null;

    const initRenderer = () => {
        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(screenWidth, screenHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

        mount.appendChild(renderer.domElement);
    };

    const initMaterials = () => {
        material1 = new THREE.MeshStandardMaterial({color: 0x7e31eb});
        material2 = new THREE.MeshStandardMaterial({color: 0x317eeb});
        material3 = new THREE.MeshStandardMaterial({color: 0x119e4b});
        material4 = new THREE.MeshStandardMaterial({color: 0xeeeeee});

    };

    const init = () => {
        // initRender();
        initMaterials();

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

    };

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

        mill = new THREE.Mesh(cylinderGeometry, material4);
        translateCoord(mill, {x: 1.75-equipmentWidth/2 +co.x, y: 2.5-equipmentWidth/2 +co.y, z: -equipmentLength}, {x: equipmentWidth, y: equipmentWidth, z: equipmentLength});
        group.add(mill);

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

        head = new THREE.Group();
        head.position.set(-co.y, 0, -co.x);
        head.add(pivotC);
        scene.add(head);

        rotaryA = pivotA;
        rotaryC = pivotC;
    }

    const translateCoord = (obj, point3d, size) => {
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

    const createBlank = () => {
        let material1 = new THREE.MeshStandardMaterial({color: 0x666666});
        let mesh = new THREE.Mesh(geometry, material1);
        translateCoord(mesh, {x: -4, y: -4, z: -2-equipmentLength+0.5}, {x: 8, y: 8, z: 2});
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // material1.wireframe = true;
        scene.add(mesh);
        blankMesh = mesh;
    }

    const cutBlank = () => {

        let material4 = new THREE.MeshStandardMaterial({color: 0xff0000});
        let millCut = new THREE.Mesh(cylinderGeometry, material4);
        translateCoord(millCut, 
            {
                x: 1.75-equipmentWidth/2 +co.x + props.X, 
                y: 2.5-equipmentWidth/2 +co.y + props.Y, 
                z: -equipmentLength + props.Z
            }, {
                x: equipmentWidth, 
                y: equipmentWidth, 
                z: equipmentLength
            }
        );

        let position = new THREE.Vector3();
        let quaternion = new THREE.Quaternion();
        mill.getWorldPosition(position);
        mill.getWorldQuaternion(quaternion);
        millCut.position.copy(position);
        millCut.rotation.setFromQuaternion(quaternion);

        blankMesh.updateMatrix();
        millCut.updateMatrix();

        let subRes = CSG.subtract(this.blankMesh, millCut);
        // subRes.updateMatrix();

        scene.remove(blankMesh);
        blankMesh = subRes;
        scene.add(blankMesh);
        
    };


    const show = () => {

        createHead();

    };

    const render = () => {

        if(head !== null){

            let aa = props.A;
            let ac = props.C;
            let rh = equipmentLength +1.3;

            const { sin, cos, atan2, sqrt, PI } = Math;

            let aa2 = aa *PI/180;
            let ac2 = ac *PI/180;

            let tx = 0;
            let ty = 0;
            let tz = -equipmentLength -1.3;


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

            let x = props.X + dx;
            let y = props.Y + dy;
            let z = props.Z + dz;

            head.position.set(y, z, x);

            rotaryA.rotation.x = props.A *Math.PI/180;
            rotaryC.rotation.y = props.C *Math.PI/180;

            // cutBlank();
        }        
    };

    const getRenderer = () => {
        return renderer;
    };

    const setMount = (m) => {
        mount = m;
    };

    const setProps = (p) => {
        props = p;
    };

    /**
     * Обновление объекта подвижной головы
     */
    const updateHead = () => {
        if(scene === null) return;

        if(head !== null){
            scene.remove(head);
        }

        createHead();
        render();
    }

    /**
     * Установка смещения от центра
     */
    const setCenterOffset = (sco) => {
        co = sco;
        updateHead();
    };

    /**
     * Установка длины инструмента
     * @param {numeric} value длина инструмента
     */
    const setEquipmentLength = (value) => {
        equipmentLength = value;
        updateHead();
    }

    /**
     * Установка ширины (диаметра) инструмента
     * @param {numeric} value ширина инструмента
     */
     const setEquipmentWidth = (value) => {
        equipmentWidth = value;
        updateHead();
    }

    return {
        init, show, initRenderer, getRenderer, render, setMount, setProps, 
        setCenterOffset,
        setEquipmentLength, setEquipmentWidth,
    };
};


/**
 * Симулятор
 */
 class Simulation extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

        this.state = {

        }

        this.simutateScene = new SimulateScene(props);

    }

    componentDidMount(){

        const ss = this.simutateScene;
        ss.initRenderer();

        let parseReady = () => {

            let renderer = ss.getRenderer();
            let posInfo = renderer.domElement.getBoundingClientRect();
            if(posInfo.width === 0 && posInfo.height === 0){
                window.setTimeout(parseReady, 100);
                return;
            }

            ss.init();
            ss.show();
            // ss.createBlank();
        }

        window.setTimeout(parseReady, 100);

    }

    handleCutBtnClick(event){
        const ss = this.simutateScene;
        ss.cutBlank();
    }

    componentWillUpdate(props){

    }

    componentDidUpdate(prevProps){
        // console.log('componentDidUpdate', JSON.stringify(this.props.co), JSON.stringify(prevProps.co), JSON.stringify(this.props.coX), JSON.stringify(prevProps.coX));
        const ss = this.simutateScene;
        if( 
            (JSON.stringify(this.props.coX) !== JSON.stringify(prevProps.coX)) ||
            (JSON.stringify(this.props.coY) !== JSON.stringify(prevProps.coY)) 
        ){
            ss.setCenterOffset({x: this.props.coX, y: this.props.coY});            
        }

        if( (JSON.stringify(this.props.equipmentLength) !== JSON.stringify(prevProps.equipmentLength)) ){
            ss.setEquipmentLength(this.props.equipmentLength);
        }

        if( (JSON.stringify(this.props.equipmentWidth) !== JSON.stringify(prevProps.equipmentWidth)) ){
            ss.setEquipmentWidth(this.props.equipmentWidth);
        }
        
    }

    render(){

        const ss = this.simutateScene;
        ss.setProps(this.props);
        ss.render();

        return (
            <div>
                <div ref={ref => (ss.setMount(ref))} />
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
    C: 0,
    coX: 0,             // center offset X
    coY: 0,             // center offset Y
    equipmentLength: 1,
    equipmentWidth: 1,
};

export default Simulation;
