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
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Paper from '@material-ui/core/Paper';


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

        '& .MuiPaper-root': {
            padding: theme.spacing(0.5),
        }

    },

});


/**
 * API
 */
const API = () => {

    /**
     * Получение значений из хранилища по списку имён
     * @param {string} paramsName имя параметров
     * @param {array} names массив ключей параметров
     * @param {callback} func функция обратного вызова
     * @returns 
     */
    const readValues = (paramsName, names=[], func) => {

        let values = {};
        names.map(name => {
            let value = localStorage.getItem(paramsName+"_"+name);
            values[name] = value;
            if(typeof func === 'function'){
                func(name, value);
            }
        });

        return values;

    }

    /**
     * Получение значений из хранилища
     * @param {string} paramsName имя параметров
     * @param {array} names массив ключей параметров
     * @param {callback} func функция обратного вызова
     * @returns 
     */
     const readStorage = (paramsName, func) => {

        let values = {};
        for(let i=0; i<localStorage.length; i++){
            let key = localStorage.key(i);
            if(key.indexOf(paramsName) === 0){
                let re = new RegExp("^"+paramsName+"_(.*)$", "g");
                let name = key.replace(re, "$1");
                let value = localStorage.getItem(key);
                values[name] = value;
                if(typeof func === 'function'){
                    func(name, value);
                }
            }
        }

        return values;
    }

    return {
        readValues, readStorage, 
    };
};

/**
 * Параметры для настройки
 */
class ParamSide extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

    }

    handleChange(event, name){

        let value = event.target.value;

        localStorage.setItem(this.props.name+"_"+name, value);

        if(typeof this.props.onChange === "function"){
            this.props.onChange(name, value);
        }
    }


    componentDidMount(){

        // чтение значений из localStorage
        this.props.items.map((item, ind) => {
            if(Object.keys(item).length > 0){
                let storageKey = this.props.name+"_"+item.name;
                let value = localStorage.getItem(storageKey);
                if(value !== null){
                    if(typeof this.props.onChange === "function"){
                        this.props.onChange(item.name, value);
                    }
                }
            }
        });

    }

    render(){

        const { classes } = this.props;

        return (
            <div className={classes.root}>

                {this.props.items.map((item, ind) => {
                    if(Object.keys(item).length > 0){

                        let storageKey = this.props.name+"_"+item.name;

                        let object = null;
                        if(item.type === 'select'){

                            let menuItems = [];
                            if(typeof item.list.length === "undefined"){        // object
                                menuItems = Object.keys(item.list).map((key, ind2) => {
                                    return (
                                        <MenuItem key={ind2} value={key}>{item.list[key]}</MenuItem>
                                    );
                                });
                            } else{                                             // array
                                menuItems = item.list.map((el, ind2) => {
                                    return (
                                        <MenuItem key={ind2} value={ind2}>{el}</MenuItem>
                                    );
                                });
                            }

                            // console.log(item.name, typeof item.list, item.list.length, typeof item.list.length);
                            object = (
                                <FormControl key={ind} variant="outlined" fullWidth margin="dense">
                                    <InputLabel>{item.caption}</InputLabel>
                                    <Select
                                        value={localStorage.getItem(storageKey) ?? item.value}
                                        label={item.caption}
                                        onChange={e => this.handleChange(e, item.name)}
                                    >
                                        {menuItems}
                                    </Select>
                                </FormControl>
                            );
                        } else if(item.type === 'group'){

                            let groupComponent = null;
                            if(typeof item.component !== "undefined"){
                                groupComponent = item.component;
                            }

                            object = (
                                <Paper key={ind} elevation={3}>
                                    <Typography color="textSecondary">{item.caption}</Typography>
                                    {groupComponent}
                                </Paper>
                            );

                        } else{
                            object = (
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
                                    value={localStorage.getItem(storageKey) ?? item.value} 
                                    onChange={e => this.handleChange(e, item.name)} 
                                />
                            );
                        }



                        return object;
                    } else{
                        return ( <hr key={ind}/> );
                    }
                })}

            </div>
        );
    }

}

ParamSide.defaultProps = {
    name: '',                   // имя списка параметров
    items: {},                  // список параметров
    onChange: null,
};

ParamSide.API = API();

export default withStyles(useStyles)(ParamSide);


