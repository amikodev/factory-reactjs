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

import { withStyles } from '@material-ui/core/styles';
const useStyles = theme => ({

    root: {

    },
});


/**
 * Шаблон страницы
 */
class _Template extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

        this.state = {
            
        };

    }


    render(){

        const { classes } = this.props;

        return (
            <div className={classes.root}>

                _Template

            </div>
        );
    }

}

_Template.defaultProps = {

};


export default withStyles(useStyles)(_Template);


