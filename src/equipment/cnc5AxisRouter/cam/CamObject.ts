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

import {v4 as uuidv4} from 'uuid';

import { EventDispatcher, DispatchableEvent } from './EventDispatcher';
import CamSupportObject from './CamSupportObject';

const CAM_TYPE: string = 'CamObject';

export type Point = {
    x: number;
    y: number;
    z: number;
    a: number;
    b: number;
    c: number;
};

export type Point2 = {
    x: number;
    y: number;
};

export type Point3 = {
    x: number;
    y: number;
    z: number;
};

export type Point3Array = [number, number, number];

export type CamObjectParams = {
    size: Point3;
    position: Point3;
    rotation: Point3;
    visible: boolean;
};

export type CamBoundSize = {
    width: number;
    height: number;
    depth: number;
};



class CamObject{

    protected _uuid: string = '00000000-0000-0000-0000-000000000000';
    protected _intersectObjects: THREE.Mesh[] = [];
    protected _object: CamObject;

    protected _caption: string;

    protected _size: Point3 = {x: 0, y: 0, z: 0};
    protected _position: Point3 = {x: 0, y: 0, z: 0};
    protected _rotation: Point3 = {x: 0, y: 0, z: 0};
    protected _visible: boolean = true;

    protected _parentObject: CamObject | null = null;
    protected _childs: CamObject[] = [];
    protected _supportObjects: CamSupportObject[] = [];

    protected _group: THREE.Group;
    protected _mesh: THREE.Mesh;
    protected _events: EventDispatcher;

    constructor(){

        this._uuid = uuidv4().toUpperCase();
        this._object = this;

        this._group = new THREE.Group();
        this._mesh = new THREE.Mesh();
        this._events = new EventDispatcher();

        this._caption = 'CamObject: '+this.uuid.split('-').splice(-1);

    }

    set uuid(id: string){
        this._uuid = id;
    } 

    get uuid(): string{
        return this._uuid;
    }

    set caption(capt: string){
        this._caption = capt;
    }

    get caption(): string{
        return this._caption;
    }

    get childs(): any[]{
        // return this._childs;
        let chs: (CamObject | CamSupportObject)[] = [];
        chs = chs.concat(...this._childs, ... this._supportObjects);
        return chs;
    }


    set size(p: Point3){
        this._size = p;
        this._events.eventDispatch(new DispatchableEvent('size', {size: p}));
    }

    get size(): Point3{
        return this._size;
    }


    set position(p: Point3){
        this._position = p;
        this._group.position.set(p.x, p.y, p.z);
        this._events.eventDispatch(new DispatchableEvent('position', {position: p}));
    }

    set positionArray(pArr: Point3Array){
        const p: Point3 = {x: pArr[0], y: pArr[1], z: pArr[2]};
        this.position = p;
    }

    get position(): Point3{
        return this._position;
    }


    set rotation(p: Point3){
        this._rotation = p;
        this._group.rotation.set(p.x*Math.PI/180, p.y*Math.PI/180, p.z*Math.PI/180);
        this._events.eventDispatch(new DispatchableEvent('rotation', {rotation: p}));
    }

    set rotationArray(pArr: Point3Array){
        const p: Point3 = {x: pArr[0], y: pArr[1], z: pArr[2]};
        this.rotation = p;
    }

    get rotation(): Point3{
        return this._rotation;
    }


    set visible(vis: boolean){
        this._group.visible = vis;
        if(this._visible !== vis){
            this._visible = vis;
            this._events.eventDispatch(new DispatchableEvent('visible', {visible: vis}));
        }
    }

    get visible(): boolean{
        return this._visible;
    }


    /**
     * Установка параметров
     */
     setParams(params: CamObjectParams){
        this.size = params.size;
        this.position = params.position;
        this.rotation = params.rotation;
        this.visible = params.visible;
    }

    /**
     * Получение параметров
     */
    get params(): CamObjectParams{
        return {
            size: this._size,
            position: this._position,
            rotation: this._rotation,
            visible: this._visible,
        };
    }

    get object(): CamObject{
        return this._object;
    }

    get intersectObjects(): THREE.Mesh[]{
        return this._intersectObjects;
    }

    set group(gr: THREE.Group){
        this._group = gr;
    }

    get group(): THREE.Group{
        return this._group;
    }

    set mesh(mesh: THREE.Mesh){
        this._mesh = mesh;
    }

    get mesh(): THREE.Mesh{
        return this._mesh;
    }

    get events(): EventDispatcher{
        return this._events;
    }

    set parentObject(parent: CamObject | null){
        this._parentObject = parent;
    }

    get parentObject(): CamObject | null{
        return this._parentObject;
    }

    get dataForSave(): any{
        return {
            type: CAM_TYPE, 
            uuid: this._uuid,
        };
    }
    

    addSupportObject(object: CamSupportObject){
        this._group.add(object.object3d);
        this._supportObjects.push(object);
    }

    removeSupportObject(object: CamSupportObject){
        this._group.remove(object.object3d);
        this._supportObjects = this._supportObjects.filter(obj => obj !== object);
    }

    get supportObjects(): CamSupportObject[]{
        return this._supportObjects;
    }

};



export default CamObject;

