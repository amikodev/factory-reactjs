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
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import DevApp from './dev/DevApp.tsx';

import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';

import reducer from './reducers';



const getApp = () => {

    // приложение для разработки отдельного функционала
    const pathName = window.location.pathname;
    if(pathName.match(/^\/dev/)){
        const app = <DevApp />;
        return app;
    }


    // основное приложение

    // имя используемого оборудования в Equipments.js
    let equipmentName = document.getElementById('root').getAttribute('data-equipment-name');

    console.log('equipmentName', equipmentName);
    if(equipmentName === null){
        window.Equipments.initItems();
    } else{
        window.Equipments.initItem(equipmentName);
    }

    // redux
    // let store = createStore(reducer, composeWithDevTools(applyMiddleware(thunk)));
    let store = createStore(reducer(window.Equipments.getItems()), composeWithDevTools(applyMiddleware(thunk)));

    const app = 
        <Provider store={store}>
            <App equipmentName={equipmentName}/>
        </Provider>    
    ;
    return app;
}

const app = getApp();
ReactDOM.render(
    app,
    document.getElementById('root')
);
