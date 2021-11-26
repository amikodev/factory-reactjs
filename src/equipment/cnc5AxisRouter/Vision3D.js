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


import * as THREE from 'three';
import TrackballControls from 'three-trackballcontrols';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSG } from 'three-csg-ts';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

import createWorker from 'offscreen-canvas/create-worker';
import insideWorker from 'offscreen-canvas/inside-worker';

import ModelMill1 from './models/mills/mill1.stl';
import ModelMill2 from './models/mills/mill2.stl';
import ModelMill from './models/mills/mill6.obj';

// import TestStlModel from '../../Dva_topora.stl';
import TestStlModel from '../../rozetka_2.stl';

import GCode from '../../gcode/GCode';
import { 
    FRAME_TYPE_MOVE_LINE_FAST, FRAME_TYPE_MOVE_LINE_WORK,
    FRAME_TYPE_MOVE_CIRCLE_CW, FRAME_TYPE_MOVE_CIRCLE_CCW,
    FRAME_TYPE_PAUSE,
 } from '../../gcode/GCode';

import { MoveHelper, MoveRotateHelper } from './MoveRotateHelper';
import { TYPE_PLANE, TYPE_LINE, TYPE_CONE } from './MoveRotateHelper';  
import { rotX, rotY, rotZ } from './MoveRotateHelper';  

import CamModule from './cam/CamModule';
// import {
//     INITIAL_BLANK_TYPE_PLANE, INITIAL_BLANK_TYPE_BOX, INITIAL_BLANK_TYPE_CYLINDER,
// } from './cam/InitialBlank';

// import InitialBlankTS from './cam/InitialBlank.ts';
// import { Type as BlankTypeTS } from './cam/InitialBlank.ts';

import ScanDepth from './cam/ScanDepth';
 
import { withStyles } from '@material-ui/core/styles';
import Equipments from '../../Equipments';
import { TrendingUpOutlined } from '@material-ui/icons';

const useStyles = theme => ({
    root: {
        // float: 'left',
        '& canvas': {
            border: '1px #BBB solid',

        }
    }
});

const zeroPoint = {x: 0, y: 0, z: 0, a: 0, b: 0, c: 0};
const zeroPoint3D = {x: 0, y: 0, z: 0};
const zeroPointABC = {a: 0, b: 0, c: 0};


function VisionScene(){

    let screenWidth = 500;
    let screenHeight = 500;

    let props = {};

    let material1 = null, material2 = null, material3 = null, material4 = null;
    let materialLine = null, materialLineDashed = null;
    let materialLineSelected1 = null, materialLineSelected2 = null;
    let materialUserSelected = null;

    let animateEnabled = true;

    let head = null;                // голова станка

    let groupA = null;

    let rotaryA = null;             // наклонная ось A
    let rotaryC = null;             // поворотная ось C

    let co = {x: 0, y: 0};          // смещение от центра

    let equipmentLength = 57;       // длина инструмента
    let equipmentWidth = 3;         // ширина (диаметр) инструмента
    let equipmentNumber = 0;        // номер инструмента
    let millItems = [];

    let mount = null;
    let camera = null;
    let controls = null;
    let target = null;
    let renderer = null;
    let scene = null;
    let geometry = null;
    let cylinderGeometry = null;
    let mill = null;
    let blankMesh = null;
    let plane = null;
    let intersectObjects = [];

    let userSelectedGroup = null;

    let rollOverMesh, rollOverMaterial;

    let gcodeGroup = null;

    let userZeroMh1 = null;                 // MoveHelper пользовательского нуля
    let userZeroMh2 = null;                 // MoveHelper пользовательского нуля

    let controlsEnabled = true;
    let controlsStarted = false;

    const gc = new GCode();

    const camModule = new CamModule();
    let camModuleInited = false;
    let funcCamModuleReady = null;


    const _this = this;

    /**
     * Инициализация renderer
     */
    const initRenderer = () => {

        renderer = new THREE.WebGLRenderer({
            // alpha: true,
            // context: gl,
            // preserveDrawingBuffer: true,
        });
        renderer.setSize(screenWidth, screenHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        target = new THREE.WebGLRenderTarget(screenWidth, screenHeight);
        
        mount.appendChild(renderer.domElement);
    };

    /**
     * Инициализация материалов
     */
    const initMaterials = () => {

        material1 = new THREE.MeshStandardMaterial({color: 0x7e31eb, side: THREE.DoubleSide});
        material2 = new THREE.MeshStandardMaterial({color: 0x317eeb});
        material3 = new THREE.MeshStandardMaterial({color: 0x119e4b});
        material4 = new THREE.MeshStandardMaterial({color: 0xeeeeee});

        materialLine = new THREE.LineBasicMaterial({
            color: 0x444444,
        });

        materialLineDashed = new THREE.LineDashedMaterial({
            color: 0x666666,
            dashSize: 4,
            gapSize: 4,
        });

        materialLineSelected1 = new THREE.LineBasicMaterial({
            color: 0xFF0000,
        });

        materialLineSelected2 = new THREE.LineBasicMaterial({
            color: 0xFF8000,
        });

        materialUserSelected = new THREE.LineBasicMaterial({
            color: 0xDD8800,
        });

    };

    /**
     * Начать обработку вращения OrbitControls
     */
    const controlsStart = () => {
        controlsStarted = true;
        if(camModuleInited){
            const mouseEvents = camModule.getMouseEvents();
            mouseEvents.setEnabled(false);
        }
    }

    /**
     * Закончить обработку вращения OrbitControls
     */
    const controlsEnd = () => {
        controlsStarted = false;
        if(camModuleInited){
            const mouseEvents = camModule.getMouseEvents();
            mouseEvents.setEnabled(true);
        }
    }


    // let t = new Date().getTime();

    /**
     * Включить/выключить анимацию 3D
     * @param boolean enabled флаг включения
     */
    const setAnimateEnabled = (enabled) => {
        if(!animateEnabled && enabled){
            animateEnabled = enabled;
            animate();
        }
        animateEnabled = enabled;
    }

    /**
     * Анимация 3D
     */
    const animate = () => {
        if(animateEnabled){
            requestAnimationFrame(animate);
        }

        if(controls === null) return;

        controls.update();

        if(mill !== null){
            mill.rotation.z -= 0.10;
        }

        // console.log('animate', t, 'animateEnabled', animateEnabled);

        renderer.render(scene, camera);
    };


    /**
     * Инициализация
     */
    const init = () => {

        initMaterials();

        scene = new THREE.Scene();

        scene.background = new THREE.Color(0xFFFFFF);
        // scene.background = new THREE.Color(0x000000);
        scene.rotateY(-Math.PI/2);
        scene.rotateX(-Math.PI/2);

        // scene.overrideMaterial = new THREE.MeshDepthMaterial();

        // camera = new THREE.PerspectiveCamera(75, screenWidth/screenHeight, 0.1, 1000);
        let cs = 200;
        let ratio = screenWidth/screenHeight;
        // camera = new THREE.OrthographicCamera(-cs*ratio, cs*ratio, cs, -cs, 0.1, 10000);

        camera = new THREE.OrthographicCamera(-cs*ratio, cs*ratio, cs, -cs, 0, 20000);

        geometry = new THREE.BoxGeometry(1, 1, 1);
        cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        cylinderGeometry.rotateX(Math.PI/2);

        const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
        scene.add(light);

        const light2 = new THREE.DirectionalLight(0xffffff, 0.4, 100);
        // light2.position.set(60, 120, 20); //default; light shining from top
        light2.position.set(20, 60, 120); //default; light shining from top
        light2.castShadow = true; // default false
        scene.add(light2);
        
        //Set up shadow properties for the light
        light2.shadow.mapSize.width = 512; // default
        light2.shadow.mapSize.height = 512; // default
        light2.shadow.camera.near = 0.5; // default
        light2.shadow.camera.far = 500; // default

        // camera.position.set(-0.0001, 100, 0);
        // camera.position.set(0, cMax, 0);
        // camera.rotation.set(0, Math.PI, 0);
        camera.position.set(-0.0001, 10000, 0);
        // camera.position.set(0, 100, 0);
        // camera.position.set(150, 200, 0);
        // camera.updateProjectionMatrix();

        const gridHelper = new THREE.GridHelper(1000, 10);
        gridHelper.rotateX(Math.PI/2);
        scene.add(gridHelper);

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();

		const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
        planeGeometry.rotateX(-Math.PI/2);

        plane = new THREE.Mesh(planeGeometry, new THREE.MeshBasicMaterial( {color: 0x7e31eb, visible: false } ));
        plane.name = 'plane';
        scene.add(plane);


        const rollOverGeo = new THREE.SphereGeometry(10, 8, 8);
        rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
        rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
        // scene.add(rollOverMesh);


        controls = new OrbitControls(camera, renderer.domElement);

        controls.addEventListener('start', () => {
            if(!controls.enabled) return;
            controlsStart();
        });
        controls.addEventListener('end', () => {
            if(!controls.enabled) return;
            controlsEnd();
        });


        intersectObjects = [];


        let helpers = [];

        const calcIntersectObjects = () => {
            intersectObjects = [];
            intersectObjects.push(plane);
    
            helpers.map(helper => {
                intersectObjects.push(...helper.getIntersectObjects());
            });
    
        }

        calcIntersectObjects();


        MoveRotateHelper.prototype.onCreate = (helper) => {
            // helper
            helpers.push(helper);
            calcIntersectObjects();
        }

        MoveRotateHelper.prototype.onRemove = (helper) => {

            let parent = scene;
            if(helper.getGroup().parent !== null){
                parent = helper.getGroup().parent;
            }
            // scene.remove(helper.getGroup());

            // helper.getGroup().parent.remove(helper.getGroup());
            parent.remove(helper.getGroup());

            helpers = helpers.filter(h => h.uuid !== helper.uuid);
            calcIntersectObjects();
        }
        


        let mh1LastPoint = {x: 100, y: 100, z: 0};
        let mh1 = userZeroMh1 = new MoveHelper(Object.assign({}, zeroPoint3D, mh1LastPoint), 25, 10);
        let mh1Group = mh1.getGroup();
        scene.add(mh1Group);
        
        mh1.onChange((point) => {
            let p1 = point;
            let p2 = mh2.getPoint();
            p2.x += point.x - mh1LastPoint.x;
            p2.y += point.y - mh1LastPoint.y;
            p2.z += point.z - mh1LastPoint.z;
            mh2.setPoint(p2);

            let dt = {
                x: p2.x - p1.x,
                y: p2.y - p1.y,
                z: p2.z - p1.z
            };
            let length = Math.sqrt( dt.x*dt.x + dt.y*dt.y + dt.z*dt.z );
            let length2 = Math.sqrt( dt.x*dt.x + dt.y*dt.y );

            let aa2 = Math.atan2(length2, dt.z);
            let aa = aa2 * 180/Math.PI;

            let ac2 = Math.atan2(dt.y, dt.x);
            let ac = ac2 * 180/Math.PI;
            ac += 90;

            let p3dABC = Object.assign({}, zeroPoint, p1, {a: aa, c: ac});

            if(typeof props.onChangePointSelected === 'function'){
                props.onChangePointSelected(p3dABC, length);
            }

            mh1LastPoint = Object.assign({}, zeroPoint3D, point);
        });
        mh1.onCenterClick(() => {
            let visible = mh1.getAxesVisible();
            userZeroMh2.setVisible(visible);
        });


        let mh2 = userZeroMh2 = new MoveHelper(Object.assign({}, zeroPoint3D, mh1.getPoint(), {z: 100}), 15, 7);
        mh2.setVisible(false);
        let mh2Group = mh2.getGroup();
        scene.add(mh2Group);
        mh2.onChange((point) => {
            let p1 = mh1.getPoint();
            let p2 = point;

            let dt = {
                x: p2.x - p1.x,
                y: p2.y - p1.y,
                z: p2.z - p1.z
            };
            let length = Math.sqrt( dt.x*dt.x + dt.y*dt.y + dt.z*dt.z );
            let length2 = Math.sqrt( dt.x*dt.x + dt.y*dt.y );

            let aa2 = Math.atan2(length2, dt.z);
            let aa = aa2 * 180/Math.PI;

            let ac2 = Math.atan2(dt.y, dt.x);
            let ac = ac2 * 180/Math.PI;
            ac += 90;

            let p3dABC = Object.assign({}, zeroPoint, p1, {a: aa, c: ac});

            if(typeof props.onChangePointSelected === 'function'){
                props.onChangePointSelected(p3dABC, length);
            }
        });

        // // test helper for DEVELOP !!!
        // let mh3 = new MoveRotateHelper(
        //     Object.assign({}, zeroPoint3D, {x: 80, y: 50, z: 0}), 
        //     Object.assign({}, zeroPointABC, {a: 0, b: 0, c: 0}), 
        //     35, 
        //     13
        // );
        // mh3.setAxesVisible(true);
        // mh3.setRotateVisible(true);
        // mh3.setVisible(true);
        // let mh3Group = mh3.getGroup();
        // mh3Group.position.set(25, 13, 17.5);
        // scene.add(mh3Group);

        // console.log( MoveRotateHelper.prototype );

        

        let linesSelected1 = [];            // { object, material }
        let linesSelected2 = [];            // { object, material }
        
        const addMouseListener = (eventName) => {
            const funcNames = {
                'click': 'pointerClick',
                'mousedown': 'pointerDown',
                'mouseup': 'pointerUp',
                'pointermove': 'pointerMove',
            };
            const funcName = funcNames[eventName];

            renderer.domElement.addEventListener(eventName,  event => {
                if(controlsStarted && eventName === 'mouseup'){
                    // OrbitControls перестал работать
                    controlsEnd();
                } else if(controlsStarted && eventName === 'mousedown' && !controls.enabled){
                    controlsEnd();
                }

                if(controlsStarted) return;     // не обрабатываем события мыши при работающем OrbitControls
                // console.log('event', eventName, intersectObjects);
                
                pointer.set( ( event.offsetX / screenWidth ) * 2 - 1, - ( event.offsetY / screenHeight ) * 2 + 1 );
                raycaster.setFromCamera(pointer, camera);
                const intersects = raycaster.intersectObjects(intersectObjects);
    
                let listIntersects = {};
                helpers.map(helper => {
                    listIntersects[helper.uuid] = {helper, helperIntersects: []};
                });
            
                if(intersects.length > 0){
                    intersects.map(intersect => {
                        let { object } = intersect;
                        if(object.name === 'MoveHelper'){
                            let context = object.userData.context;
                            if(typeof listIntersects[context.uuid] !== "undefined"){
                                listIntersects[context.uuid].helperIntersects.push(intersect);
                            }
                            return;
                        }
                    });
                }
    
                Object.keys(listIntersects).map(helperID => {
                    let { helper, helperIntersects } = listIntersects[helperID];
                    if(helperIntersects.length > 0){
                        helper[funcName](event, helperIntersects);
                    }
                });
            });    
        }



        renderer.domElement.addEventListener('mousedown', event => {
            pointer.set( ( event.offsetX / screenWidth ) * 2 - 1, - ( event.offsetY / screenHeight ) * 2 + 1 );
            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObjects(intersectObjects);

            if(intersects.length > 0){
                intersects.map(intersect => {
                    let { object } = intersect;
                    if(object.name === 'MoveHelper'){
                        if(object.userData.type !== TYPE_PLANE){
                            if(controlsEnabled){
                                controls.enabled = false;
                                controls.saveState();
                                return;
                            }
                        }
                    }
                });
            }
        });
        
        renderer.domElement.addEventListener('mouseup', event => {
            pointer.set( ( event.offsetX / screenWidth ) * 2 - 1, - ( event.offsetY / screenHeight ) * 2 + 1 );
            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObjects(intersectObjects);

            if(intersects.length > 0){
                intersects.map(intersect => {
                    let { object } = intersect;
                });
            }

            if(controlsEnabled){
                controls.enabled = true;
                controls.reset();
            }
        });

        renderer.domElement.addEventListener('pointermove', event => {
            // console.log('pointermove', event.offsetX, screenWidth);
            pointer.set( ( event.offsetX / screenWidth ) * 2 - 1, - ( event.offsetY / screenHeight ) * 2 + 1 );
            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObjects(intersectObjects);

            linesSelected1.map(selLine => {
                selLine.object.material = selLine.material;
            });
            linesSelected1 = [];

            controls.saveState();

            let listIntersects = {};
            helpers.map(helper => {
                listIntersects[helper.uuid] = {helper, helperIntersects: []};
            });
        
            let distObjects = {};        // distance to object
            if(intersects.length > 0){
                intersects.map(intersect => {
                    let { object } = intersect;
                    if(object === plane){
                        let point = intersect.point;
                        rollOverMesh.position.copy(point).add(intersect.face.normal);
                        // planePoint = point;
                    // } else if(object === mh1Group){
                    //     console.log(object);
                    }

                    if(object.name === ''){
                        if(object.type === 'Line' || object.type === 'Arc'){
                            distObjects[intersect.distance] = object;
                        }
                    }
                });
                if(Object.keys(distObjects).length > 0){
                    let minDist = Math.min(...Object.keys(distObjects));
                    let object = distObjects[minDist];
                    linesSelected1.push({object, material: object.material});
                    object.material = materialLineSelected1;
                }
            }
        });

        renderer.domElement.addEventListener('click',  event => {
            pointer.set( ( event.offsetX / screenWidth ) * 2 - 1, - ( event.offsetY / screenHeight ) * 2 + 1 );
            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObjects(intersectObjects);
            // console.log(( event.offsetX / screenWidth ) * 2 - 1, - ( event.offsetY / screenHeight ) * 2 + 1 );
            // console.log(event.offsetX, event.offsetY, {pointer, camera, intersects});

            // intersects.map(intersect => {
            //     let {object, point} = intersect;
            //     point = { x: point.z-17.5, y: point.x-25, z: point.y-13 };
            //     // ps.push(point);

            //     if(object.name === 'STL object'){
            //         console.log('click', intersect, point);

            //     }

            // });


            if(linesSelected1.length > 0){
                let { object } = linesSelected1[0];

                let points = [];

                let positions = object.geometry.attributes["position"].array;
                let ptCout = positions.length / 3;
                for (let i = 0; i < ptCout; i++){
                    let p = new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
                    let point = {x: p.z, y: p.x, z: p.y};
                    points.push(point);
                }

                if(typeof props.onSelectSegment === "function"){
                    props.onSelectSegment(event, points);
                }
            }


            // renderer.render(scene, camera);
            
            // let gl = renderer.getContext();
            // var pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
            // gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

            // let w = gl.drawingBufferWidth;
            // let h = gl.drawingBufferHeight;
            
            // let pos = ((h-event.offsetY)*w + event.offsetX) * 4;
            // let r = pixels[pos+0];
            // let g = pixels[pos+1];
            // let b = pixels[pos+2];
            // let a = pixels[pos+3];

            // console.log(event.offsetX, event.offsetY, pos, {r, g, b, a});

        });


        addMouseListener('click');
        addMouseListener('mousedown');
        addMouseListener('mouseup');
        addMouseListener('pointermove');


        animate();



        // const canvasw = document.createElement('canvas');
        // canvasw.width = 500;
        // canvasw.height = 500;
        // canvasw.style = 'display: none;';
        // document.body.appendChild(canvasw);

        // // const sd = new ScanDepth();
        // // sd.runWorker(canvasw);

        // camModule.loadSTLModel('rozetka_2.stl', (group, boundSize) => {
        //     // console.log(group);
        //     scene.add(group);
        //     renderer.render(scene, camera);

        //     const geometry = group.children[0].geometry;

        //     const sd = new ScanDepth();
        //     sd.runWorker(canvasw);
        //     // sd.setGeometry(geometry.clone());
        //     sd.setGeometry(geometry);
    

        // });



        return;
        // сканирование высоты поверхности
        (() => {

            const materialDepthRGBA = new THREE.MeshDepthMaterial( {
                // depthPacking: THREE.RGBADepthPacking,
                depthPacking: THREE.BasicDepthPacking,

                // displacementMap: displacementMap,
                // displacementScale: SCALE,
                // displacementBias: BIAS,

                // side: THREE.DoubleSide
            } );


            let cs = 200;
            let ratio = screenWidth/screenHeight;
            const camera2 = new THREE.OrthographicCamera(-cs*ratio, cs*ratio, cs, -cs, 11, 10000);
            let controls2 = new OrbitControls(camera2, renderer.domElement);
            camera2.position.set(-0.0001, 300, 0);

            const raycaster = new THREE.Raycaster();
            const pointer = new THREE.Vector2();
    

            // let g = new THREE.BoxGeometry(40, 40, 40);
            // // let g = new THREE.CylinderGeometry(20, 20, 20, 32, 2);
            // let mesh1 = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color: 0xFF0000}));
            // let mesh2 = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color: 0x00FF00}));
            // let mesh3 = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color: 0x0000FF}));
            // // mesh.rotateX(Math.PI/2);


            // mesh1.position.set(0, 0, 0);
            // mesh2.position.set(50, 0, 0);
            // mesh3.position.set(-20, 50, 0);
            // scene.add(mesh1);
            // scene.add(mesh2);
            // scene.add(mesh3);

            // let g2 = new THREE.PlaneGeometry(80, 80, 4, 4);
            // let mesh2 = new THREE.Mesh(g2, material1);
            // mesh.position.set(0, 0, 20.5);
            // scene.add(mesh2);

            // let ic = 0;
            // window.setInterval(() => {
            //     if((ic++) % 2 == 0){
            //         mesh.material = materialDepthRGBA;
            //     } else{
            //         mesh.material = material3;
            //     }
            // }, 2000);


            // const sd = new ScanDepth();
            // sd.initThreeRenderer(canvasw);


            // camModule.loadSTLModel('rozetka_2.stl', (group, boundSize) => {
            //     // console.log(group);
            //     scene.add(group);
            //     renderer.render(scene, camera);
            // });

            return;
            const loader = new STLLoader();
            // loader.load(TestStlModel, geometry => {

            // loader.load('http://127.0.0.1:3003/models/1_2.stl', geometry => {
            // loader.load('http://127.0.0.1:3003/models/adres.stl', geometry => {
            // loader.load('http://127.0.0.1:3003/models/chick_crouching170782.stl', geometry => {
            // loader.load('http://127.0.0.1:3003/models/Svyatoe_Semeystvo_01.stl', geometry => {
            // loader.load('http://127.0.0.1:3003/models/ikona_026.stl', geometry => {

            // loader.load(TestStlModel, geometry => {
                
            // запуск Chrome для загрузки файлов с локальной директории
            // macos:   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security --user-data-dir=/Users/dmitriy/Projects/ReactJS/factory-management/
            // windows: Chrome.exe --disable-web-security
            loader.load('rozetka_2.stl', geometry => {
            // loader.load('http://127.0.0.1:3003/models/rozetka_2.stl', geometry => {
            // loader.load('http://127.0.0.1:3003/models/Nardy_boxyor.stl', geometry => {
            // loader.load('http://127.0.0.1:3003/models/Dva_topora.stl', geometry => {
                geometry.computeBoundingBox();
                // geometry.rotateZ(Math.PI/2);
                let mesh = new THREE.Mesh(geometry, materialDepthRGBA);
                // let mesh = new THREE.Mesh(geometry, material1);

                let bb = geometry.boundingBox;
                let bbc = {
                    x: -(bb.max.x + bb.min.x)/2,
                    y: -(bb.max.y + bb.min.y)/2,
                    // z: -(bb.max.z + bb.min.z)/2 + (bb.max.z - bb.min.z)/2,
                    z: -bb.min.z,
                };
                mesh.position.set(bbc.x, bbc.y, bbc.z);
                mesh.name = 'STL object';
        
                const stlbbox = new THREE.BoxHelper(mesh, 0xFF0000);

                let gr = new THREE.Group();
                gr.add(mesh);
                // gr.add(stlbbox);
                // gr.rotateZ(Math.PI/2);

                // console.log(mesh);
                let scale = 1;
                let boundSize = { width: (bb.max.x-bb.min.x)*scale, height: (bb.max.y-bb.min.y)*scale, depth: (bb.max.z-bb.min.z)*scale };
                console.log(boundSize);
                gr.scale.set(scale, scale, scale);

                scene.add(gr);

                // controls2.update();
                // renderer.render(scene, camera2, target);
                renderer.render(scene, camera);
                // renderer.render(scene, camera2);


                // return;
                window.setTimeout(() => {

                    let ratio = screenWidth/screenHeight;
                    let cs = Math.max(boundSize.width/2/ratio, boundSize.height/2);

                    camera.left = -cs*ratio;
                    camera.right = cs*ratio;
                    camera.top = cs;
                    camera.bottom = -cs;

                    camera.far = boundSize.depth;
                    camera.position.set(-0.0001, boundSize.depth, 0);
                    // camera.position.set(0, boundSize.depth, 0);
                    camera.updateProjectionMatrix();

                    renderer.render(scene, camera);

                    // return;
                    (() => {

                        console.log(1);
                        let gl = renderer.getContext();

                        let w = gl.drawingBufferWidth;
                        let h = gl.drawingBufferHeight;
                        
                        var pixels = new Uint8Array(w * h * 4);
                        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            
                        let rMin = 255;
                        let rMax = 0;
                        let minPoint = {};
                        let maxPoint = {};
                        let pos = 0;
                        for(let j=h-1; j>=0; j--){
                            for(let i=0; i<w; i++){
                                let r = pixels[pos+0];
                                if(r != 0 && r < rMin){
                                    rMin = r;
                                    minPoint = {x: i, y: j};
                                } 
                                if(r > rMax){
                                    rMax = r;
                                    maxPoint = {x: i, y: j};
                                } 
                                pos += 4;
                            }
                        }
    
                        console.log({rMin, rMax, minPoint, maxPoint});
    
                        let calcMin = boundSize.depth/255*(rMin-0);
                        let calcMax = boundSize.depth/255*(rMax+0);

                        calcMin -= 0.01;
                        calcMax += 0.01;
    
                        console.log( {calcMin, calcMax} );
    
                        window.setTimeout(() => {
                            camera.far = calcMax - calcMin;
                            camera.position.set(-0.0001, calcMax, 0);
                            // camera.position.set(0, calcMax, 0);
                            camera.updateProjectionMatrix();
        
                            renderer.render(scene, camera);
    
                            let gl = renderer.getContext();
                            let pixels = new Uint8Array(w * h * 4);
                            gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                
                            let depthMap = new Uint8Array(w * h);
                            let pos0 = 0;
                            let pos1 = 0;
                            for(let j=h-1; j>=0; j--){
                                for(let i=0; i<w; i++){
                                    let r = pixels[pos0+0];
                                    let d = 0xFF - r;
                                    depthMap[pos1] = d;
                                    pos0 += 4;
                                    pos1++;
                                }
                            }

                            console.log({depthMap});
    
                        }, 2000);
                        // camera.far = calcMax - calcMin;
                        // camera.position.set(-0.0001, calcMax, 0);
    
    
                    })();
    

                }, 2000);


                // (() => {
                //     let gl = renderer.getContext();
                //     var pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
                //     gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        
                //     let w = gl.drawingBufferWidth;
                //     let h = gl.drawingBufferHeight;
                    
                //     let rMin = 255;
                //     let rMax = 0;
                //     let minPoint = {};
                //     let maxPoint = {};
                //     let pos = 0;
                //     for(let j=0; j<h; j++){
                //         for(let i=0; i<w; i++){
                //             let r = pixels[pos+0];
                //             if(r != 0 && r < rMin){
                //                 rMin = r;
                //                 minPoint = {x: i, y: h-j};
                //             } 
                //             if(r > rMax){
                //                 rMax = r;
                //                 maxPoint = {x: i, y: h-j};
                //             } 
                //             pos += 4;
                //         }
                //     }

                //     console.log({rMin, rMax, minPoint, maxPoint});

                //     let calcMin = 21/255*(rMin-0);
                //     let calcMax = 21/255*(rMax+0);

                //     console.log( {calcMin, calcMax} );

                //     window.setTimeout(() => {
                //         camera.far = calcMax - calcMin;
                //         camera.position.set(-0.0001, calcMax, 0);
                //         camera.updateProjectionMatrix();
    
                //         renderer.render(scene, camera);


                //     }, 2000);
                //     // camera.far = calcMax - calcMin;
                //     // camera.position.set(-0.0001, calcMax, 0);


                // })();

                // let pos = (event.offsetY*w + event.offsetX) * 4;
                // let r = pixels[pos+0];
                // let g = pixels[pos+1];
                // let b = pixels[pos+2];
                // let a = pixels[pos+3];
    
                // console.log(event.offsetX, event.offsetY, pos, {r, g, b, a});

                

                // let ic = 0;
                // window.setInterval(() => {
                //     if((ic++) % 2 == 0){
                //         mesh.material = materialDepthRGBA;
                //     } else{
                //         mesh.material = material1;
                //     }
                // }, 3000);

                return;

                let intersectObjects2 = [];
                intersectObjects2.push(mesh);
                intersectObjects.push(mesh);

                let points3d = [];

                console.log('STL start calculate intersects ...');
        
                let scanX = screenWidth/2;
                let scanY = screenHeight/2;

                for(let i=0; i<5; i++){
                    scanX += 10;
                    // scanY 

                    pointer.set( ( scanX / screenWidth ) * 2 - 1, - ( scanY / screenHeight ) * 2 + 1 );
                    raycaster.setFromCamera(pointer, camera2);
                    const intersects = raycaster.intersectObjects(intersectObjects2);
                    // console.log('intersects', intersects);

                    console.log('STL intersects length', intersects.length);

                    if(intersects.length > 0){
                        const intersect = intersects[0];
                        let point = intersect.point;

                        point = { x: point.z, y: point.x, z: point.y };
                        // console.log({point});

                        points3d.push( new THREE.Vector3(point.x, point.y, point.z+0.5) );
                    }

                }

                const gl = new THREE.BufferGeometry().setFromPoints(points3d);
                const line = new THREE.Line(gl, materialLineSelected1);
                line.computeLineDistances();
                scene.add(line);

                console.log('STL done.');

            }, null, error => {
                console.log(error);
            });

        })();

    };

    let setMill = (obj) => {
        if(head === null) return;

        if(mill !== null){
            groupA.remove(mill);
        }
        let pos = {x: 17.5 +co.x, y: 25 +co.y, z: 0};
        obj.position.set(pos.x, pos.y, pos.z);

        mill = obj;
        groupA.add(mill);

    };

    let createRotaryA = () => {
        let group = new THREE.Group();

        let cube3 = new THREE.Mesh(geometry, material2);
        translateCoord(cube3, {x: 7.5 +co.x, y: 15 +co.y, z: -5}, {x: 20, y: 20, z: 30});
        cube3.castShadow = true;
        cube3.receiveShadow = true;
        group.add(cube3);

        let cylinder2 = new THREE.Mesh(cylinderGeometry, material2);
        cylinder2.rotation.x = Math.PI/2;
        translateCoord(cylinder2, {x: 7.5, y: 2, z: 10}, {x: 20, y: 20, z: 5});
        group.add(cylinder2);

        let cylinder3 = new THREE.Mesh(cylinderGeometry, material3);
        cylinder3.rotation.x = Math.PI/2;
        translateCoord(cylinder3, {x: 7.5, y: 27, z: 10}, {x: 20, y: 20, z: 5});
        group.add(cylinder3);

        if(mill !== null){
            let pos = {x: 17.5 +co.x , y: 25 +co.y, z: 0};
            mill.position.set(pos.x, pos.y, pos.z);
            group.add(mill);
        }

        return group;
    }

    let createRotaryC = () => {
        let group = new THREE.Group();

        let cube = new THREE.Mesh(geometry, material1);
        translateCoord(cube, {x: 0, y: 0, z: 0}, {x: 35, y: 10, z: 55});
        cube.castShadow = true;
        cube.receiveShadow = true;
        group.add(cube);

        let cube2 = new THREE.Mesh(geometry, material1);
        translateCoord(cube2, {x: 0, y: 10, z: 35}, {x: 35, y: 25, z: 20});
        cube2.castShadow = true;
        cube2.receiveShadow = true;
        group.add(cube2);

        let cylinder = new THREE.Mesh( cylinderGeometry, material1 );
        translateCoord(cylinder, {x: 7.5, y: 15, z: 55}, {x: 20, y: 20, z: 5});
        group.add(cylinder);

        return group;
    }

    let createHead = () => {
        groupA = createRotaryA();
        let groupC = createRotaryC();

        let pivotA = new THREE.Group();
        pivotA.position.set(17.5, 0, 12.5);
        groupA.position.set(-17.5, 0, -12.5);
        pivotA.add(groupA);
        
        let pivotC = new THREE.Group();
        pivotC.position.set(17.5, 25, 0);
        groupC.position.set(-17.5, -25, 0);
        pivotC.add(groupC);

        groupC.add(pivotA);

        let headInner = new THREE.Group();
        headInner.position.set(-17.5 -co.x, -25 -co.y, -13);
        headInner.add(pivotC);

        head = new THREE.Group();
        head.position.set(0, 0, 0);
        head.add(headInner);
        scene.add(head);

        rotaryA = pivotA;
        rotaryC = pivotC;
    }

    const translateCoord = (obj, point3d, size) => {
        let position = {
            x: point3d.x + size.x/2,
            y: point3d.y + size.y/2,
            z: point3d.z + size.z/2,
        };
        let scale = {
            x: size.x,
            y: size.y,
            z: size.z
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
        translateCoord(mesh, {x: -40, y: -40, z: -20-equipmentLength+5}, {x: 80, y: 80, z: 20});
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
                x: 17.5-equipmentWidth/2 +co.x + props.X, 
                y: 25-equipmentWidth/2 +co.y + props.Y, 
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
            let ac = props.C - 90;
            let rh = equipmentLength +13;

            let aa2 = aa *Math.PI/180;
            let ac2 = ac *Math.PI/180;

            let tx = 0;
            let ty = 0;
            let tz = 0;


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

            // head.position.set(y, z, x);
            head.position.set(x, y, z);

            // rotaryA.rotation.x = aa2;
            // rotaryC.rotation.y = ac2;
            rotaryA.rotation.y = aa2;
            rotaryC.rotation.z = ac2;

            // cutBlank();
        }        
    };

    // const getControls = () => {
    //     return controls;
    // }

    const setControlsEnabled = (enabled) => {
        controlsEnabled = enabled;
        if(enabled){
            controls.enabled = true;
            controls.reset();
        } else{
            controls.enabled = false;
            controls.saveState();
        }
    }

    const getRenderer = () => {
        return renderer;
    };

    const setMount = (m) => {
        mount = m;
    };

    const setProps = (p) => {
        props = p;
        screenWidth = props.width;
        screenHeight = props.height;
    };

    /**
     * Обновление объекта подвижной головы
     */
    const updateHead = () => {
        if(scene === null) return;

        if(head !== null){
            scene.remove(head);
        }

        if(props.showHead){
            createHead();
        }
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

    /**
     * Установка номера инструмента
     * @param {numeric} value номер инструмента
     */
    const setEquipmentNumber = (value) => {
        equipmentNumber = Number(value);

        if(equipmentNumber > millItems.length-1)
            return;

        let mesh = millItems[equipmentNumber].clone();

        // mesh.rotation.x = -Math.PI/2;

        mesh.geometry.computeBoundingBox();
        let bb = mesh.geometry.boundingBox;
        let bbn = {
            x: bb.max.x - bb.min.x,
            y: bb.max.y - bb.min.y,
            z: bb.max.z - bb.min.z
        };
        let bbc = {
            x: -(bb.max.x + bb.min.x)/2,
            y: -(bb.max.y + bb.min.y)/2,
            z: -(bb.max.z)
        };
        // console.log({ bb, bbn, bbc });

        mesh.position.set(bbc.x, bbc.y, bbc.z);

        equipmentWidth = bbn.x;
        equipmentLength = bbn.z;
        updateHead();

        let gr = new THREE.Group();
        gr.add(mesh);

        setMill(gr);
    }


    const loadModel = () => {
        const loader = new OBJLoader();

        loader.load(props.equipmentFile ?? ModelMill, group => {

            millItems = group.children;
            setEquipmentNumber(props.equipmentNumber);

        }, null, error => {
            console.error('error load model', error);
        });
    }

    const setFramesData = (framesData, gc, showAngleLines=false) => {

        let lastPoint = Object.assign({}, zeroPoint);
        
        let materialAngle = new THREE.LineBasicMaterial({
            color: 0x00FF00,
        });

        intersectObjects = [];
        intersectObjects.push(plane);

        if(gcodeGroup !== null){
            scene.remove(gcodeGroup);
        }
        gcodeGroup = new THREE.Group();

        let group = gcodeGroup;

        const addAngleLines = (calcPoint) => {
            let aa = calcPoint.a;
            let ac = calcPoint.c;

            let aa2 = aa *Math.PI/180;
            let ac2 = ac *Math.PI/180;

            let pointAngle = {x: 0, y: 0, z: 5};
            pointAngle = rotY(pointAngle, aa2);
            pointAngle = rotZ(pointAngle, ac2);

            let points3d = [];
            // points3d.push( new THREE.Vector3(calcPoint.y, calcPoint.z, calcPoint.x) );
            points3d.push( new THREE.Vector3(calcPoint.x, calcPoint.y, calcPoint.z) );
            calcPoint = gc.pointAdd(calcPoint, pointAngle);
            // points3d.push( new THREE.Vector3(calcPoint.y, calcPoint.z, calcPoint.x) );
            points3d.push( new THREE.Vector3(calcPoint.x, calcPoint.y, calcPoint.z) );
            const geometry2 = new THREE.BufferGeometry().setFromPoints(points3d);
            const line2 = new THREE.Line(geometry2, materialAngle);
            group.add(line2);

        }

        framesData.map((frameData, ind) => {

            // console.log(JSON.stringify(frameData));

            if(frameData.type === FRAME_TYPE_MOVE_LINE_FAST || frameData.type === FRAME_TYPE_MOVE_LINE_WORK){
                let { point } = frameData;

                let p1 = lastPoint;
                let p2 = point;

                let length = gc.calcPointsDistance(lastPoint, point);
                if(length < 1){
                    return;
                }

                let points3d = [];
                // points3d.push( new THREE.Vector3(p1.y, p1.z, p1.x) );
                // points3d.push( new THREE.Vector3(p2.y, p2.z, p2.x) );
                points3d.push( new THREE.Vector3(p1.x, p1.y, p1.z) );
                points3d.push( new THREE.Vector3(p2.x, p2.y, p2.z) );
                const geometry = new THREE.BufferGeometry().setFromPoints(points3d);
                const line = new THREE.Line(geometry, frameData.type === FRAME_TYPE_MOVE_LINE_FAST ? materialLineDashed : materialLine);
                line.computeLineDistances();
                group.add(line);
                intersectObjects.push(line);

                // add angle lines
                if(showAngleLines){
                    (() => {
                        let prop = 0.0;
                        while(prop <= 1.0){
                            let calcPoint = gc.calcPointWithProportion(p1, p2, prop);
                            // let geometry = new THREE.SphereGeometry(1, 8, 8);
                            // const sphere = new THREE.Mesh(geometry, material4);
                            // sphere.position.set(calcPoint.y, calcPoint.z, calcPoint.x);
                            // group.add(sphere);

                            addAngleLines(calcPoint);

                            prop += 0.25;
                        }
                    })();
                }

                lastPoint = Object.assign({}, point);

            } else if(frameData.type === FRAME_TYPE_MOVE_CIRCLE_CW || frameData.type === FRAME_TYPE_MOVE_CIRCLE_CCW){
                let { point } = frameData;

                let cp = Object.assign({}, frameData.circle.data);
                let pc = cp.center;

                const curve = new THREE.EllipseCurve(
                    pc.x, pc.y,
                    cp.r, cp.r,
                    cp.angle1, cp.angle2, 
                    !cp.ccw,
                    0
                );
                const points3d = curve.getPoints(50);
                const geometry = new THREE.BufferGeometry().setFromPoints(points3d);
                const arc = new THREE.Line(geometry, materialLine);
                arc.rotation.set(-Math.PI/2, 0, -Math.PI/2);
                group.add(arc);
                intersectObjects.push(arc);


                // console.log(JSON.stringify(cp));

                // add angle lines
                if(showAngleLines){
                    (() => {

                        let dAngle = 0.25;

                        let a1 = cp.angle1;
                        let a2 = cp.angle2;

                        if(!cp.ccw){
                            if(a1 < a2) a1 += 2*Math.PI;
                            dAngle = -dAngle;
                        } else{
                            if(a2 < a1) a2 += 2*Math.PI;
                        }

                        let prop = 0.0;
                        while(prop <= 1.0){
                            let calcAngle = (a2 - a1) * prop + a1;
                            let calcPoint = Object.assign({}, zeroPoint);
                            calcPoint.x = cp.r*Math.cos(calcAngle) + pc.x;
                            calcPoint.y = cp.r*Math.sin(calcAngle) + pc.y;

                            addAngleLines(calcPoint);

                            prop += 0.25;
                        }
                    })();
                }

                lastPoint = Object.assign({}, point);
                
            } else{

            }
        })

        // group.position.set(25, 13, 17.5);
        // group.position.set(17.5, 25, 13);

        scene.add(group);


    }

    /**
     * Нарисовать выбранную пользователем точку
     * @param {Point} point выбранная точка
     */
    const setUserSelectedPoint = (point, length) => {

        Object.keys(point).map(axeName => {
            point[axeName] = Number(point[axeName]);
        });

        if(scene === null) return;

        if(userSelectedGroup !== null){
            scene.remove(userSelectedGroup);
        }

        userSelectedGroup = new THREE.Group();
        let points3d = null;
        let geometry = null;
        let lines = [];

        points3d = [];
        points3d.push( new THREE.Vector3(-2000, point.y, point.z) );
        points3d.push( new THREE.Vector3(2000, point.y, point.z) );
        geometry = new THREE.BufferGeometry().setFromPoints(points3d);
        lines.push( new THREE.Line(geometry, materialUserSelected) )

        points3d = [];
        points3d.push( new THREE.Vector3(point.x, -2000, point.z) );
        points3d.push( new THREE.Vector3(point.x, 2000, point.z) );
        geometry = new THREE.BufferGeometry().setFromPoints(points3d);
        lines.push( new THREE.Line(geometry, materialUserSelected) )

        let aa = point.a;
        let ac = point.c - 90;

        let aa2 = aa *Math.PI/180;
        let ac2 = ac *Math.PI/180;

        let pointAngle = {x: 0, y: 0, z: length};
        pointAngle = rotY(pointAngle, aa2);
        pointAngle = rotZ(pointAngle, ac2);

        let calcPoint = Object.assign({}, point);
        points3d = [];
        points3d.push( new THREE.Vector3(calcPoint.x, calcPoint.y, calcPoint.z) );
        calcPoint = gc.pointAdd(calcPoint, pointAngle);
        points3d.push( new THREE.Vector3(calcPoint.x, calcPoint.y, calcPoint.z) );
        geometry = new THREE.BufferGeometry().setFromPoints(points3d);
        lines.push( new THREE.Line(geometry, materialUserSelected) )

        lines.map(line => (userSelectedGroup.add(line)) );

        scene.add(userSelectedGroup);

    }

    /**
     * Удалить выбранную пользователем точку
     */
    const removeUserSelectedPoint = () => {
        if(scene === null) return;

        if(userSelectedGroup !== null){
            scene.remove(userSelectedGroup);
            userSelectedGroup = null;
        }
    }

    /**
     * Получить MoveHelper пользовательского нуля
     */
    const getUserSelectedHelper = () => {
        return userZeroMh1;
    }


    const createCamEnvironment = () => {
        if(scene === null) return;

        camModuleInited = true;

        let mouseEvents = camModule.getMouseEvents();
        mouseEvents.setDomElement(renderer.domElement);
        mouseEvents.setScreenSize(screenWidth, screenHeight);
        mouseEvents.setCamera(camera);
        mouseEvents.init();

        camModule.setScene(scene);
        camModule.setVisionScene(_this);

        let camGroup = camModule.getGroup();

        scene.add(camGroup);

        let blank = null;
// // INITIAL_BLANK_TYPE_PLANE, INITIAL_BLANK_TYPE_BOX, INITIAL_BLANK_TYPE_CYLINDER,
        // let blank = camModule.createInitialBlank(INITIAL_BLANK_TYPE_PLANE);
        // let blank = camModule.createInitialBlank(INITIAL_BLANK_TYPE_BOX);
        // // let blank = camModule.createInitialBlank(INITIAL_BLANK_TYPE_CYLINDER);
        // blank.setSize({x: 250});

        // let blank2 = camModule.createInitialBlank(INITIAL_BLANK_TYPE_BOX);
        // blank2.setSize({x: 50, y: 50, z: 50});
        // blank2.setPosition({x: 0, y: 200, z: 0});



        if(typeof funcCamModuleReady === 'function'){
            funcCamModuleReady(camModule);
        }


        // let blank = camModule.createInitialBlank(INITIAL_BLANK_TYPE_BOX);
        // // let blank = camModule.createInitialBlank(INITIAL_BLANK_TYPE_CYLINDER);
        // blank.setSize({x: 250});

        // let blank2 = camModule.createInitialBlank(INITIAL_BLANK_TYPE_BOX);
        // blank2.setSize({x: 50, y: 50, z: 50});
        // blank2.setPosition({x: 0, y: 200, z: 0});


        // // TypeScript
        // let bl = camModule.createInitialBlankTS(BlankTypeTS.Box);
        // bl.setSize({x: 250, y: 200, z: 200});
        // bl.setPosition({x: -250, y: 200, z: 0});

        // let bl2 = camModule.createInitialBlankTS(BlankTypeTS.Box);
        // bl2.setSize({x: 50, y: 50, z: 50});
        // bl2.setPosition({x: 0, y: 200, z: 0});



        // return;
/* * /
        const canvasw = document.createElement('canvas');
        canvasw.width = 500;
        canvasw.height = 500;
        canvasw.style = 'display: none;';
        document.body.appendChild(canvasw);

        // const sd = new ScanDepth();
        // sd.runWorker(canvasw);

        // camModule.loadSTLModel('rozetka_2.stl', (group, boundSize) => {
        // camModule.loadSTLModel('http://127.0.0.1:3003/models/rozetka_2.stl', (group, boundSize) => {
        // camModule.loadSTLModel('http://127.0.0.1:3003/models/Nardy_boxyor.stl', (group, boundSize) => {
        camModule.loadSTLModel('http://127.0.0.1:3003/models/Dva_topora.stl', (group, boundSize) => {
            // console.log(group);
            // scene.add(group);
            // renderer.render(scene, camera);



            let gr2 = new THREE.Group();

            const mesh = group.children[0];
            const geometry = group.children[0].geometry;


            let mesh2 = new THREE.Mesh(geometry, material2);
            mesh2.position.copy(mesh.position);
            gr2.add(mesh2);
            let bb = Object.assign({}, boundSize);
            // let scale = 70;
            (() => {
                // временно для разработки
                let scale = 70; //0.6;
                // scale = 70;
                gr2.scale.set(scale, scale, scale);
                bb.width *= scale;
                bb.height *= scale;
                bb.depth *= scale;
            })();

            scene.add(gr2);


            console.log('qwe', mesh2);


            let bl = blank;

            if(bl.getType() === INITIAL_BLANK_TYPE_BOX){
                // let blankParams = bl.getParams();
                let size = bl.getSize();

                gr2.position.set(0, 0, -bb.depth);

                let wm = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z-bb.depth), material2);
                wm.position.set(0, 0, -size.z/2-bb.depth/2);
                scene.add(wm);

            }

            bl.setVisible(false);

            return;
            const sd = new ScanDepth();
            sd.runWorker(canvasw, () => {

                sd.onGrayDepthMap( ({ grayDepthMap, width, height, zCalcMin, zCalcMax }) => {

                    // console.log({ grayDepthMap, width, height, zCalcMin, zCalcMax });

                    // bb.depth -= zCalcMin*scale;
                    // gr2.position.set(0, 0, -bb.depth);

                    let workPoints = [];

                    let aspect = bb.width / bb.height;

                    for(let j=0; j<height; j+=5){
                        let points3d = [];
                        for(let i=0; i<width; i++){
                            let pos = j*width + i;
                            let gray = grayDepthMap[pos];

                            let x = (bb.width * (i - width/2))/width;
                            let y = (bb.height * (j - height/2))/height * aspect;
                            let z = -bb.depth * gray / 255;

                            let point = {x, y, z};

                            points3d.push( new THREE.Vector3(point.x, point.y, point.z+0.5) );
                            workPoints.push(point);
                        }

                        const geometryByGray = new THREE.BufferGeometry().setFromPoints(points3d);
                        const line = new THREE.Line(geometryByGray, materialLineSelected1);
                        line.computeLineDistances();
                        scene.add(line);
                    }


                    return;
                    let workPos = 0;
                    let intervalID = window.setInterval(() => {

                        let wPoint = workPoints[workPos];

                        (() => {

                            let aa = props.A;
                            let ac = props.C - 90;
                            let rh = equipmentLength +13;
                
                            let aa2 = aa *Math.PI/180;
                            let ac2 = ac *Math.PI/180;
                
                            let tx = wPoint.x;
                            let ty = wPoint.y;
                            let tz = wPoint.z;
                
                
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
                
                            head.position.set(x, y, z);
                        })();

                        workPos += 5;
                        if(workPos >= workPoints.length){
                            window.clearInterval(intervalID);
                        }
                    }, 50);
                });

                sd.setGeometry(geometry.clone());

            });

        });

/* */

    }

    const getCamModule = () => {
        if(!camModuleInited){
            console.log('CamModule not inited');
            return null;
        }
        return camModule;
    };

    const onCamModuleReady = (func) => {
        funcCamModuleReady = func;
    }


    const apiContext = {
        init, show, initRenderer, getRenderer, render, 
        // getControls, 
        setControlsEnabled,
        setMount, setProps, 
        setAnimateEnabled, 
        // animate, 
        updateHead, 
        setCenterOffset,
        setEquipmentLength, setEquipmentWidth, setEquipmentNumber,
        loadModel, 
        setFramesData,
        setUserSelectedPoint, removeUserSelectedPoint, 
        getUserSelectedHelper, 
        createCamEnvironment, getCamModule, onCamModuleReady, 

        context: _this,
    };

    Object.keys(apiContext).map(name => _this[name] = apiContext[name]);

    return apiContext;


};


/**
 * 3D визуализатор
 */
 class Vision3D extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

        this.getVisionScene = this.getVisionScene.bind(this);

        this.state = {

        }

        this.visionScene = new VisionScene(props);

    }

    getVisionScene(){
        return this.visionScene;
    }

    componentDidMount(){

        const vs = this.visionScene;
        vs.initRenderer();

        let parseReady = () => {

            let renderer = vs.getRenderer();
            let posInfo = renderer.domElement.getBoundingClientRect();
            if(posInfo.width === 0 && posInfo.height === 0){
                window.setTimeout(parseReady, 100);
                return;
            }

            vs.init();
            if(this.props.showHead){
                vs.show();
            }
            vs.loadModel();
            // ss.createBlank();

            vs.setCenterOffset({x: this.props.coX, y: this.props.coY});    
            
            if(this.props.camModuleEnabled){
                vs.createCamEnvironment();
            }

        }

        window.setTimeout(parseReady, 100);

    }

    handleCutBtnClick(event){
        const vs = this.visionScene;
        vs.cutBlank();
    }

    componentDidUpdate(prevProps){
        const vs = this.visionScene;
        if( 
            (JSON.stringify(this.props.coX) !== JSON.stringify(prevProps.coX)) ||
            (JSON.stringify(this.props.coY) !== JSON.stringify(prevProps.coY)) 
        ){
            vs.setCenterOffset({x: this.props.coX, y: this.props.coY});            
        }

        if( (JSON.stringify(this.props.equipmentLength) !== JSON.stringify(prevProps.equipmentLength)) ){
            vs.setEquipmentLength(this.props.equipmentLength);
        }

        if( (JSON.stringify(this.props.equipmentWidth) !== JSON.stringify(prevProps.equipmentWidth)) ){
            vs.setEquipmentWidth(this.props.equipmentWidth);
        }
        
        if( (JSON.stringify(this.props.equipmentNumber) !== JSON.stringify(prevProps.equipmentNumber)) ){
            vs.setEquipmentNumber(this.props.equipmentNumber);
        }

        if(this.props.showHead !== prevProps.showHead){
            vs.updateHead();
        }

        if(this.props.needAnimate !== prevProps.needAnimate){
            if(this.props.needAnimate){
                vs.setAnimateEnabled(true);
            } else{
                vs.setAnimateEnabled(false);
            }
        }

    }

    render(){

        const vs = this.visionScene;
        vs.setProps(this.props);
        vs.render();

        const { classes } = this.props;

        return (
            <div>
                <div ref={ref => (vs.setMount(ref))} className={classes.root}/>
                {/* <button onClick={e => this.handleCutBtnClick(e)}>Cut</button> */}
            </div>
        );
    }

}

Vision3D.defaultProps = {
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
    equipmentNumber: 0,
    width: 500,
    height: 500,

    onSelectSegment: null,      // func
    onChangePointSelected: null,        // функция вызываемая при изменении выбранных координат

    needAnimate: true,

    showHead: true,
    camModuleEnabled: false,

};

export default withStyles(useStyles)(Vision3D);
export { zeroPoint, zeroPoint3D, zeroPointABC };
