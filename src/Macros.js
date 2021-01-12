/*
amikodev/factory-reactjs - Industrial equipment management with ReactJS
Copyright © 2020 Prihodko Dmitriy - prihdmitriy@yandex.ru
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

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';


import Equipments from './Equipments';

class Macros extends React.Component{


    constructor(props){
        super(props);

        this.state = {

            runError: null,

        };

    }


    handleRunClick(event){

        console.log('run macros');
        let macros = `

let plasma = Equipments.getItem('cncPlasma');
console.log(plasma);
let container = document.getElementById('macrosCustom');
let params = plasma.params;
container.innerHTML = '<h3>'+plasma.caption+'</h3> <ul>'+Object.keys(params).map(key => ('<li>'+key+' = '+params[key]+'</li>') ).join('')+'</ul>';
        
        `;

        let prog = '(function(){'+macros+'})()';
        this.setState({runError: null});

        try{
            eval(prog);
        } catch(e){
            // console.log('js error', e.stack);
            // console.log(Object.keys(e));
            this.setState({runError: e.stack});
        }


    }

    render(){

        return (
            <div>

                <Button color="primary" onClick={e => this.handleRunClick(e)}>{('Run')}</Button>

                {this.state.runError &&
                // <div style={{height: '12rem', overflow: 'scroll'}}>
                <Paper elevation={3} style={{height: '12rem', overflow: 'scroll', padding: '1rem'}}>
                    <Typography component="pre" color="error">
                        {this.state.runError}
                    </Typography>
                {/* // </div> */}
                </Paper>
                }


                <div id="macrosCustom"></div>

            </div>

            

        );
    }
}


export default Macros;
