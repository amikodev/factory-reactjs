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


export class EventDispatcher implements EventTarget{

    private listeners: any = {};

    // constructor(){};

    // addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void{
    addEventListener(type: string, callback: any){

        // if(!(type in this.listeners)){
        //     this.listeners[type] = [];
        // }

        if(this.listeners[type] === undefined){
            this.listeners[type] = [];
        }

        if(typeof callback === 'function'){
            this.listeners[type].push(callback);
        }

    }

    removeEventListener(type: string, callback: any){
        if(this.listeners[type] === undefined)
            return;    
        
        this.listeners[type] = this.listeners[type].filter( (f: any) => (f !== callback) );

    }

    eventDispatch(event: DispatchableEvent){
    
        if(this.listeners[event.type] !== undefined){
            this.listeners[event.type].forEach((func: any) => {
                func(event);
            });
        }

        if(this.listeners['all'] !== undefined){
            this.listeners['all'].forEach((func: any) => {
                func(event);
            });
        }
        
    }

    /**
     * @deprecated
     */
    dispatchEvent(event: Event): boolean{
        throw new Error('Method dispatchEvent not allowed');
        return false;
    }

}

export class DispatchableEvent{

    type: string;
    params: object;

    constructor(type: string, params: object){

        this.type = type;
        this.params = params;
    }

}
