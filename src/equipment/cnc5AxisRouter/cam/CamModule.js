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

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

import createWorker from 'offscreen-canvas/create-worker';

import GCode from '../../../gcode/GCode';
import { zeroPoint3D, zeroPointABC } from '../Vision3D';

import ThreeMouseEvents from '../../../ThreeMouseEvents';
// import CamWorker from './Cam.worker';

import { TOOL_PANEL_NAME_MAIN, TOOL_PANEL_NAME_RIGHT } from '../ToolPanel';
import { TOOL_POINTER, TOOL_SELECT_MESH, TOOL_SELECT_GROUP_MESH } from '../ToolPanel';

import { MoveHelper, MoveRotateHelper } from '../MoveRotateHelper';

import ScanDepth from './ScanDepth';
import Analyse from './analyse/Analyse.ts';
import Strategy from './analyse/strategy/Strategy.ts';
import OnePath3DStrategy from './analyse/strategy/OnePath3DStrategy.ts';
import DraftMill3DStrategy from './analyse/strategy/DraftMill3DStrategy.ts';

import { ScanAreaMapPoint } from './analyse/strategy/DraftMill3DStrategy.ts';


// import InitialBlank from './InitialBlank';
// import { TYPE as TYPE_INITIAL_BLANK } from './InitialBlank';
// import { INITIAL_BLANK_TYPE_PLANE, INITIAL_BLANK_TYPE_BOX, INITIAL_BLANK_TYPE_CYLINDER } from './InitialBlank';

import CamObject from './CamObject.ts';
import InitialBlank from './InitialBlank.ts';
import { CAM_TYPE as TYPE_INITIAL_BLANK, Type as BlankType } from './InitialBlank.ts';
import { StlModel, StlModelLink } from './StlModel.ts';
import { CAM_TYPE as TYPE_STL_MODEL, CAM_TYPE_LINK as TYPE_STL_MODEL_LINK } from './StlModel.ts';
// import { DispatchableEvent } from './EventDispatcher';

import FileSystem from '../../../FileSystem';


// const TYPE_STL_MODEL = 'STL Model';



let gc = new GCode();

const materialHighlight = new THREE.MeshBasicMaterial( { color: 0xFF0000, side: THREE.DoubleSide, transparent: true, opacity: 0.6 } );
const materialHighlight2 = new THREE.MeshBasicMaterial( { color: 0x888800, side: THREE.DoubleSide, transparent: true, opacity: 0.6 } );
// const materialHighlight2 = new THREE.MeshBasicMaterial( { color: 0x888800, side: THREE.DoubleSide} );


function CamModule(){

    let rnd = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    let uuid = 'CamModule_'+(new Date().getTime())+'_'+rnd;
    this.uuid = uuid;

    let visionScene = null;

    let scene = null;

    let group = new THREE.Group();
    let groupInitialBlank = null;

    let mouseEvents = new ThreeMouseEvents();
    
    let blanks = {};
    let blanksIntersectObjects = {};

    let meshFaced = null;

    let stlMesh = null;
    let moveHelper = null;
    let selectedBlank = null;

    let toolNameSelected = null;
    toolNameSelected = TOOL_POINTER;

    let funcSelectGroupMeshes = null;
    let funcSelectObjects = null;

    let projectComponents = null;       // ProjectComponents
    let projectStlModels = null;        // ProjectStlModels


    const _this = this;

    // const ds = new DraftMill3DStrategy({ diam: 8, diamDraftDelta: 2 }, 0.1);
    // console.log('rDraftA:', ds.rDraftA);


    const getGroup = () => {
        return group;
    }



    const createInitialBlank = (type) => {

        const blank = new InitialBlank(type);
        let gr = blank.group;

        blanks[blank.uuid] = blank;

        blanksIntersectObjects[blank.uuid] = blank.intersectObjects;
        mouseEvents.setIntersectObjects( calcIntersectObjects() );

        blank.events.addEventListener('all', (event) => {
            // console.log(event);

            if(event.type === 'remove'){

                console.log('remove blank', blank);

                delete blanks[blank.uuid];
                delete blanksIntersectObjects[blank.uuid];

                group.remove(gr);

                // удаление MoveHelper
                // console.log(selectedBlank, blank, moveHelper);
                if(selectedBlank === blank && moveHelper !== null){
                    moveHelper.remove();
                }

                if(projectComponents !== null){
                    projectComponents.removeComponent(blank);
                }

                mouseEvents.setIntersectObjects( calcIntersectObjects() );

                return;
            }

            if(blank.visible){
                blanksIntersectObjects[blank.uuid] = blank.intersectObjects;
            } else{
                blanksIntersectObjects[blank.uuid] = [];
            }

            if(event.type === 'position'){
                
            }

            mouseEvents.setIntersectObjects( calcIntersectObjects() );


        });

        // console.log(blanksIntersectObjects);

        // projectComponents.tree.push({
        //     params: blank.getParams(), object: blank,
        // });

        if(projectComponents !== null){
            projectComponents.addComponent(blank);
        } else{
            console.warn('ProjectComponents not inited');
        }

        group.add(gr);
        return blank;


    }

    const calcIntersectObjects = () => {
        let intersectObjects = [];
        Object.keys(blanksIntersectObjects).map(uuid => {
            intersectObjects.push(...blanksIntersectObjects[uuid]);
        });
        // console.log('calcIntersectObjects', intersectObjects);
        // intersectObjects.push(...blankIntersectObjects);
        // if(stlMesh !== null){
        //     intersectObjects.push(stlMesh);
        // }

        // if(moveHelper !== null){
        //     intersectObjects.push(...moveHelper.getIntersectObjects());
        // }

        return intersectObjects;
    }

    const setScene = (sc) => {
        scene = sc;
    };

    const setVisionScene = (vision) => {
        visionScene = vision;
    }

    const getMouseEvents = () => mouseEvents;


    // запуск Chrome для загрузки файлов с локальной директории
    // macos:   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security --user-data-dir=/Users/dmitriy/Projects/ReactJS/factory-management/
    // windows: Chrome.exe --disable-web-security
    const loadSTLModel = (url, funcSuccess) => {
        const loader = new STLLoader();
        loader.load(url, geometry => {
            parseGeometrySTLModel(geometry, funcSuccess);
        });
    }

    const parseGeometrySTLModel = (geometry, funcSuccess) => {
        const material = new THREE.MeshStandardMaterial({
            color: 0x888888, 
            // side: THREE.DoubleSide
        });

        geometry.computeBoundingBox();
        let mesh = new THREE.Mesh(geometry, material);

        let bb = geometry.boundingBox;
        let bbc = {
            x: -(bb.max.x + bb.min.x)/2,
            y: -(bb.max.y + bb.min.y)/2,
            // z: -(bb.max.z + bb.min.z)/2 + (bb.max.z - bb.min.z)/2,
            z: -bb.min.z,
        };
        mesh.position.set(bbc.x, bbc.y, bbc.z);
        // mesh.name = 'STL object';
        // mesh.name = 'CamModule';
        // mesh.userData = {type: TYPE_STL_MODEL, context: _this};

        // const stlbbox = new THREE.BoxHelper(mesh, 0xFF0000);

        // let group = new THREE.Group();
        // group.add(mesh);
        // gr.add(stlbbox);
        // gr.rotateZ(Math.PI/2);

        // console.log(mesh);
        let scale = 1;
        let boundSize = { width: (bb.max.x-bb.min.x)*scale, height: (bb.max.y-bb.min.y)*scale, depth: (bb.max.z-bb.min.z)*scale };
        // console.log(boundSize);
        // group.scale.set(scale, scale, scale);


        // stlMesh = mesh;
        // mouseEvents.setIntersectObjects( calcIntersectObjects() );

        
        if(typeof funcSuccess === 'function'){
            funcSuccess(mesh, boundSize);
        }
        // return { group, boundSize };
    }


    // let listSelectedGroupMeshOvered = [];
    let selectedGroupMesh = {index: null, mesh: null, group: null, camObject: null};
    let listSelectedGroupMeshClicked = [];

    /**
     * Выбор группы сеток
     * @param Object object объект 3D
     * @param int faceGroupIndex индекс группы
     * @param string eventType тип события (over - перемещение, click - нажатие)
     */
    const selectGroupMesh = (object, faceGroupIndex, eventType) => {

        const camObject = object.userData.camObject;
        const camGroup = camObject.group;

        eventType = eventType ?? 'click';

        let ar = object.geometry.attributes.position.array;

        // console.log(faceGroupIndex, object.geometry);
        let ggr = object.geometry.groups[faceGroupIndex];
        let ar2 = object.geometry.index.array.slice(ggr.start, ggr.start+ggr.count);
        let vps = [];
        ar2.map(posIndex => {
            vps.push(...ar.slice(posIndex*3, posIndex*3+3));
        });
        const vertices = new Float32Array(vps);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        if(eventType === 'over'){
            if(selectedGroupMesh.mesh !== null){
                selectedGroupMesh.group.remove(selectedGroupMesh.mesh);
                selectedGroupMesh = {index: null, mesh: null, group: null};
            }

            const mesh = new THREE.Mesh(geometry, materialHighlight);
            mesh.position.copy(object.position);
            camGroup.add(mesh);

            // console.log('selectGroupMesh', eventType, camGroup, camObject);

            selectedGroupMesh = {index: faceGroupIndex, mesh, group: camGroup, camObject};
        } else if(eventType === 'click'){

            listSelectedGroupMeshClicked.map(sg => {
                sg.group.remove(sg.mesh);
            });
            listSelectedGroupMeshClicked = [];

            if(selectedGroupMesh.mesh !== null){
                const mesh = selectedGroupMesh.mesh.clone();
                mesh.position.copy(object.position);
                mesh.material = materialHighlight2;
                selectedGroupMesh.group.add(mesh);

                listSelectedGroupMeshClicked.push({
                    index: faceGroupIndex, 
                    mesh, 
                    group: selectedGroupMesh.group, 
                    camObject: selectedGroupMesh.camObject
                });
            }

            if(typeof funcSelectGroupMeshes === 'function'){
                funcSelectGroupMeshes([...listSelectedGroupMeshClicked]);
            }

        }
    }

    /**
     * Добавление к выбранным группы сеток
     * @param Object object объект 3D
     * @param int faceGroupIndex индекс группы
     */
    const addSelectGroupMesh = (object, faceGroupIndex) => {
        if(selectedGroupMesh.mesh !== null){
            const mesh = selectedGroupMesh.mesh.clone();
            mesh.material = materialHighlight2;
            selectedGroupMesh.group.add(mesh);
            listSelectedGroupMeshClicked.push({
                index: faceGroupIndex, 
                mesh, 
                group: selectedGroupMesh.group,
                camObject: selectedGroupMesh.camObject
            });

            if(typeof funcSelectGroupMeshes === 'function'){
                funcSelectGroupMeshes([...listSelectedGroupMeshClicked]);
            }

        }
    }

    /**
     * Очистка выбранной группы сеток
     * @param string eventType тип события (over - перемещение, click - нажатие)
     */
    const clearSelectGroupMesh = (eventType) => {
        eventType = eventType ?? 'click';
        if(eventType === 'over'){
            if(selectedGroupMesh.mesh !== null){
                selectedGroupMesh.group.remove(selectedGroupMesh.mesh);
                selectedGroupMesh = {index: null, mesh: null, group: null, camObject: null};
            }
        } else if(eventType === 'click'){
            listSelectedGroupMeshClicked.map(sg => {
                sg.group.remove(sg.mesh);
            });
            listSelectedGroupMeshClicked = [];

            if(typeof funcSelectGroupMeshes === 'function'){
                funcSelectGroupMeshes([...listSelectedGroupMeshClicked]);
            }

        }
    }

    /**
     * Снятие выделение с группы сеток
     * @param Object object объект 3D
     * @param int faceGroupIndex индекс группы
     */
    const deSelectGroupMesh = (object, faceGroupIndex) => {

        const camObject = object.userData.camObject;
        const camGroup = camObject.group;

        let selGroupsMesh = listSelectedGroupMeshClicked.filter(sel => (sel.index === faceGroupIndex && sel.group === camGroup));
        if(selGroupsMesh.length > 0){
            let sg = selGroupsMesh[0];
            sg.group.remove(sg.mesh);
            listSelectedGroupMeshClicked = listSelectedGroupMeshClicked.filter(sel => !(sel.index === faceGroupIndex && sel.group === camGroup));

            if(typeof funcSelectGroupMeshes === 'function'){
                funcSelectGroupMeshes([...listSelectedGroupMeshClicked]);
            }

        }
    }

    /**
     * Копирование сетки Mesh
     * @param Group.Mesh mesh оригинальная сетка 
     * @returns копия сетки
     */
    const cloneMesh = (mesh) => {
        const ud = mesh.userData;
        mesh.userData = {};
        const newMesh = mesh.clone();
        mesh.userData = ud;
        newMesh.userData = ud;
        return newMesh;
    }



    let selectedObject = {mesh: null, group: null, camObject: null, camObject: null};
    let listSelectedObjectClicked = [];

    // const selectObject = (object, eventType) => {
    const selectObject = (camObject, eventType) => {

        // const camObject = object.userData.camObject;
        const camGroup = camObject.group;

        eventType = eventType ?? 'click';
        if(eventType === 'over'){
            if(selectedObject.mesh !== null){
                selectedObject.group.remove(selectedObject.mesh);
                selectedObject = {mesh: null, group: null, camObject: null};
            }

            // console.log(camObject, camObject.mesh, camObject.mesh.position);
            // const mesh = cloneMesh(object);
            const mesh = cloneMesh(camObject.mesh);
            mesh.material = materialHighlight;
            // mesh.position.copy(object.position);
            mesh.position.copy(camObject.mesh.position);
            camGroup.add(mesh);

            selectedObject = {mesh, group: camGroup, camObject};
        } else if(eventType === 'click'){

            listSelectedObjectClicked.map(so => {
                so.group.remove(so.mesh);
            });
            listSelectedObjectClicked = [];

            if(selectedObject.mesh !== null){
                // const mesh = cloneMesh(object);
                const mesh = cloneMesh(camObject.mesh);
                mesh.material = materialHighlight2;
                selectedObject.group.add(mesh);

                listSelectedObjectClicked.push({mesh, group: selectedObject.group, camObject: selectedObject.camObject});
                createMoveHelperToSelectedObject(camObject);
            }

            if(typeof funcSelectObjects === 'function'){
                funcSelectObjects([...listSelectedObjectClicked]);
            }
        }
    }

    const addSelectObject = (object) => {
        if(selectedObject.mesh !== null){
            // const mesh = selectedObject.mesh.clone();
            const mesh = cloneMesh(selectedObject.mesh);
            mesh.material = materialHighlight2;
            selectedObject.group.add(mesh);
            listSelectedObjectClicked.push({mesh, group: selectedObject.group, camObject: selectedObject.camObject});

            if(typeof funcSelectObjects === 'function'){
                funcSelectObjects([...listSelectedObjectClicked]);
            }
        }
    }

    const clearSelectObject = (object, eventType) => {
        eventType = eventType ?? 'click';
        if(eventType === 'over'){
            if(selectedObject.mesh !== null){
                selectedObject.group.remove(selectedObject.mesh);
                selectedObject = {mesh: null, group: null, camObject: null};
            }
        } else if(eventType === 'click'){
            listSelectedObjectClicked.map(so => {
                so.group.remove(so.mesh);
            });
            listSelectedObjectClicked = [];

            if(typeof funcSelectObjects === 'function'){
                funcSelectObjects([...listSelectedObjectClicked]);
            }
        }
    }

    const deSelectObject = (object) => {
        const camObject = object.userData.camObject;
        const camGroup = camObject.group;

        let selObjects = listSelectedObjectClicked.filter(sel => (sel.group === camGroup));
        if(selObjects.length > 0){
            let so = selObjects[0];
            so.group.remove(so.mesh);
            listSelectedObjectClicked = listSelectedObjectClicked.filter(sel => !(sel.group === camGroup));

            if(typeof funcSelectObjects === 'function'){
                funcSelectObjects([...listSelectedObjectClicked]);
            }
        }
    }

    const camObjectEvent = (event) => {
        if(event.type === 'position'){
            if(moveHelper !== null && !moveHelper.isDragActive()){
                moveHelper.setPoint(event.params.position);
            }
        } else if(event.type === 'rotation'){
            console.log(event);
        }
    }

    const createMoveHelperToSelectedObject = (camObject) => {

        // let mhAdded = false;

        if(camObject instanceof InitialBlank){
        // if(camObject instanceof CamObject){
            if(moveHelper !== null){
                // console.log('need remove moveHelper');
                moveHelper.remove();
                moveHelper = null;
            }

            if(moveHelper === null){
                // let mh1LastPoint = {x: gr.position.x, y: gr.position.y, z: gr.position.z};
                let mh1LastPoint = camObject.position;
                let mh1 = moveHelper = new MoveHelper(Object.assign({}, zeroPoint3D, mh1LastPoint), 25, 10);
                let mh1Group = mh1.getGroup();
                // scene.add(mh1Group);

                if(camObject.parentObject === null){
                    scene.add(mh1Group);
                } else{
                    camObject.parentObject.group.add(mh1Group);
                }

                mh1.setVisible(true);
                mh1.setAxesVisible(true);
                mh1.setTwoAxesVisible(true);
                
                mh1.onChange((point) => {
                    // camObject.setPosition(point);
                    camObject.position = point;
                });


                selectedBlank = camObject;
                // selectedBlank.addEventListener('position', camObjectEvent);
                selectedBlank.events.addEventListener('position', camObjectEvent);

            }
        }
    }


    const start = () => {

        let originalMaterial = null;
        let objectDoubleClicked = null;
        mouseEvents.addListener('click', (event, intersects) => {
            // console.log('click', intersects);

            if(toolNameSelected === TOOL_POINTER){

                if(intersects.length > 0){
                    let intersect = intersects[0];
                    let { object, faceIndex } = intersect;

                    if(object.userData.camObject === undefined)
                        return;

                    const camObject = object.userData.camObject;

                    if(!event.shiftKey){
                        // selectObject(object);
                        selectObject(camObject);
                    } else{
                        let selectObjects = listSelectedObjectClicked.filter(sel => (sel.group === selectedObject.group));
                        if(selectObjects.length > 0){
                            deSelectObject(object);
                        } else{
                            addSelectObject(object);
                        }
                    }

                } else{
                    if(!event.shiftKey){
                        clearSelectObject();
                    }
                }

            } else if(toolNameSelected === TOOL_SELECT_MESH){
                
            } else if(toolNameSelected === TOOL_SELECT_GROUP_MESH){
                
                if(intersects.length > 0){
                    let intersect = intersects[0];
                    let { object, faceIndex } = intersect;

                    let faceGroupInd = null;
                    object.geometry.groups.map((group, ind) => {
                        if(faceIndex*3 >= group.start && faceIndex*3 < group.start+group.count){
                            faceGroupInd = ind;
                        }
                    });

                    if(faceGroupInd !== null){
                        if(!event.shiftKey){
                            selectGroupMesh(object, faceGroupInd);
                        } else{
                            let selGroupsMesh = listSelectedGroupMeshClicked.filter(sel => (sel.index === faceGroupInd && sel.group === selectedGroupMesh.group));
                            if(selGroupsMesh.length > 0){
                                deSelectGroupMesh(object, faceGroupInd);
                            } else{
                                addSelectGroupMesh(object, faceGroupInd);
                            }
                        }
                    }
                } else{
                    if(!event.shiftKey){
                        clearSelectGroupMesh();
                    }
                }
                
            }


            // const camObjectEvent = (eventName, params) => {
            //     if(eventName === 'position'){
            //         if(moveHelper !== null && !moveHelper.isDragActive()){
            //             moveHelper.setPoint(params.position);
            //         }
            //     } else if(eventName === 'rotation'){
            //         console.log(eventName, params);
            //     }
            // }

            // const camObjectEvent = (event) => {
            //     if(event.type === 'position'){
            //         if(moveHelper !== null && !moveHelper.isDragActive()){
            //             moveHelper.setPoint(event.params.position);
            //         }
            //     } else if(event.type === 'rotation'){
            //         console.log(event);
            //     }
            // }

            // let mhAdded = false;
            // if(listSelectedObjectClicked.length === 1){
            //     let l = listSelectedObjectClicked[0];
            //     const { mesh, camObject } = l;
            //     let ud = mesh.userData;
            //     // console.log(l);

            //     // console.log(ud, l, camObject);

            //     // if(ud.type){
            //     //     if(ud.type === TYPE_INITIAL_BLANK){

            //     //         if(moveHelper !== null){
            //     //             // console.log('need remove moveHelper');
            //     //             moveHelper.remove();
            //     //             moveHelper = null;
            //     //         }

            //     //         if(moveHelper === null){
            //     //             // let mh1LastPoint = {x: gr.position.x, y: gr.position.y, z: gr.position.z};
            //     //             let mh1LastPoint = camObject.getPosition();
            //     //             let mh1 = moveHelper = new MoveHelper(Object.assign({}, zeroPoint3D, mh1LastPoint), 25, 10);
            //     //             let mh1Group = mh1.getGroup();
            //     //             scene.add(mh1Group);
            //     //             mh1.setVisible(true);
            //     //             mh1.setAxesVisible(true);
            //     //             mh1.setTwoAxesVisible(true);
                            
            //     //             mh1.onChange((point) => {
            //     //                 camObject.setPosition(point);
            //     //             });


            //     //             selectedBlank = camObject;
            //     //             selectedBlank.addEventListener('position', camObjectEvent);

        
            //     //             // mouseEvents.setIntersectObjects( calcIntersectObjects() );
            //     //         }
            //     //         mhAdded = true;
        
            //     //     }
            //     // }

            //     if(camObject instanceof InitialBlank){
            //         if(moveHelper !== null){
            //             // console.log('need remove moveHelper');
            //             moveHelper.remove();
            //             moveHelper = null;
            //         }

            //         if(moveHelper === null){
            //             // let mh1LastPoint = {x: gr.position.x, y: gr.position.y, z: gr.position.z};
            //             let mh1LastPoint = camObject.position;
            //             let mh1 = moveHelper = new MoveHelper(Object.assign({}, zeroPoint3D, mh1LastPoint), 25, 10);
            //             let mh1Group = mh1.getGroup();
            //             scene.add(mh1Group);
            //             mh1.setVisible(true);
            //             mh1.setAxesVisible(true);
            //             mh1.setTwoAxesVisible(true);
                        
            //             mh1.onChange((point) => {
            //                 camObject.setPosition(point);
            //             });


            //             selectedBlank = camObject;
            //             // selectedBlank.addEventListener('position', camObjectEvent);
            //             selectedBlank.events.addEventListener('position', camObjectEvent);

    
            //             // mouseEvents.setIntersectObjects( calcIntersectObjects() );
            //         }
            //         mhAdded = true;
    

            //     } else if(camObject instanceof StlModelLink){
            //         if(moveHelper !== null){
            //             // console.log('need remove moveHelper');
            //             moveHelper.remove();
            //             moveHelper = null;
            //         }

            //         if(moveHelper === null){
            //             // let mh1LastPoint = {x: gr.position.x, y: gr.position.y, z: gr.position.z};
            //             let mh1LastPoint = camObject.position;
            //             let mh1 = moveHelper = new MoveHelper(Object.assign({}, zeroPoint3D, mh1LastPoint), 25, 10);
            //             let mh1Group = mh1.getGroup();
            //             scene.add(mh1Group);
            //             mh1.setVisible(true);
            //             mh1.setAxesVisible(true);
            //             mh1.setTwoAxesVisible(true);
                        
            //             mh1.onChange((point) => {
            //                 camObject.setPosition(point);
            //             });


            //             selectedBlank = camObject;
            //             // selectedBlank.addEventListener('position', camObjectEvent);
            //             selectedBlank.events.addEventListener('position', camObjectEvent);

    
            //             // mouseEvents.setIntersectObjects( calcIntersectObjects() );
            //         }
            //         mhAdded = true;
    

            //     }

            // } else{

            // }

            // // console.log(mhAdded);

            // if(!mhAdded){
            //     if(moveHelper !== null){
            //         // console.log('need remove moveHelper');
            //         moveHelper.remove();
            //         moveHelper = null;
            //         // selectedBlank.removeEventListener('position', camObjectEvent);
            //         selectedBlank.events.removeEventListener('position', camObjectEvent);
            //         selectedBlank = null;
            //     }

            // }

            if(listSelectedObjectClicked.length === 0){

                // if(!mhAdded){
                    if(moveHelper !== null){
                        // console.log('need remove moveHelper');
                        moveHelper.remove();
                        moveHelper = null;
                        // selectedBlank.removeEventListener('position', camObjectEvent);
                        selectedBlank.events.removeEventListener('position', camObjectEvent);
                        selectedBlank = null;
                    }
        
                // }
        
            }


            return;

            let stlModelObject = null;
            intersects.map(intersect => {
                let { object } = intersect;

                if(object.userData.type === TYPE_STL_MODEL && stlModelObject === null){
                    if(inScene(object))
                        stlModelObject = object;
                }

            });

            if(stlModelObject !== null){
                let gr = stlModelObject.parent;
                // gr.position.set(200, 0, 0);

                if(moveHelper === null){
                    let mh1LastPoint = {x: gr.position.x, y: gr.position.y, z: gr.position.z};
                    let mh1 = moveHelper = new MoveHelper(Object.assign({}, zeroPoint3D, mh1LastPoint), 25, 10);
                    let mh1Group = mh1.getGroup();
                    // mh1Group.position.set(25, 13, 17.5);
                    // mh1Group.position.set(17.5, 25, 13);
                    scene.add(mh1Group);
                    mh1.setVisible(true);
                    mh1.setAxesVisible(true);
                    mh1.setTwoAxesVisible(true);
                    
                    mh1.onChange((point) => {

                        gr.position.set(point.x, point.y, point.z);

                    });

                    mouseEvents.setIntersectObjects( calcIntersectObjects() );
                }
            } else{
                if(moveHelper !== null){
                    // console.log('need remove moveHelper');
                    moveHelper.remove();
                    moveHelper = null;
                }
            }

            if(intersects.length === 0 && originalMaterial !== null){
                objectDoubleClicked.material = originalMaterial;
                originalMaterial = null;
                objectDoubleClicked = null;
            }
        });

        mouseEvents.addListener('doubleClick', (event, intersects) => {
            // console.log('doubleClick', intersects);

            // if(intersects.length > 0){
            //     let intersect = intersects[0];
            //     objectDoubleClicked = intersect.object;
            //     originalMaterial = intersect.object.material.clone();
            //     objectDoubleClicked.material = materialHighlight.clone();
            // }


            // return;
            // if(intersects.length > 0){
            //     let intersect = intersects[0];
            //     let { object } = intersect;

            //     if(object.userData.type === TYPE_INITIAL_BLANK){
            //         // let blank = blanks[object.userData.context.uuid];
            //         let context = object.userData.context;
            //         console.log(context);
            //         // context.setPosition({x: 50, y: 50, z: 50});
            //     }
            // }

        });

        mouseEvents.addListener('over', (event, intersect) => {
            let { object, face, faceIndex } = intersect;
            // console.log('over', object, intersect);
            // console.log({toolNameSelected});

            // let availTypes = [TYPE_INITIAL_BLANK];

            // let ud = object.userData;
            // if(availTypes.indexOf(ud.type) === -1){
            //     return;
            // }

            if(object.userData.camObject === undefined)
                return;

            const camObject = object.userData.camObject;

            if(toolNameSelected === TOOL_POINTER){
                // selectObject(object, 'over');
                selectObject(camObject, 'over');
            } else if(toolNameSelected === TOOL_SELECT_MESH){
                
            } else if(toolNameSelected === TOOL_SELECT_GROUP_MESH){
                // selectGroupMesh(object, intersectFaceGroupIndex, 'over');
            }


        });

        mouseEvents.addListener('out', (event, intersect) => {
            let { object } = intersect;
            // console.log('out', object, intersect);

            // let availTypes = [TYPE_INITIAL_BLANK];

            // let ud = object.userData;
            // if(availTypes.indexOf(ud.type) === -1){
            //     return;
            // }


            if(toolNameSelected === TOOL_POINTER){
                clearSelectObject(object, 'over');
            } else if(toolNameSelected === TOOL_SELECT_MESH){
                
            } else if(toolNameSelected === TOOL_SELECT_GROUP_MESH){
                // clearSelectGroupMesh('over');
            }

            // if(object.userData.type === TYPE_INITIAL_BLANK){

            //     let blank = blanks[object.userData.context.uuid];
            //     let grBlank = blank.getGroup();


            //     if(meshFaced !== null){
            //         grBlank.remove(meshFaced);
            //         meshFaced = null;
            //     }
        
            // }
            // if(meshFaced !== null){
            //     group.remove(meshFaced);
            //     meshFaced = null;
            // }

        });


        mouseEvents.addListener('faceOver', (event, intersect, intersectFaceIndex) => {
            let { object, face, faceIndex } = intersect;
            // console.log('faceOver', object, intersect);
        });


        mouseEvents.addListener('faceOut', (event, intersect, intersectFaceIndex) => {
            let { object } = intersect;
            // console.log('faceOut', object, intersect);
        });

        mouseEvents.addListener('faceGroupOver', (event, intersect, intersectFaceGroupIndex) => {
            let { object } = intersect;
            // console.log('faceGroupOver', object, intersect, intersectFaceGroupIndex);


            if(toolNameSelected === TOOL_POINTER){

            } else if(toolNameSelected === TOOL_SELECT_MESH){
                
            } else if(toolNameSelected === TOOL_SELECT_GROUP_MESH){
                selectGroupMesh(object, intersectFaceGroupIndex, 'over');
            }


            // if(object.userData.type === TYPE_INITIAL_BLANK){
            //     let blank = blanks[object.userData.context.uuid];
            //     let grBlank = blank.getGroup();

            //     let ar = object.geometry.attributes.position.array;

            //     if(meshFaced !== null){
            //         grBlank.remove(meshFaced);
            //         meshFaced = null;
            //     }

            //     let ggr = object.geometry.groups[intersectFaceGroupIndex];
            //     let ar2 = object.geometry.index.array.slice(ggr.start, ggr.start+ggr.count);
            //     let vps = [];
            //     ar2.map(posIndex => {
            //         vps.push(...ar.slice(posIndex*3, posIndex*3+3));
            //     });
            //     const vertices = new Float32Array(vps);
            //     const geometry = new THREE.BufferGeometry();
            //     geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            //     meshFaced = new THREE.Mesh(geometry, materialHighlight);
            //     grBlank.add(meshFaced);
            // }
        });

        mouseEvents.addListener('faceGroupOut', (event, intersect, intersectFaceGroupIndex) => {
            let { object } = intersect;
            // console.log('faceGroupOut', object, intersect, intersectFaceGroupIndex);

            if(toolNameSelected === TOOL_POINTER){

            } else if(toolNameSelected === TOOL_SELECT_MESH){
                
            } else if(toolNameSelected === TOOL_SELECT_GROUP_MESH){
                clearSelectGroupMesh('over');
            }


            // if(object.userData.type === TYPE_INITIAL_BLANK){
            //     let blank = blanks[object.userData.context.uuid];
            //     let grBlank = blank.getGroup();
            //     if(meshFaced !== null){
            //         grBlank.remove(meshFaced);
            //         meshFaced = null;
            //     }
            // }
        });



        // const worker = new CamWorker();


        // const canvasw = document.createElement('canvas');
        // canvasw.width = 500;
        // canvasw.height = 500;
        // canvasw.style = 'display: none;';
        // document.body.appendChild(canvasw);


        // const worker = createWorker(canvasw, './Cam.worker.js', e => {
        //     console.log('CamModule from worker', e);

        // });
    };
    start();


    // /**
    //  * Разместить STL модель из бинарного буфера на выбранных поверхностях
    //  * @param ArrayBuffer arrayBuffer буфер с stl моделью
    //  */
    // const applyStlToSelectedFromArrayBuffer = (arrayBuffer) => {

    //     const loader = new STLLoader();
    //     const geometry = loader.parse(arrayBuffer);

    //     const lsg = listSelectedGroupMeshClicked;
    //     const lso = listSelectedObjectClicked;

    //     if(lsg.length > 0 || lso.length > 0){
    //         parseGeometrySTLModel(geometry, (stlMesh, boundSize) => {
    //             // console.log({boundSize});

    //             if(lsg.length > 0){
    //                 lsg.forEach(l => {

    //                     console.log(l);

    //                     // геометрия группы сеток
    //                     const mg = l.mesh.geometry;
    //                     mg.computeBoundingBox();
    //                     mg.computeVertexNormals();

    //                     if(l.camObject instanceof InitialBlank){
    //                         const blank = l.camObject;

    //                         let subType = blank.type;
    //                         if(subType === BlankType.Plane){

    //                         } else if(subType === BlankType.Box){

    //                             let bb = mg.boundingBox;
    //                             let bbc = {
    //                                 x: (bb.max.x + bb.min.x)/2,
    //                                 y: (bb.max.y + bb.min.y)/2,
    //                                 z: (bb.max.z + bb.min.z)/2,
    //                             };
    
    //                             const normal = mg.attributes.normal.array.slice(0, mg.attributes.normal.itemSize);

    //                             const stlMesh2 = stlMesh.clone();
    //                             let group = new THREE.Group();
    //                             group.add(stlMesh2);


    //                             // вычисление угла поворота и положения stl модели
    //                             // [-1, 0, 1]

    //                             const matrixPosition = [
    //                                 [[bbc.x+boundSize.depth, 0, 0], [0, 0, 0], [bbc.x-boundSize.depth, 0, 0]],      // x
    //                                 [[0, bbc.y+boundSize.depth, 0], [0, 0, 0], [0, bbc.y-boundSize.depth, 0]],      // y
    //                                 [[0, 0, bbc.z+boundSize.depth], [0, 0, 0], [0, 0, bbc.z-boundSize.depth]],      // z
    //                             ];

    //                             const matrixRotate = [
    //                                 [[0, -Math.PI/2, 0], [0, 0, 0], [0, Math.PI/2, 0]],     // x
    //                                 [[Math.PI/2, 0, 0], [0, 0, 0], [-Math.PI/2, 0, 0]],     // y
    //                                 [[Math.PI], [0, 0, 0], [0, 0, 0]],                      // z
    //                             ];

    //                             let position = [0, 0, 0];
    //                             let rotate = [0, 0, 0];

    //                             for(let i=0; i<3; i++){
    //                                 let n = normal[i];
    //                                 let r = matrixRotate[i][n+1];
    //                                 let p = matrixPosition[i][n+1];
    //                                 for(let j=0; j<position.length; j++){
    //                                     position[j] += p[j];
    //                                 }
    //                                 for(let j=0; j<rotate.length; j++){
    //                                     rotate[j] += r[j];
    //                                 }
    //                             }

    //                             position[2] -= blank.size.z/2;

    //                             group.position.set(position[0], position[1], position[2]);
    //                             group.rotation.set(rotate[0], rotate[1], rotate[2]);

    //                             // let bp = blank.getPositionWithMesh();
    //                             // // let bp = blank.positionWithMesh;

    //                             // const group2 = new THREE.Group();
    //                             // group2.position.set(bp.x, bp.y, bp.z);
    //                             // group2.add(group);
    //                             // // group2.scale.set(100, 100, 100);
    //                             // scene.add(group2);

    //                             // console.log(bp, group2);
                                
    //                             blank.group.add(group);
                                

    //                             // origPlaneGeometry = mg;
    //                             // const stlModel = new StlModel(stlMesh2, mg);
    //                             // blank.addStlModel(stlModel, group2);
                                
    //                         } else if(subType === BlankType.Cylinder){
                                
    //                         }

    //                     }
    //                 });
    //             }
    //         });
    //     }
    // }

    /**
     * Разместить STL модель на выбранных поверхностях
     * @param StlModel stlModel STL модель
     */
    const applyStlToSelected = (stlModel) => {

        const lsg = listSelectedGroupMeshClicked;
        // const lso = listSelectedObjectClicked;

        const applyStl = () => {
            lsg.forEach(l => {

                if(l.camObject instanceof InitialBlank){
                    const blank = l.camObject;
                    // console.log(stlModel.boundSize);
                    const stlModelLink = new StlModelLink(stlModel);
                    stlModelLink.faceGroupIndex = l.index;
                    blank.addStlModelLink(stlModelLink);
                }

            });

            if(projectComponents !== null){
                projectComponents.updateTree();
            }

        }

        if(lsg.length === 0)
            return;


        stlModelReadMesh( stlModel, () => {
            applyStl();
        } );

    }

    /**
     * Чтение STL модели
     */
    const stlModelReadMesh = (stlModel, func) => {
        if(!stlModel.meshLoaded){
            (async () => {
                // чтение модели из файла
                const fname = stlModel.fname;
                const fs = new FileSystem();

                const content = await fs.readFileArrayBuffer(fname);
                const loader = new STLLoader();
                const geometry = loader.parse(content);
    
                parseGeometrySTLModel(geometry, (stlMesh, boundSize) => {
                    stlModel.mesh = stlMesh;
                    stlModel.boundSize = boundSize;
                    func();
                });

            })();
        } else{
            func();
        }
    }


    const selectPanel1Tool = (panelName, toolName) => {

        toolNameSelected = toolName;

        const vs = visionScene;

        if(panelName === TOOL_PANEL_NAME_MAIN){
            switch(toolName){
                case TOOL_POINTER:
                    if(vs !== null){
                        vs.setControlsEnabled(true);
                    }
                    break;
                case TOOL_SELECT_MESH:
                    if(vs !== null){
                        vs.setControlsEnabled(false);
                    }
                    break;
                case TOOL_SELECT_GROUP_MESH:
                    if(vs !== null){
                        vs.setControlsEnabled(false);
                    }
                    break;
                default:
                    break;
            }
        } else if(panelName === TOOL_PANEL_NAME_RIGHT){
            switch(toolName){

                default:
                    break;
            }
        }

    }

    /**
     * Определение факта нахождения объекта в сцене THREE.Scene
     * @param Object object объект
     * @returns boolean
     */
    const inScene = object => {
        let p = object;
        let inScene = false;
        while((p = p.parent) !== null){
            if(p.type === 'Scene') inScene = true;
        }
        return inScene;
    }


    const onSelectObjects = (func) => {
        funcSelectObjects = func;
    }

    const onSelectGroupMeshes = (func) => {
        funcSelectGroupMeshes = func;
    }

    /**
     * Выбрать текущий проект
     * @param Object projectItem проект
     */
    const setCurrentProject = (projectItem, loadedData) => {
        console.log('setCurrentProject', projectItem);
        // console.log(loadedData);

        const isArray = (arr) => {
            return arr !== null && typeof arr === 'object' && arr.length > 0;
        }

        if(isArray(loadedData)){

            let stlModels = {};
            projectStlModels.getList().forEach(el => {
                stlModels[el.object.uuid] = el.object;
            });

            const applySavedData = (data, parentObject=null) => {

                data.forEach(d => {
                    let camObject = null;

                    if(d.type === TYPE_INITIAL_BLANK){
                        camObject = createInitialBlank(d.subType);
                        camObject.setParams(d.params);

                    } else if(d.type === TYPE_STL_MODEL_LINK){

                        const stlModel = stlModels[d.model.uuid];

                        if(!stlModel){
                            console.warn(`STL model ${d.model.uuid} not exists`);
                            return;
                        }

                        stlModelReadMesh( stlModel, () => {
                            
                            if(parentObject instanceof InitialBlank){
                                const blank = parentObject;
                                const stlModelLink = new StlModelLink(stlModel);
                                stlModelLink.faceGroupIndex = d.faceGroupIndex;
                                stlModelLink.uuid = d.uuid;
                                blank.addStlModelLink(stlModelLink);
                                stlModelLink.setParams(d.params);
                            }

                        } );

                    }

                    if(d.childs !== undefined && isArray(d.childs)){
                        applySavedData(d.childs, camObject);
                    }
                });

            }

            applySavedData(loadedData);

            if(projectComponents !== null){
                projectComponents.updateTree();
            }

        }

    }

    const getSelectedObjects = () => {
        return [...listSelectedObjectClicked];
    }

    const getSelectedGroupMeshes = () => {
        return [...listSelectedGroupMeshClicked];
    }

    const setProjectComponents = pc => {
        projectComponents = pc;
    }

    const setProjectStlModels = psm => {
        projectStlModels = psm;
    }


    /**
     * Анализ компонентов с целью построения траектории движения.
     * Тестовый функционал.
     */
    const analyse = () => {

        let clay = null;

        const analyse = new Analyse();
        analyse.components = projectComponents.getList();
        // analyse.addStrategy(new OnePath3DStrategy({}));

        analyse.onFinishScanDepth(({ link, workPoints, clayGeometry }) => {
            projectComponents.updateTree();

            if(clay !== null){
                scene.remove(clay);
            }

            clay = new THREE.Mesh(clayGeometry, new THREE.MeshStandardMaterial({
                color: 0x00BB00, 
                // wireframe: true,
                side: THREE.DoubleSide,
            }));
            // clay.position.set(link.position.x, link.position.y, 0);
            clay.position.set(-50, -150, 0);
            scene.add(clay);

            // console.log(workPoints);

            // запуск стратегий обработки
            const accuracy = 0.1;
            analyse.runStrategiesToLinkModel(link, workPoints, [
                new OnePath3DStrategy({ link, clayGeometry }, accuracy),
                new DraftMill3DStrategy({ link, clayGeometry, diam: 8, diamDraftDelta: 2 }, accuracy),
            ]);

        });
        analyse.run();

        return;

        let components = projectComponents.getList();
        // let stlModels = projectStlModels.getList();

        let needModels = {};
        // let linkPlanes
        components.forEach(component => {
            component.childs.forEach(ch => {
                needModels[ch.model.uuid] = ch.model;

                // console.log(ch);

            });
        });


        let geometry = needModels[Object.keys(needModels)[0]].mesh.geometry;

        // console.log(geometry);


        // let canvasw = document.getElementById('testCanvas');

        let link = components[0].childs[0];
        // console.log(link, link.size);
        // let planeGrayGeometry = new THREE.PlaneGeometry(link.size.x, link.size.y);
        // let planeGray = new THREE.Mesh(planeGrayGeometry, new THREE.MeshStandardMaterial({color: 0xFF0000, wireframe: true}));
        // planeGray.position.set(link.position.x, link.position.y, 0);

        // link.parentObject.group.add(planeGray);
        // window.setTimeout(() => { link.parentObject.group.remove(planeGray); }, 10000);
        // window.setTimeout(() => {  }, 2000);

        components[0].mesh.visible = false;


        let clayGeometry = new THREE.PlaneGeometry(link.size.x, link.size.y, 1000, 1000);
        clay = new THREE.Mesh(clayGeometry, new THREE.MeshStandardMaterial({
            color: 0x00BB00, 
            // wireframe: true,
            side: THREE.DoubleSide,
        }));
        // clay.position.set(link.position.x, link.position.y, 0);
        clay.position.set(-50, -50, 0);
        scene.add(clay);

        console.log(clay);




        let nx = 1000;
        let ny = 1000;
            
        let arr = clayGeometry.attributes.position.array;
        let dist = link.size.x/nx;
        // console.log({dist});
        
        let lastPx = -1;
        let lastPy = -1;

        const clayCircleDown = (x, y, diam, zDepth, needsUpdate) => {

            let px = Math.floor(x/dist);
            let py = Math.floor(y/dist);


            if(px === lastPx && py === lastPy)
                return;

            const pd = Math.floor(diam/2/dist);

            for(let j=-pd; j<pd; j++){
                let curPy = py+j;
                if(curPy < 0 || curPy >= ny)
                    continue;

                let pdx = Math.floor(Math.sqrt(pd*pd - j*j));
                for(let i=-pdx; i<pdx; i++){
                    let curPx = px+i;
                    if(curPx < 0 || curPx >= nx)
                        continue;


                    let offset = (curPy*(nx+1) + curPx) *clayGeometry.attributes.position.itemSize;
                    if(arr[offset+2] > zDepth){
                        arr[offset+2] = zDepth;
                    }

                }
            }

            if(needsUpdate){
                clayGeometry.attributes.position.needsUpdate = true;
                clayGeometry.computeBoundingBox();
                clayGeometry.computeVertexNormals();
            }

            lastPx = px;
            lastPy = py;
        }



        /**
         * Обрезать массив как изображение
         * @param Uint8Array src исходный массив (изображение формата RGBA)
         * @param number srcWidth ширина исходного изображения
         * @param number srcHeight высота исходного изображения
         * @param number fromLeft координата X начала обрезания
         * @param number fromTop координата Y начала обрезания
         * @param number dstWidth ширина итогового изображения
         * @param number dstHeight высота итогового изображения
         * @returns Uint8Array
         */
        const cropArrayAsImage = (src, srcWidth, srcHeight, fromLeft, fromTop, dstWidth, dstHeight) => {
            const pixelSize = 4;        // RGBA

            srcWidth = parseInt(srcWidth); srcHeight = parseInt(srcHeight);
            fromLeft = parseInt(fromLeft); fromTop = parseInt(fromTop);
            dstWidth = parseInt(dstWidth); dstHeight = parseInt(dstHeight);

            if(src.length !== srcWidth*srcHeight *pixelSize)
                console.error('Wrong size');
            if(srcWidth < fromLeft+dstWidth)
                console.error('Wrong width');
            if(srcHeight < fromTop+dstHeight)
                console.error('Wrong height');

            const dst = new Uint8Array(dstWidth*dstHeight *pixelSize);

            for(let j=0; j<dstHeight; j++){
                const pos = ( (srcHeight-1-(fromTop+j))*srcWidth + fromLeft ) *pixelSize;
                const subArr = src.slice( pos, pos + (dstWidth *pixelSize) );
                dst.set(subArr, ((dstHeight-1-j)*dstWidth) *pixelSize);
            }

            return dst;
        }

        // временный canvas для работы web worker (Cam.worker.js)
        const canvasw = document.createElement('canvas');
        canvasw.width = 1000;
        canvasw.height = 1000;
        // canvasw.width = 500;
        // canvasw.height = 500;
        canvasw.style = 'display: none;';
        document.body.appendChild(canvasw);


        const sd = new ScanDepth();
        sd.runWorker(canvasw, () => {

            // sd.onPixels((pixels) => {

            //     // console.log(pixels);

            //     let w2 = 500;
            //     let h2 = 500*link.size.y/link.size.x;

            //     const pixels2 = cropArrayAsImage(pixels, 500, 500, 0, (500-h2)/2, w2, h2);
            //     // const pixels2 = cropArrayAsImage(pixels, 500, 500, 0, 0, (w2/2), (h2/2));
            //     const texture = new THREE.DataTexture(pixels2, w2, h2, THREE.RGBAFormat);
            //     // console.log(texture);
            //     const pixelsMaterial = new THREE.MeshBasicMaterial({map: texture});
            //     planeGray.material = pixelsMaterial;


            // });

            
            sd.onGrayDepthMap( ({ grayDepthMap, width, height, zCalcMin, zCalcMax }) => {

                // console.log({ grayDepthMap, width, height, zCalcMin, zCalcMax });

                // bb.depth -= zCalcMin*scale;
                // gr2.position.set(0, 0, -bb.depth);

                let workPoints = [];

                // let aspect = bb.width / bb.height;
                let aspect = link.size.x / link.size.y;

                // console.log(link.size, link.position, zCalcMin, zCalcMax);

                for(let j=0; j<height; j+=1){
                    let points3d = [];
                    for(let i=0; i<width; i++){
                        let pos = j*width + i;
                        let gray = grayDepthMap[pos];

                        if(gray === 0x00)
                            continue;

                        let x = (link.size.x * (i - width/2))/width;
                        let y = (link.size.y * (j - height/2))/height * aspect;
                        let z = -link.size.z * gray / 255;

                        // let point = {x, y, z};
                        let point = {
                            x: x,
                            y: y,
                            z: z + (link.size.z + link.position.z),
                        };

                        points3d.push( new THREE.Vector3(point.x, point.y, point.z) );
                        workPoints.push(point);
                    }

                    const geometryByGray = new THREE.BufferGeometry().setFromPoints(points3d);
                    const line = new THREE.Line(geometryByGray, materialHighlight);
                    line.computeLineDistances();
                    line.position.set(50, 50, 0);
                    // scene.add(line);
                    link.parentObject.group.add(line);
                }

                // let workPos = 0;
                // let intervalID = window.setInterval(() => {

                //     let wPoint = workPoints[workPos];
                //     (() => {
                //         // console.log(wPoint);
                //         clayCircleDown(wPoint.x+50, wPoint.y+50, 1, wPoint.z, true);

                //     })();

                //     workPos += 2;
                //     if(workPos >= workPoints.length){
                //         window.clearInterval(intervalID);
                //     }
                // }, 50);


                let progressPerc = 65;
                let time0 = new Date().getTime();
                let workPos = 0;
                while(workPos < workPoints.length *(progressPerc/100)){
                    // console.log(workPos, workPoints.length);
                    let wPoint = workPoints[workPos];
                    clayCircleDown(wPoint.x+50, wPoint.y+50, 0.2, wPoint.z, false);

                    workPos += 1;
                }
                console.log('duration', (new Date().getTime())-time0, 'msec');

                clayGeometry.attributes.position.needsUpdate = true;
                clayGeometry.computeBoundingBox();
                clayGeometry.computeVertexNormals();



                // const matrixPoints = calcMatrixPointsByCircle(0.4, d);
                // clayCircle(30, 20, matrixPoints, 5, false);



                // return;
                // let workPos = 0;
                // let intervalID = window.setInterval(() => {

                //     let wPoint = workPoints[workPos];

                //     (() => {

                //         let aa = props.A;
                //         let ac = props.C - 90;
                //         let rh = equipmentLength +13;
            
                //         let aa2 = aa *Math.PI/180;
                //         let ac2 = ac *Math.PI/180;
            
                //         let tx = wPoint.x;
                //         let ty = wPoint.y;
                //         let tz = wPoint.z;
            
            
                //         let point = {x: co.x, y: co.y, z: -rh};
                //         point = rotY(point, aa2);
                //         point = rotZ(point, ac2);
            
                //         let dx = tx - point.x;
                //         let dy = ty - point.y;
                //         let dz = tz - point.z;
                //         // dx = dy = dz = 0;
            
                //         let x = props.X + dx;
                //         let y = props.Y + dy;
                //         let z = props.Z + dz;
            
                //         head.position.set(x, y, z);
                //     })();

                //     workPos += 5;
                //     if(workPos >= workPoints.length){
                //         window.clearInterval(intervalID);
                //     }
                // }, 50);
            }); 
            

            sd.setGeometry(geometry.clone());

        });

        // console.log('analyse', data, stlModels);

    }


    const apiContext = {
        uuid,
        setScene, setVisionScene, 
        getMouseEvents, 
        getGroup, 
        createInitialBlank, 

        loadSTLModel, parseGeometrySTLModel, 

        selectPanel1Tool, 

        onSelectObjects, onSelectGroupMeshes, 
        getSelectedObjects, getSelectedGroupMeshes, 

        // applyStlToSelectedFromArrayBuffer, 
        applyStlToSelected, 

        setCurrentProject, 
        setProjectComponents, setProjectStlModels, 

        selectObject, 

        analyse,

        context: _this,
    };

    Object.keys(apiContext).map(name => _this[name] = apiContext[name]);

    return apiContext;
}


export default CamModule;

