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

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Slider from '@material-ui/core/Slider';
import Button from '@material-ui/core/Button';

import {AppContext} from './AppContext';

import { withStyles } from '@material-ui/core/styles';

const useStyles = theme => ({
    root: {
        '& .MuiButton-root': {
            margin: theme.spacing(1),
        },
        '& .MuiSlider-root': {
            marginBottom: -theme.spacing(1),
            marginTop: theme.spacing(5),
            marginLeft: theme.spacing(2),
            width: '80%',
        },

    },

});

/**
 * Параметры для настройки
 */
class ParamSide extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);


    }

    handleChange(event, name){

        if(typeof this.props.onChange === "function"){
            this.props.onChange(name, event.target.value);
        }
    }

    render(){

        const { classes } = this.props;

        return (
            <div className={classes.root}>

                {this.props.items.map((item, ind) => {
                    if(Object.keys(item).length > 0){
                        return ( 
                            <TextField
                                key={ind}
                                label={item.caption} 
                                type={(item.type ?? "string")}
                                margin="dense" 
                                fullWidth 
                                InputLabelProps={{ shrink: true, }} 
                                inputProps={{
                                    step: item.step
                                }}
                                variant="outlined" 
                                value={item.value} 
                                onChange={e => this.handleChange(e, item.name)} 
                            />
                        );
                    } else{
                        return ( <hr/> );
                    }
                })}

            </div>
        );
    }

}

ParamSide.defaultProps = {
    items: {},                  // список параметров
    onChange: null,
};

export default withStyles(useStyles)(ParamSide);


