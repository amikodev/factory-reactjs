/*
amikodev/factory-reactjs - Industrial equipment management with ReactJS
Copyright © 2020 Prihodko Dmitriy - asketcnc@yandex.ru
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
// import { makeStyles } from '@material-ui/core/styles';

import './App.css';
import 'fontsource-roboto';

// import { Button } from '@material-ui/core';

import AppsIcon from '@material-ui/icons/Apps';
import BuildIcon from '@material-ui/icons/Build';
import MemoryIcon from '@material-ui/icons/Memory';
import InfoIcon from '@material-ui/icons/Info';
import ChangeHistoryIcon from '@material-ui/icons/ChangeHistory';


import {AppContext} from './AppContext';

import MainMenu from './MainMenu';
import Equipments from './Equipments';
import About from './About';
import Macros from './Macros';

import CncRouter from './equipment/CncRouter';
import FreqConverter from './equipment/freqConv/FreqConverter';


import CncRouterSettings from './settings/CncRouterSettings';

import TestCrossOffset from './TestCrossOffset';

// import { render } from 'react-dom';
// import { withStyles } from '@material-ui/core/styles';


// const TAB_EQUIPMENTS = 0;
const TAB_EQUIPMENT = 1;
// const TAB_SETTINGS = 2;
// const TAB_MACROS = 3;
// const TAB_ABOUT = 4;

// const useStyles = makeStyles((theme) => ({
// // const useStyles = theme => ({
//     root: {
//         '& .MuiTab-root': {
//             width: 0,
//             minWidth: 0,

//         },
//         // flexGrow: 1,
//         // width: '100%',
//         // backgroundColor: theme.palette.background.paper,
//         width: 0,
//         minWidth: 0,
//     },
// // });
// }));


class App extends React.Component{


    constructor(props){
        super(props);

        this.handleEquipmentWsRecieve = this.handleEquipmentWsRecieve.bind(this);
        this.addListenerWsRecieve = this.addListenerWsRecieve.bind(this);
        this.removeListenerWsRecieve = this.removeListenerWsRecieve.bind(this);
        this.wsPrepareData = this.wsPrepareData.bind(this);
        this.concatenateBuffer = this.concatenateBuffer.bind(this);
        this.floatToArray = this.floatToArray.bind(this);

        this.state = {
            currentEquipment: null,
            equipmentComponent: null,
            equipmentSettingsComponent: null,
            // equipmentComponentName: null,
        };

        this.mainMenuRef = React.createRef();


        this.listenersWsRecieve = {};

        // this.ws = null;
        window.Equipments.initItems();
        // console.log(window.Equipments);
    }

    handleEquipmentSelect(item, autoChangeTab=true){

        let component = null;
        component = 'TAB_EQUIPMENT';
        let componentSettings = null;
        switch(item.type){
            case Equipments.TYPE_CNC_ROUTER:
                component = <CncRouter item={item} />;
                componentSettings = <CncRouterSettings item={item} />;
                break;
            case Equipments.TYPE_FREQ_CONVERTER:
                component = <FreqConverter item={item} />;
                break;
            default:
                break;
        }

        this.setState({
            currentEquipment: item, 
            equipmentComponent: component, 
            equipmentSettingsComponent: componentSettings,
        }, () => {

            if(autoChangeTab)
                this.mainMenuRef.current.changeTab(TAB_EQUIPMENT);

            console.log(component);
        });
    }

    getEquipmentComponent(item){
        let component = null;
        component = 'TAB_EQUIPMENT';
        switch(item.type){
            case Equipments.TYPE_CNC_ROUTER:
                component = <CncRouter item={item} />;
                break;
            case Equipments.TYPE_FREQ_CONVERTER:
                component = <FreqConverter item={item} />;
                break;
            default:
                break;
        }
        return component;        
    }

    getEquipmentSettingsComponent(item){
        let componentSettings = null;
        switch(item.type){
            case Equipments.TYPE_CNC_ROUTER:
                componentSettings = <CncRouterSettings item={item} />;
                break;
            case Equipments.TYPE_FREQ_CONVERTER:
                break;
            default:
                break;
        }
        return componentSettings;
    }

    handleEquipmentWsRecieve(item, data){
        if(typeof this.listenersWsRecieve[item.name] !== "undefined"){
            this.listenersWsRecieve[item.name].map(func => {
                if(typeof func === "function"){
                    func(data);
                }
                return null;
            });
        }
    }

    addListenerWsRecieve(name, func){
        if(typeof this.listenersWsRecieve[name] === "undefined"){
            this.listenersWsRecieve[name] = [];
        }
        let length = this.listenersWsRecieve[name].push(func);
        let ind = length-1;
        return ind;
    }

    removeListenerWsRecieve(name, ind){
        // console.log('listenersWsRecieve', this.listenersWsRecieve);
        // console.log('removeListenerWsRecieve', name, ind);
        if(typeof this.listenersWsRecieve[name] !== "undefined"){
            // console.log(name, ind, this.listenersWsRecieve[name].length);
            if(ind < this.listenersWsRecieve[name].length){
                this.listenersWsRecieve[name][ind] = null;
            }
        }
        // console.log('listenersWsRecieve', this.listenersWsRecieve);
    }

    wsPrepareData(data){
        const size = 16;
        let byteArray = new Uint8Array(size);
        for(let i=0; i<size; i++){
            byteArray[i] = 0x00;
        }

        if(data !== null && typeof data === "object"){
            data.map((val, ind) => {
                byteArray[ind] = val & 0xFF;
                return null;
            });
        }

        return byteArray.buffer;
    }

    concatenateBuffer(resultConstructor, ...arrays){
        let totalLength = 0;
        for(const arr of arrays){
            totalLength += arr.length;
        }
        const result = new resultConstructor(totalLength);
        let offset = 0;
        for(const arr of arrays){
            result.set(arr, offset);
            offset += arr.length;
        }
        return result;
    }

    floatToArray(value){
        let fvalue = parseFloat(value);
        if(isNaN(fvalue)){
            throw new Error(('Ошибка парсинга float "'+value+'"'));
        }

        // преобразование float в массив hex
        var view = new DataView(new ArrayBuffer(4));
        view.setFloat32(0, parseFloat(fvalue));
        // hexArr = Array.apply(null, { length: 4 }).map((_, i) => view.getUint8(i));
        let hexArr = Array.apply(null, { length: 4 }).map((_, i) => view.getUint8(3-i));

        return hexArr;
    }


    componentDidMount(){

        let items = window.Equipments.getItems();
        if(items.length === 1){
            this.handleEquipmentSelect(items[0]);
        }

    }

    render(){

        // const classes = useStyles();

        // const classes = {};

        // console.log(classes);



        let menuItems = [];

        if(window.Equipments.getItems().length > 1){
            menuItems.push(
                {
                    caption: 'Оборудование', 
                    icon: <AppsIcon />, 
                    component: 
                        <Equipments 
                            onSelect={(item) => this.handleEquipmentSelect(item)}
                            onWsRecieve={(item, data) => this.handleEquipmentWsRecieve(item, data)}
                        />
                }
            );
        } else{
            // console.log(classes);
            menuItems.push(
                {
                    caption: '', 
                    // icon: <AppsIcon />, 
                    component: 
                        <Equipments 
                            onSelect={(item) => this.handleEquipmentSelect(item)}
                            onWsRecieve={(item, data) => this.handleEquipmentWsRecieve(item, data)}
                        />,
                    disabled: true,
                    style: {
                        minWidth: 0,
                        padding: 0,
                    },
                    // classes: classes,
                    // classes: {
                    //     root: classes.root,
                    // }
                }
            );
        }
        menuItems.push(
            {
                caption: this.state.currentEquipment === null ? 'Станок' : this.state.currentEquipment.caption, 
                icon: <MemoryIcon />, 
                // component: this.state.equipmentComponent, 
                component: (

                    window.Equipments.getItems().map(item => {
                        // console.log(item.caption);
                        return (
                            <div 
                                key={item.name}
                                hidden={this.state.currentEquipment !== null && this.state.currentEquipment.name !== item.name}
                            >
                                {/* {item.caption} */}
                                {this.getEquipmentComponent(item)}
                            </div>
                        );
                    })
            
                ),
                disabled: this.state.currentEquipment === null
            }
        );
        menuItems.push(
            {
                caption: 'Настройки', 
                icon: <BuildIcon />, 
                component: this.state.equipmentSettingsComponent, 
                disabled: this.state.equipmentSettingsComponent === null
            }
        );
        menuItems.push(
            {caption: 'Макросы', icon: <ChangeHistoryIcon />, component: <Macros />}
        );
        menuItems.push(
            {caption: 'О программе', icon: <InfoIcon />, component: <About />}
        );

        return (
            <div className="App">
                <AppContext.Provider value={{
                    // ws: this.ws,
                    addListenerWsRecieve: this.addListenerWsRecieve,
                    removeListenerWsRecieve: this.removeListenerWsRecieve,
                    wsPrepareData: this.wsPrepareData,
                    concatenateBuffer: this.concatenateBuffer,
                    floatToArray: this.floatToArray,
                }}>
                    <MainMenu ref={this.mainMenuRef} items={menuItems} />
                    {/* <MainMenu ref={this.mainMenuRef} items={[
                        {
                            caption: 'Оборудование', 
                            icon: <AppsIcon />, 
                            component: 
                                <Equipments 
                                    onSelect={(item) => this.handleEquipmentSelect(item)}
                                    onWsRecieve={(item, data) => this.handleEquipmentWsRecieve(item, data)}
                                />
                        },
                        {
                            caption: this.state.currentEquipment === null ? 'Станок' : this.state.currentEquipment.caption, 
                            icon: <MemoryIcon />, 
                            // component: this.state.equipmentComponent, 
                            component: (

                                window.Equipments.getItems().map(item => {
                                    // console.log(item.caption);
                                    return (
                                        <div 
                                            key={item.name}
                                            hidden={this.state.currentEquipment !== null && this.state.currentEquipment.name !== item.name}
                                        >
                                            {/* {item.caption} * /}
                                            {this.getEquipmentComponent(item)}
                                        </div>
                                    );
                                })
                        
                            ),
                            disabled: this.state.currentEquipment === null
                        },
                        {
                            caption: 'Настройки', 
                            icon: <BuildIcon />, 
                            component: this.state.equipmentSettingsComponent, 
                            disabled: this.state.equipmentSettingsComponent === null
                        },
                        {caption: 'Макросы', icon: <ChangeHistoryIcon />, component: <Macros />},
                        {caption: 'О программе', icon: <InfoIcon />, component: <About />},
                    ]}/> */}
                </AppContext.Provider>
    
                {/* <div style={{paddingLeft: 20}}>
                    <TestCrossOffset />
                </div> */}

            </div>
        );
    
    }
}

export default App;
// export default withStyles(useStyles)(App);
