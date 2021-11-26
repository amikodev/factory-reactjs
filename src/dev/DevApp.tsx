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

import PageStrategy from './PageStrategy';

interface IState{};
interface IProps{};


const devMap = {
    'DraftMill3DStrategy': PageStrategy,
};

/**
 * Приложение для разработки отдельного функционала
 */
class DevApp extends React.Component<IState, IProps>{

    private component: any;

    constructor(props: IProps){
        super(props);

        let pathName = window.location.pathname.replace(/^\/dev/, '');
        pathName = pathName.replace(/^\//, '');

        this.component = null;

        let appName: keyof typeof devMap;
        for(appName in devMap){
            if(pathName === appName){
                const C = devMap[appName];
                this.component = <C />;
            }
        }

    }

    render(){
        let C = this.component;
        return (
            <div style={{padding: 20}}>
                {C === null &&
                    <>
                    dev app <br/>

                    <ul>
                    {Object.keys(devMap).map(appName => {
                        return (
                            <li key={appName}>
                                <a href={'/dev/'+appName}>{appName}</a>
                            </li>
                        );
                    })}
                    </ul>

                    </>
                }

                {C !== null &&
                    <>
                        <a href={'/dev'}>All Apps</a> <br/><br/>
                        {C}
                    </>
                }
            </div>
        );
    }

}

export default DevApp;
