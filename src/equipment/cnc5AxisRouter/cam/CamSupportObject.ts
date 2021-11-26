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


class CamSupportObject{

    private _uuid: string = '00000000-0000-0000-0000-000000000000';
    private _object: CamSupportObject;

    private _object3d: THREE.Object3D;
    private _events: EventDispatcher;

    private _caption: string;
    private _visible: boolean;

    constructor(object3d: THREE.Object3D){

        this._uuid = uuidv4().toUpperCase();
        this._object = this;
        this._object3d = new THREE.Object3D();
        this._events = new EventDispatcher();

        this._object3d = object3d;

        this._caption = 'CamSupport: '+this.uuid.split('-').splice(-1);
        this._visible = true;

    }

    set uuid(id: string){
        this._uuid = id;
    } 

    get uuid(): string{
        return this._uuid;
    }

    get object(): CamSupportObject{
        return this._object;
    }


    set caption(capt: string){
        this._caption = capt;
    }

    get caption(): string{
        return this._caption;
    }

    set visible(vis: boolean){
        this._object3d.visible = vis;
        if(this._visible !== vis){
            this._visible = vis;
            this._events.eventDispatch(new DispatchableEvent('visible', {visible: vis}));
        }
    }

    get visible(): boolean{
        return this._visible;
    }

    get object3d(): THREE.Object3D{
        return this._object3d;
    }

    get events(): EventDispatcher{
        return this._events;
    }

}

export default CamSupportObject;
