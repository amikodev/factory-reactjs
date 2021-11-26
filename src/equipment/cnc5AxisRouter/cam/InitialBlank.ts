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

// import { assert } from 'console';
import * as THREE from 'three';
// import { createMultiMaterialObject } from 'three/examples/jsm/utils/SceneUtils';
// import * as SceneUtils from 'three/examples/jsm/utils/SceneUtils';

import {v4 as uuidv4} from 'uuid';

import CamObject from './CamObject';
import { Point3, Point3Array, CamObjectParams } from './CamObject';
import { StlModelLink, material as stlMaterial } from './StlModel';

import { EventDispatcher, DispatchableEvent } from './EventDispatcher';


const CAM_TYPE: string = 'InitialBlank';

enum Type {
    Plane = 1, 
    Box, 
    Cylinder
};

// const INITIAL_BLANK_TYPE_PLANE = 1;
// const INITIAL_BLANK_TYPE_BOX = 2;
// const INITIAL_BLANK_TYPE_CYLINDER = 3;

const materials:Array<THREE.MeshBasicMaterial> = [
    new THREE.MeshBasicMaterial( { color: 0x888888, opacity: 0.5, transparent: true, } ),    
    new THREE.MeshBasicMaterial( { color: 0xEEEEEE, wireframe: true, } ),    
];

const defaultParams = {
    [Type.Plane]:    { x: 200, y: 200, z: 20 },
    [Type.Box]:      { x: 200, y: 200, z: 200 },
    [Type.Cylinder]: { x: 200, y: 0, z: 300 },
};


class InitialBlank extends CamObject{

    private _type: Type;

    // private group: THREE.Group;
    private obj: THREE.Group | null = null;
    // private _mesh: THREE.Mesh | null = null;

    private stlModelLinks: StlModelLink[] = [];

    private isRemoved: boolean = false;

    // private size: Point3 = <Point3>{};

    constructor(type: Type){
        super();

        this._uuid = uuidv4().toUpperCase();
        this._type = type;

        // this.group = new THREE.Group();

        // this.setSize(defaultParams[type]);
        this.size = defaultParams[type];

    }

    get type(): Type{
        return this._type;
    }

    createTypePlane(size: Point3): THREE.Group{
        return this.createTypeBox(size);
    }

    createTypeBox(size: Point3): THREE.Group{

        let depth = size.z;

        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const gr = new THREE.Group();

        const mesh0 = new THREE.Mesh(geometry, materials[0]);
        const mesh1 = new THREE.Mesh(geometry, materials[1]);

        mesh0.position.set(0, 0, -depth/2);
        mesh1.position.set(0, 0, -depth/2);

        mesh0.name = 'CamModule';
        // mesh0.userData = { type: CAM_TYPE, camObject: this };
        mesh0.userData = { camObject: this };

        gr.add(mesh0);
        gr.add(mesh1);

        this._intersectObjects.push(mesh0);
        this._mesh = mesh0;

        // console.log(gr);
        return gr;

    }

    createTypeCylinder(size: Point3): THREE.Group{

        // console.log(size);

        const diameter = size.x;
        const height = size.z;

        const geometry = new THREE.CylinderGeometry(diameter/2, diameter/2, height, 32);
        const gr = new THREE.Group();

        const mesh0 = new THREE.Mesh(geometry, materials[0]);
        const mesh1 = new THREE.Mesh(geometry, materials[1]);

        mesh0.rotation.set(Math.PI/2, 0, 0);
        mesh1.rotation.set(Math.PI/2, 0, 0);

        mesh0.position.set(0, 0, -height/2);
        mesh1.position.set(0, 0, -height/2);

        mesh0.name = 'CamModule';
        // mesh0.userData = { type: CAM_TYPE, camObject: this };
        mesh0.userData = { camObject: this };

        gr.add(mesh0);
        gr.add(mesh1);

        this._intersectObjects.push(mesh0);
        this._mesh = mesh0;

        // console.log(gr);
        return gr;

    }

    set size(s: Point3){

        if(this.obj !== null){
            this._group.remove(this.obj);
            this.obj = null;
        }

        this.obj = this.create(s);
        if(this.obj !== null){
            this._group.add(this.obj);
        }

        // this.callEvents({size});
        this._events.eventDispatch(new DispatchableEvent('size', {size: s}));

    }

    // setSize(size: Point3){

    //     if(this.obj !== null){
    //         this._group.remove(this.obj);
    //         this.obj = null;
    //     }

    //     this.obj = this.create(size);
    //     if(this.obj !== null){
    //         this._group.add(this.obj);
    //     }

    //     // this.callEvents({size});
    //     this._events.eventDispatch(new DispatchableEvent('size', {size}));
    // }

    /**
     * Создание объекта заготовки
     * @param size размеры
     * @returns 
     */
    create(size: Point3): THREE.Group | null{
        let obj: THREE.Group | null = null;

        this._size = size;

        this._intersectObjects = [];

        if(this.type === Type.Plane){
            obj = this.createTypePlane(size);
        } else if(this.type === Type.Box){
            obj = this.createTypeBox(size);
        } else if(this.type === Type.Cylinder){
            obj = this.createTypeCylinder(size);
        }

        return obj;
    }

    // GetGroup(): THREE.Group{
    //     return this.group;
    // }

    // GetMesh(): THREE.Mesh|null{
    //     return this.mesh;
    // }

    // get mesh(): THREE.Mesh{
    //     return this._mesh;
    // }

    // setPosition(point: Point3){
    //     const p = point;
    //     this.position = point;
    //     this._group.position.set(p.x, p.y, p.z);
    //     // callEvents('position', {position: p});
    //     this._events.eventDispatch(new DispatchableEvent('position', {position: p}));
    // }

    // setRotation(point: Point3){
    //     const p = point;
    //     this.rotation = point;
    //     this.group.rotation.set(p.x*Math.PI/180, p.y*Math.PI/180, p.z*Math.PI/180);
    //     // callEvents('rotation', {rotation: p});
    //     this._events.eventDispatch(new DispatchableEvent('rotation', {rotation: p}));
    // }

    // setVisible(visible: boolean){
    //     this.group.visible = visible;
    //     if(visible !== this.visible){
    //         this.visible = visible;
    //         // callEvents('visible', {visible});
    //         this._events.eventDispatch(new DispatchableEvent('visible', {visible}));
    //     }
    // }

    // /**
    //  * Установка параметров
    //  */
    // setParams(params: CamObjectParams){

    //     // this.setSize(params.size);

    //     this.size = params.size;
    //     this.position = params.position;
    //     this.rotation = params.rotation;
    //     this.visible = params.visible;

    //     // this.setPosition(params.position);
    //     // this.setRotation(params.rotation);
    //     // this.setVisible(params.visible);
        
    // }


    // getPositionWithMesh(): Point3{
    //     const pos = this.group.position.clone();
    //     if(this.mesh !== null){
    //         pos.x += this.mesh.position.x;
    //         pos.y += this.mesh.position.y;
    //         pos.z += this.mesh.position.z;
    //     }
    //     return pos;
    // }

    remove(){

        this._events.eventDispatch(new DispatchableEvent('remove', {}));
        this.isRemoved = true;

    }


    get dataForSave(): any{

        const childsData = this._childs.map(el => el.dataForSave);

        return {
            type: CAM_TYPE,
            uuid: this._uuid,
            subType: this.type,
            params: this.params,
            childs: childsData,
        };
    }
    

    // getDataForSave(): object{

    //     let childs: CamObject[] = [];



    //     const data = {
    //         type: CAM_TYPE,
    //         subType: this.type,
    //         params: this.params,
    //     };
    //     return data;
    // }

    addStlModelLink(stlModelLink: StlModelLink){

        // this.stlModelLinks.push(stlModelLink);


        const object: THREE.Mesh | null = this._mesh;
        // console.log(object);
        if(object === null)
            return;


        let ar = object.geometry.attributes.position.array;

        // // геометрия группы сеток
        // const mg = l.mesh.geometry;
        // mg.computeBoundingBox();
        // mg.computeVertexNormals();


        let ggr: any = object.geometry.groups[stlModelLink.faceGroupIndex];
        if(object.geometry.index !== null){

            let ar2: number[] = Array.from(object.geometry.index.array).slice(ggr.start, ggr.start+ggr.count);

            // let ar2: number[] = object.geometry.index.array.slice(ggr.start, ggr.start+ggr.count);
            let vps: number[] = [];
            ar2.map(posIndex => {
                vps.push(...Array.from(ar).slice(posIndex*3, posIndex*3+3));
            });
            const vertices = new Float32Array(vps);
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

            geometry.computeBoundingBox();
            geometry.computeVertexNormals();

            // console.log(geometry);

            if(this.type === Type.Plane){
                this.addStlToPlane(stlModelLink, geometry);
            } else if(this.type === Type.Box){
                this.addStlToBox(stlModelLink, geometry);
            } else if(this.type === Type.Cylinder){
                this.addStlToCylinder(stlModelLink, geometry);
            }


        }


    }

    private addStlToPlane(stlModelLink: StlModelLink, geometry: THREE.BufferGeometry){

    }

    private addStlToBox(stlModelLink: StlModelLink, geometry: THREE.BufferGeometry){

        const bb: THREE.Box3 | null = geometry.boundingBox;

        if(bb === null)
            return;

        const bbc = {
            x: (bb.max.x + bb.min.x)/2,
            y: (bb.max.y + bb.min.y)/2,
            z: (bb.max.z + bb.min.z)/2,
        };

        const normal = Array.from(geometry.attributes.normal.array).slice(0, geometry.attributes.normal.itemSize);

        const stlMesh = stlModelLink.model.mesh;

        const group = new THREE.Group();
        const stlMesh2 = stlMesh.clone();
        stlMesh2.name = 'CamModule';
        stlMesh2.userData = {camObject: stlModelLink};
        stlMesh2.material = stlMaterial.clone();
        group.add(stlMesh2);

        stlModelLink.group = group;

        // вычисление угла поворота и положения stl модели
        // [-1, 0, 1]

        const boundSize = stlModelLink.model.boundSize;

        const matrixPosition = [
            [[bbc.x+boundSize.depth, 0, 0], [0, 0, 0], [bbc.x-boundSize.depth, 0, 0]],      // x
            [[0, bbc.y+boundSize.depth, 0], [0, 0, 0], [0, bbc.y-boundSize.depth, 0]],      // y
            [[0, 0, bbc.z+boundSize.depth], [0, 0, 0], [0, 0, bbc.z-boundSize.depth]],      // z
        ];
        // const matrixPosition = [
        //     [[bbc.x, 0, 0], [0, 0, 0], [bbc.x, 0, 0]],      // x
        //     [[0, bbc.y, 0], [0, 0, 0], [0, bbc.y, 0]],      // y
        //     [[0, 0, bbc.z], [0, 0, 0], [0, 0, bbc.z]],      // z
        // ];

        // const matrixRotation = [
        //     [[0, -Math.PI/2, 0], [0, 0, 0], [0, Math.PI/2, 0]],     // x
        //     [[Math.PI/2, 0, 0], [0, 0, 0], [-Math.PI/2, 0, 0]],     // y
        //     [[Math.PI, 0, 0], [0, 0, 0], [0, 0, 0]],                // z
        // ];
        const matrixRotation = [
            [[0, -90, 0], [0, 0, 0], [0, 90, 0]],     // x
            [[90, 0, 0], [0, 0, 0], [-90, 0, 0]],     // y
            [[180, 0, 0], [0, 0, 0], [0, 0, 0]],      // z
        ];

        const position: Point3Array = [0, 0, 0];
        const rotation: Point3Array = [0, 0, 0];

        for(let i=0; i<3; i++){
            let n = normal[i];
            let p = matrixPosition[i][n+1];
            let r = matrixRotation[i][n+1];
            for(let j=0; j<position.length; j++){
                position[j] += p[j];
            }
            for(let j=0; j<rotation.length; j++){
                rotation[j] += r[j];
            }
        }

        position[2] -= this._size.z/2;

        // console.log(stlModelLink.uuid, position, this._size);

        // group.position.set(position[0], position[1], position[2]);
        // stlModelLink.position = {x: position[0], y: position[1], z: position[2]};
        stlModelLink.size = {x: boundSize.width, y: boundSize.height, z: boundSize.depth};
        stlModelLink.positionArray = position;
        stlModelLink.rotationArray = rotation;
        // group.rotation.set(rotation[0], rotation[1], rotation[2]);
        this.group.add(group);

        this.stlModelLinks.push(stlModelLink);
        this._childs.push(stlModelLink);

        stlModelLink.parentObject = this;

        this._intersectObjects.push(stlMesh2);
        this._events.eventDispatch(new DispatchableEvent('addStlModelLink', {stlModelLink}));


    }

    private addStlToCylinder(stlModelLink: StlModelLink, geometry: THREE.BufferGeometry){

    }


    addChild(child: CamObject){

        this.group.add(child.group);
        this._childs.push(child);

    }

}


export default InitialBlank;

export { CAM_TYPE, Type };
