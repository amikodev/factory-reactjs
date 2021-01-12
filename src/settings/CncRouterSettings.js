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


import {AppContext} from '../AppContext';


import { withStyles } from '@material-ui/core/styles';
const useStyles = theme => ({
    root: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            // marginTop: theme.spacing(1),
            // marginBottom: theme.spacing(1),
            // width: '100%',
        },
        '& .MuiButton-root': {
            margin: theme.spacing(1),
            // marginTop: theme.spacing(1),
            // marginBottom: theme.spacing(1),
            // width: '100%',
            width: '-webkit-fill-available',
        },
    },
});

class CncRouterSettings extends React.Component{

    static contextType = AppContext;


    render(){

        return (
            <div>
                
                CncRouter settings

            </div>
        );
    }

}

CncRouterSettings.defaultProps = {
    item: {},                   // свойства оборудования

};

export default withStyles(useStyles)(CncRouterSettings);

